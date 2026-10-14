import fs from 'fs';
import path from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const AUDIO_PATH = path.resolve('public/audio/kaash_tu_yahin_hoti.mp3');

async function transcribe() {
  console.log('Reading audio file from:', AUDIO_PATH);
  const audioBuffer = fs.readFileSync(AUDIO_PATH);
  const blob = new Blob([audioBuffer], { type: 'audio/mp3' });

  const formData = new FormData();
  formData.append('file', blob, 'kaash_tu_yahin_hoti.mp3');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('language', 'hi');

  console.log('Sending transcription request to Groq Whisper API...');
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Groq API Error:', res.status, errText);
    process.exit(1);
  }

  const data = await res.json();
  console.log('Groq Transcription Success!');
  console.log('Detected duration:', data.duration);
  console.log('Segments count:', data.segments?.length);
  console.log('Words count:', data.words?.length);

  // Write raw transcript
  fs.writeFileSync('audio_pipeline/transcripts/raw_kaash_tu_yahin_hoti.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('Saved raw transcript to audio_pipeline/transcripts/raw_kaash_tu_yahin_hoti.json');
}

transcribe().catch(err => {
  console.error('Failed to transcribe:', err);
  process.exit(1);
});
