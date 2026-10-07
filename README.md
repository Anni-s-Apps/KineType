# RecipeCut 🎬

**Transcript-to-motion-video web tool.**
Turn English voiceovers into motion graphics: Audio in ➡️ SRT transcription ➡️ LLM prompt handoff ➡️ JSON Recipe ➡️ Live Canvas Preview & Multi-Track Timeline ➡️ MP4 Video Export.

---

## ⚡ Quick Start

### 1. Launch the Web Studio
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in Chrome or any Chromium browser.

To build for production:
```bash
npm run build
npm run preview
```

---

## 🚀 Workflow & Features

### 1. 🎙️ Whisper Transcription (M1)
Run the offline transcription script with Faster-Whisper:
```bash
# Install faster-whisper (if not already installed)
pip install faster-whisper

# Transcribe voiceover audio into full.srt and 30s chunk SRTs
python transcribe/transcribe.py my_voiceover.mp3 --out ./transcripts
```

### 2. ✨ Prompt Builder & SRT Chunker (M1)
- Open the **Prompt Builder** tab in the Left Panel.
- Upload or paste your timed `.srt` file.
- Set target chunk size (~30s recommended).
- Define shared `[ASSETS]` and style locks so images and characters stay consistent across chunks.
- Copy each chunk's prompt to Claude or ChatGPT to generate your motion graphics recipes.
- Use the **Merge Chunk Recipes** tool to combine chunk JSONs into a single timeline.

### 3. 🛡️ Recipe Schema Validator (M2)
- Strict validation for Recipe format v1.
- Identifies unknown layer types, invalid times, and syntax errors.
- Proactively warns for safe-area margin violations (2%), elements shorter than 0.8s, or long visual dead air gaps (>1.2s).

### 4. 🎨 Pure Canvas Renderer & Live Preview (M3)
- Pure deterministic frame rendering: `renderFrame(ctx, recipe, assets, t)`.
- Supports 16:9 widescreen and 9:16 vertical shorts/reels.
- Animation Presets: `fadeUp`, `fadeDown`, `scaleIn`, `popIn`, `bounceIn`, `blurIn`, `slideL`, `slideR`, `typeOn`, `wordIn`, `charFade`, `zoomRotateIn`, `fadeOut`, `scaleOut`, `slideOutL`, etc.
- Camera zooms and pans with per-layer parallax depth.
- Multi-resolution preview quality selector (Full, 1/2, 1/3, 1/4) for smooth playback on 8GB RAM laptops.

### 5. 🖼️ Asset Manager & Persistence (M4)
- Stepper indicator (`0 of N imported`).
- Copy prompt button for each image slot (Midjourney, Recraft, DALL-E).
- Drag-and-drop or file upload into slots with live image previews.
- IndexedDB auto-saving and JSON project save/open.

### 6. 🎬 High-Speed MP4 Video Export (M5)
- In-browser frame-by-frame rendering with `WebCodecs` (`VideoEncoder`) and streaming `mp4-muxer`.
- Frame-accurate voiceover audio track muxing.
- Live progress percentage and ETA.

### 7. ⏱️ Multi-Track Timeline & Inspector (M6 - v2)
- Visual tracks for text, shape, image, card, and camera keyframes.
- Drag to reposition start/end times and drag handles to trim.
- Fine-tune positioning, typography, colors, animations, and dimensions in the Inspector.

---

## ⌨️ Keyboard Shortcuts
- **Space**: Play / Pause
- **Left Arrow / Right Arrow**: Step backward / forward 1 frame
- **Ctrl + Z / Ctrl + Y**: Undo / Redo
- **Ctrl + S**: Save Project JSON
