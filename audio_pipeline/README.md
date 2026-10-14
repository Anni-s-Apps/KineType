# 🎵 Audio-to-Video Workflow Pipeline

Use this pipeline to batch or organize audio tracks you want videos made for:

```
audio_pipeline/
├── input_queue/     # Drop raw audio files here (MP3, WAV, M4A)
├── transcripts/     # Generated word-level timestamp JSONs
└── completed/       # Finished songs moved here once video is generated
```

## How to use:
1. **Drop Track**: Put your song audio into `audio_pipeline/input_queue/`.
2. **Transcribe**: We transcribe it using Groq Whisper AI to get word-level alignment (supports English, Hindi, Hinglish, etc.).
3. **Studio Video**: Preview, customize motion styles, and render/export 60 FPS video.
4. **Complete**: Move the finished track to `audio_pipeline/completed/`.
