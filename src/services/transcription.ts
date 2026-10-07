/**
 * AI Audio-to-Transcript (SRT) Transcription Service
 * Supports Groq Whisper (Free & Instant ~300x realtime), OpenAI Whisper, and Web Speech API
 */

export interface TranscriptCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  srtContent: string;
  cues: TranscriptCue[];
  duration: number;
  engine: string;
}

/**
 * Converts seconds (e.g. 65.432) to SRT timestamp format (00:01:05,432)
 */
export function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Builds standard SRT text from an array of TranscriptCue objects
 */
export function buildSrtString(cues: TranscriptCue[]): string {
  return cues
    .map((cue, idx) => {
      const startStr = formatSrtTime(cue.startTime);
      const endStr = formatSrtTime(cue.endTime);
      return `${idx + 1}\n${startStr} --> ${endStr}\n${cue.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Downsamples any audio Blob to a lightweight 16kHz Mono 16-bit PCM WAV Blob.
 * 16kHz Mono reduces audio payload by ~85% (e.g. 15MB -> 1.5MB), preventing Groq size limits & timeouts.
 */
export async function downsampleAudioForWhisper(
  audioBlobOrFile: Blob | File,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  try {
    onProgress?.('Downsampling to 16kHz Mono...');
    console.log('[Whisper] Starting audio downsampling for Whisper...');
    const arrayBuffer = await audioBlobOrFile.arrayBuffer();
    
    // Standard AudioContext to decode whatever format the audio is
    const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    await decodeCtx.close();

    // Use OfflineAudioContext to resample directly to 16000Hz Mono
    const targetSampleRate = 16000;
    const targetLength = Math.ceil(decoded.duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampledBuffer = await offlineCtx.startRendering();
    const channelData = resampledBuffer.getChannelData(0);

    const length = channelData.length * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);

    let pos = 0;
    const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };
    const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };

    // RIFF
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // FMT
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(1); // mono
    setUint32(targetSampleRate);
    setUint32(targetSampleRate * 2);
    setUint16(2);
    setUint16(16);

    // DATA
    setUint32(0x61746164); // "data"
    setUint32(channelData.length * 2);

    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      pos += 2;
    }

    const resultBlob = new Blob([outBuffer], { type: 'audio/wav' });
    console.log(`[Whisper] Audio optimized: ${(audioBlobOrFile.size / 1024 / 1024).toFixed(2)}MB -> ${(resultBlob.size / 1024 / 1024).toFixed(2)}MB`);
    return resultBlob;
  } catch (err) {
    console.warn('[Whisper] Downsampling failed, fallback to original blob:', err);
    return audioBlobOrFile;
  }
}

/**
 * Transcribes an audio Blob or File using Groq Cloud Whisper API (whisper-large-v3)
 */
export async function transcribeWithGroq(
  audioBlob: Blob | File,
  apiKey: string,
  onProgress?: (msg: string) => void,
  signal?: AbortSignal
): Promise<TranscriptionResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Groq API Key is empty. Please enter your API key.');
  }

  // 1. Optimize audio payload to 16kHz mono WAV
  const optimizedBlob = await downsampleAudioForWhisper(audioBlob, onProgress);
  const sizeMB = (optimizedBlob.size / (1024 * 1024)).toFixed(2);
  onProgress?.(`Uploading payload (${sizeMB} MB) to Groq Whisper...`);
  console.log(`[Groq Whisper] Sending ${sizeMB} MB to Groq API with key prefix: ${cleanKey.slice(0, 7)}...`);

  const formData = new FormData();
  formData.append('file', optimizedBlob, 'audio.wav');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');

  const startTime = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanKey}`,
    },
    body: formData,
    signal,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Groq Whisper] Response status: ${res.status} in ${elapsed}s`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errMessage = errorData.error?.message || `Groq API HTTP ${res.status}: ${res.statusText}`;
    console.error('[Groq Whisper Error]', res.status, errorData);
    throw new Error(errMessage);
  }

  onProgress?.('Parsing timestamped segments...');
  const data = await res.json();
  const segments = data.segments || [];

  const cues: TranscriptCue[] = segments.map((seg: any, idx: number) => ({
    id: idx + 1,
    startTime: Math.max(0, seg.start || 0),
    endTime: Math.max(seg.start || 0, seg.end || seg.start + 2),
    text: (seg.text || '').trim(),
  }));

  const srtContent = buildSrtString(cues);
  console.log(`[Groq Whisper] Success! Generated ${cues.length} cues in ${elapsed}s`);

  return {
    fullText: data.text || cues.map((c) => c.text).join(' '),
    srtContent,
    cues,
    duration: data.duration || (cues.length > 0 ? cues[cues.length - 1].endTime : 0),
    engine: 'Groq Whisper (whisper-large-v3)',
  };
}

/**
 * Transcribes an audio Blob or File using OpenAI Whisper API
 */
export async function transcribeWithOpenAI(
  audioBlob: Blob | File,
  apiKey: string,
  onProgress?: (msg: string) => void,
  signal?: AbortSignal
): Promise<TranscriptionResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('OpenAI API Key is empty.');
  }

  const optimizedBlob = await downsampleAudioForWhisper(audioBlob, onProgress);
  const sizeMB = (optimizedBlob.size / (1024 * 1024)).toFixed(2);
  onProgress?.(`Uploading payload (${sizeMB} MB) to OpenAI...`);

  const formData = new FormData();
  formData.append('file', optimizedBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const startTime = Date.now();
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanKey}`,
    },
    body: formData,
    signal,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API HTTP ${res.status}: ${res.statusText}`);
  }

  onProgress?.('Parsing timestamped segments...');
  const data = await res.json();
  const segments = data.segments || [];

  const cues: TranscriptCue[] = segments.map((seg: any, idx: number) => ({
    id: idx + 1,
    startTime: Math.max(0, seg.start || 0),
    endTime: Math.max(seg.start || 0, seg.end || seg.start + 2),
    text: (seg.text || '').trim(),
  }));

  const srtContent = buildSrtString(cues);

  return {
    fullText: data.text || cues.map((c) => c.text).join(' '),
    srtContent,
    cues,
    duration: data.duration || (cues.length > 0 ? cues[cues.length - 1].endTime : 0),
    engine: 'OpenAI Whisper-1',
  };
}

/**
 * In-browser Web Speech API transcription fallback (offline / keyless)
 */
export async function transcribeWithBrowserSpeech(
  audioUrl: string,
  audioDuration: number
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(
        new Error(
          'Web Speech API is not supported in this browser. Please use Groq Whisper (free key) or OpenAI Whisper.'
        )
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const cues: TranscriptCue[] = [];
    const startTime = Date.now();

    const audio = new Audio(audioUrl);

    recognition.onresult = (event: any) => {
      const now = (Date.now() - startTime) / 1000;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          const prevEnd = cues.length > 0 ? cues[cues.length - 1].endTime : 0;
          cues.push({
            id: cues.length + 1,
            startTime: prevEnd,
            endTime: Math.min(audioDuration || 60, Math.max(prevEnd + 1.5, now)),
            text,
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      audio.pause();
      if (cues.length > 0) {
        const srtContent = buildSrtString(cues);
        resolve({
          fullText: cues.map((c) => c.text).join(' '),
          srtContent,
          cues,
          duration: audioDuration,
          engine: 'Browser Web Speech API',
        });
      } else {
        reject(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      audio.pause();
      const srtContent = buildSrtString(cues);
      resolve({
        fullText: cues.map((c) => c.text).join(' '),
        srtContent,
        cues,
        duration: audioDuration,
        engine: 'Browser Web Speech API',
      });
    };

    audio.play().catch(() => {});
    recognition.start();

    audio.onended = () => {
      setTimeout(() => recognition.stop(), 500);
    };
  });
}
