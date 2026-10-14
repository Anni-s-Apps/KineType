# 🎵 Kinetype Studio — New Song Processing Guide (Pipeline SOP)

Ye guide humesha yaad rakhne ke liye hai ki jab bhi **naya audio file** aaye, to video banane ke liye kya-kya steps follow karne hain. Sab kuch ready aur automated hai!

---

## ⚡ QUICK METHOD (1-Command Automation)

Jab bhi naya audio file mile, bas yeh single command run karo:

```powershell
node scripts/process_new_song.mjs "C:\path\to\your_song.mp3" hi "Song Title"
```

Ya fir gaane ko folder me drop karo:
1. Audio file ko `audio_pipeline/input_queue/` folder me daalo.
2. Terminal me run karo:
```powershell
node scripts/process_new_song.mjs
```

### ✨ Script automatically kya-kya karta hai:
1. Groq Whisper Large-v3 API ko audio bhejta hai.
2. Har ek word ka micro-level timestamp (`start` & `end`) nikalta hai.
3. Natural lines me group karke `src/data/<song_name>.json` bana deta hai.
4. Audio ko `public/audio/<song_name>.mp3` me copy kar deta hai.
5. Backup ke liye `audio_pipeline/completed/` me move kar deta hai.
6. `audio_pipeline/input_queue/` ko clean kar deta hai.

---

## 🛠️ MANUAL / DETAILED STEP-BY-STEP (Emergency SOP)

Agar kabhi manually karna ho, to yeh 5 steps hain:

### STEP 1: Audio File Placement
Audio file ko do jagah copy karein:
* `public/audio/<song_name>.mp3` (Browser audio element ke liye)
* `audio_pipeline/input_queue/<song_name>.mp3` (Processing queue)

```powershell
Copy-Item "C:\path\to\song.mp3" "public\audio\my_song.mp3"
```

---

### STEP 2: Groq Whisper Transcription
Groq Whisper Large-v3 model se word-level timestamps fetch karein:
* Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
* Model: `whisper-large-v3`
* Options:
  - `response_format`: `verbose_json`
  - `timestamp_granularities[]`: `word`
  - `timestamp_granularities[]`: `segment`
  - `language`: `hi` (Hindi) ya `en` (English)
* Script: `node scripts/transcribe_groq.mjs`

---

### STEP 3: Dataset Formatting (`src/data/<song_name>.json`)
Kinetype Studio ko exactly yeh JSON format chahiye hota hai:

```json
{
  "title": "Song Title 🎵",
  "duration": 210.5,
  "audioUrl": "/audio/my_song.mp3",
  "words": [
    { "word": "नमस्ते", "start": 1.2, "end": 1.8 }
  ],
  "lines": [
    {
      "i": 0,
      "text": "नमस्ते दोस्तों",
      "start": 1.2,
      "end": 3.4,
      "words": [
        { "w": "नमस्ते", "start": 1.2, "end": 1.8 },
        { "w": "दोस्तों", "start": 1.8, "end": 3.4 }
      ]
    }
  ]
}
```

---

### STEP 4: ShortsStudio.tsx me Connect Karna
`src/components/studio/ShortsStudio.tsx` me:

1. Import add karein:
```typescript
import mySongData from '../../data/my_song.json';
```

2. `handleLoadDemoSong` me case add karein:
```typescript
const data = songKey === 'mysong' ? mySongData : ...;
```

3. Top Bar ya Sidebar switcher me button add karein:
```tsx
<button onClick={() => handleLoadDemoSong('mysong')}>
  <span>Demo 3</span>
</button>
```

---

### STEP 5: MP4 Video Export (Deterministic 60 FPS)
Studio UI kholo:
1. `http://localhost:3000/` par browser me open karein.
2. Apna favorite kinetic typography style chunein:
   - `verdict`, `spiral`, `glitch`, `hook`, `elastic`, `wave`, etc.
3. Aspect ratio choose karein: **9:16 Portrait** ya **16:9 Landscape**.
4. **Export MP4 (60fps)** par click karein.
5. Deterministic canvas renderer frame-by-frame 60 FPS video render karke download de dega!

---

## 📁 Folder Structure Reference

```
audio_pipeline/
├── input_queue/      # Naye aane wale audio files yahan rakhein
├── completed/        # Jo audio process ho chuke hain unka backup
├── transcripts/      # Raw & aligned JSON transcripts ka backup
└── PIPELINE_GUIDE.md # Ye guide file

public/
└── audio/
    ├── better_on_my_own.mp3    # Demo 1 (English)
    └── kaash_tu_yahin_hoti.mp3 # Demo 2 (Hindi)

src/data/
├── defaultSong.json         # Demo 1 lyrics data
└── kaashTuYahinHoti.json    # Demo 2 lyrics data
```
