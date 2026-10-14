#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KINETYPE AUTOMATED AUDIO PIPELINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scripts/process_new_song.mjs "<path-to-audio.mp3>" [language: 'en'|'hi'|'auto'] [title]
 *
 * Example:
 *   node scripts/process_new_song.mjs "audio_pipeline/input_queue/my_song.mp3" hi "Mera Pehla Gaana"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  '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';

async function main() {
  const args = process.argv.slice(2);
  let audioInput = args[0];
  const lang = args[1] || 'auto';
  const customTitle = args[2];

  // If no audio path given, check input_queue for files
  if (!audioInput) {
    const queueFiles = fs.existsSync('audio_pipeline/input_queue')
      ? fs.readdirSync('audio_pipeline/input_queue').filter(f => /\.(mp3|wav|m4a|aac)$/i.test(f))
      : [];
    if (queueFiles.length > 0) {
      audioInput = path.join('audio_pipeline/input_queue', queueFiles[0]);
      console.log(`[Auto-Detected] Found audio in input_queue: ${audioInput}`);
    } else {
      console.error('❌ Error: No audio file provided and input_queue is empty.');
      console.log('Usage: node scripts/process_new_song.mjs "<path-to-audio.mp3>" [language] [title]');
      process.exit(1);
    }
  }

  const resolvedPath = path.resolve(audioInput);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: Audio file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  const originalName = path.basename(resolvedPath);
  const baseNameNoExt = path.parse(originalName).name;
  const slug = baseNameNoExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'track';

  const title = customTitle || baseNameNoExt.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const destAudioName = `${slug}.mp3`;
  const publicAudioPath = path.join('public/audio', destAudioName);
  const completedAudioPath = path.join('audio_pipeline/completed', destAudioName);
  const transcriptPath = path.join('audio_pipeline/transcripts', `${slug}.json`);
  const dataPath = path.join('src/data', `${slug}.json`);

  console.log('───────────────────────────────────────────────────');
  console.log(`🎵 Processing Track: "${title}"`);
  console.log(`📁 Source: ${resolvedPath}`);
  console.log(`🌐 Target Language: ${lang}`);
  console.log('───────────────────────────────────────────────────');

  // Ensure directories exist
  for (const dir of ['public/audio', 'audio_pipeline/completed', 'audio_pipeline/transcripts', 'src/data']) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // Read audio buffer
  console.log('📦 Reading audio file...');
  const audioBuffer = fs.readFileSync(resolvedPath);
  const blob = new Blob([audioBuffer], { type: 'audio/mp3' });

  // Call Groq Whisper API
  console.log('⚡ Calling Groq Whisper-Large-v3 API for word-level timestamps...');
  const formData = new FormData();
  formData.append('file', blob, destAudioName);
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');
  if (lang && lang !== 'auto') {
    formData.append('language', lang);
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('❌ Groq API Error:', res.status, errText);
    process.exit(1);
  }

  const raw = await res.json();
  console.log(`✅ Transcription received! Duration: ${raw.duration.toFixed(1)}s, Words: ${raw.words?.length || 0}`);

  // Format into Kinetype TimedLine and TimedWord structure
  const rawWords = (raw.words || []).map(w => ({
    word: (w.word || '').trim(),
    start: Number(w.start.toFixed(2)),
    end: Number(w.end.toFixed(2)),
  })).filter(w => w.word.length > 0);

  // Group into clean lines based on Whisper segments or pauses
  const lines = [];
  if (raw.segments && raw.segments.length > 0) {
    raw.segments.forEach((seg, idx) => {
      const segText = seg.text ? seg.text.trim() : '';
      if (!segText) return;
      const segWords = rawWords.filter(w => w.start >= seg.start - 0.2 && w.end <= seg.end + 0.3);
      lines.push({
        i: idx,
        text: segText,
        start: Number(seg.start.toFixed(2)),
        end: Number(seg.end.toFixed(2)),
        words: segWords.length > 0
          ? segWords.map(w => ({ w: w.word, start: w.start, end: w.end }))
          : segText.split(/\s+/).map((word, wIdx, arr) => {
              const dur = (seg.end - seg.start) / arr.length;
              return {
                w: word,
                start: Number((seg.start + wIdx * dur).toFixed(2)),
                end: Number((seg.start + (wIdx + 1) * dur).toFixed(2)),
              };
            }),
      });
    });
  }

  const songDataset = {
    title,
    duration: Number(raw.duration.toFixed(2)),
    audioUrl: `/audio/${destAudioName}`,
    words: rawWords,
    lines,
  };

  // Write outputs
  fs.writeFileSync(transcriptPath, JSON.stringify(songDataset, null, 2), 'utf-8');
  fs.writeFileSync(dataPath, JSON.stringify(songDataset, null, 2), 'utf-8');
  fs.copyFileSync(resolvedPath, publicAudioPath);
  fs.copyFileSync(resolvedPath, completedAudioPath);

  // If the file was in input_queue, clean it up
  if (resolvedPath.includes('input_queue') && resolvedPath !== completedAudioPath) {
    try {
      fs.unlinkSync(resolvedPath);
      console.log('🧹 Cleaned from audio_pipeline/input_queue/');
    } catch (e) {
      // ignore
    }
  }

  console.log('───────────────────────────────────────────────────');
  console.log('🎉 Track Successfully Processed & Ready!');
  console.log(`📄 Dataset saved: ${dataPath}`);
  console.log(`🔊 Public Audio: ${publicAudioPath}`);
  console.log(`💾 Backup Completed: ${completedAudioPath}`);
  console.log('───────────────────────────────────────────────────');
  console.log('👉 To use in ShortsStudio.tsx, add:');
  console.log(`import ${slug}Data from '../../data/${slug}.json';`);
  console.log('───────────────────────────────────────────────────');
}

main().catch(err => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
