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
 * Transcribes an audio Blob or File using Groq Cloud Whisper API (whisper-large-v3)
 */
export async function transcribeWithGroq(
  audioBlob: Blob | File,
  apiKey: string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API error (${res.status}): ${res.statusText}`);
  }

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
    engine: 'Groq Whisper (whisper-large-v3)',
  };
}

/**
 * Transcribes an audio Blob or File using OpenAI Whisper API
 */
export async function transcribeWithOpenAI(
  audioBlob: Blob | File,
  apiKey: string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error (${res.status}): ${res.statusText}`);
  }

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
