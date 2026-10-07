# PRD: RecipeCut (working name)
Transcript-to-motion-video web tool. Audio in, SRT, LLM-generated "recipe", live canvas preview, timeline editor, MP4 export.

Owner: DevStudio Labs (solo dev). Target machine: 8 GB RAM laptop. Primary platform: web (HTML + Canvas + JS).

---

## 1. Goal
Let a creator turn an English voiceover (6-10 min) into a motion-graphics video:
1. Generate an accurate timed transcript (SRT) locally.
2. Build chunked prompts that an LLM (Claude/ChatGPT) turns into a structured "recipe".
3. Paste the recipe back, preview it frame-accurately, fine-tune on a timeline, export MP4.

Non-goals (v1): login/accounts, payments, mobile app, multi-language voiceover, built-in LLM calls, team collaboration.

## 2. Reference findings (what the reference product, LogiCut, does)
Observed from screenshots. Use as inspiration for flow and features; do NOT copy its code, prompts or exact recipe syntax.

**Home:** two entry points ("I have code", "Get code"), recent projects (name, age, aspect ratio, auto-saved, long-press delete), How it works, Subscription, Get the app, logout.

**Get code:** transcript textarea or .txt/.srt upload; warning to use ~30 s chunks and an SRT for timing; warning when text has no timestamps; aspect ratio (16:9, 9:16); frame rate (30, 60); "edit style" list loaded from a database (5 styles: two no-assets styles, one composed-with-assets style, two motion-graphics styles); Get Prompt produces a "handoff" with Copy prompt, Download .txt, Show prompt (about 49.5k characters), then "Open the editor".

**Editor:**
- Top bar: back, undo/redo, format chip (16:9 · 1080p · 30/60fps), Export.
- Right panel tabs: "3D Cam" (add text/shape/image/video/audio) and "Code" (paste ASSETS + RECIPE, Save project, Open project, Apply & preview).
- Left panel tabs: Assets (stepper "0 of 5 imported", shows each image prompt with Copy prompt and Import image; import maps by slot, no renaming needed) and Layer (inspector).
- Preview: play, scrub, length field, preview quality (Full, 1/2, 1/3, 1/4, 1/5; export is always full), Fit to layers, zoom.
- Timeline: camera keyframe row (in/out zoom steps), one track per layer (scene, shapes, images, text), drag to move, drag edge to trim, multi-select, Keyframe button, zoom controls. Actions: Cut here, Duplicate, Hide, Delete.
- Layer inspector sections: Timing (start/end), Position (X/Y with keyframe diamonds), Size (width, height, scale, opacity, rotation), Depth & Layer (parallax depth 0-1, to front/forward/backward/to back, z-order), Effects (shadow, glow, blur, bevel, corner radius), Animation (entrance list, exit list, emphasis list), Shape, Colour.
- Export: on-device render with progress %, Stop, "you can switch tabs", 1920x1080 at 60 fps, constant 20 Mbit/s.

## 3. Our differentiators
- Built-in **Whisper transcription** (no external step), English only.
- **Auto-chunking** of long videos with a shared asset list and style so images match across chunks.
- **JSON recipe** (robust parsing, validation errors shown to user) instead of a fragile free-text syntax.
- Runs fully in the browser on a low-spec laptop.

## 4. Scope

### v1 (must have)
1. Transcribe: Python script/CLI (`faster-whisper`, `small.en`, int8) producing `full.srt` and `chunk_NN.srt`.
2. Prompt Builder web page (already built: `prompt-builder.html`): rules prompt, SRT paste/upload, settings, chunking, assets reuse block, per-chunk copy.
3. Recipe format v1 (JSON, section 7) plus validator with readable errors.
4. Asset manager: list of required images with prompts, import by slot, thumbnails.
5. Canvas renderer: text, image, shape (rect, pill, circle, ring, line, arrow, check), card; position, size, opacity, rotation, scale; entrances/exits; camera zoom/pan; deterministic `renderFrame(t)`.
6. Preview player: play/pause/scrub, quality levels (full, 1/2, 1/4).
7. Project save/open (JSON file) plus autosave to IndexedDB.
8. Export MP4 at 1080p, 30 fps, with the user's voiceover audio muxed in.

### v2
- Timeline editor: drag/trim layers, inspector panel, keyframes on x/y/scale/opacity/rot, undo/redo.
- 60 fps and 9:16 export.
- Multiple edit styles (stored as prompt templates).
- Caption/subtitle layer from SRT.

### Later
- Direct LLM API call (user's own key), image generation integration, templates marketplace, mobile app.

## 5. User flow
1. User runs the transcribe script on their audio, gets `full.srt` plus chunks.
2. Opens Prompt Builder, pastes rules prompt (saved locally), loads SRT, picks aspect/fps, builds prompts.
3. Copies chunk 1 prompt to an LLM, receives `[ASSETS]` and recipe JSON.
4. Pastes assets block back for chunks 2..N so images are reused; collects recipes.
5. Opens the editor, pastes/merges chunk recipes (each with a time offset), imports generated images.
6. Previews, fixes issues, exports MP4.

## 6. Functional requirements

### 6.1 Prompt Builder (exists)
Keep as is. Add: "merge chunks" helper that offsets each chunk recipe by its start time; export prompt as .txt.

### 6.2 Recipe validator
- Reject unknown layer types/keys with a message naming the layer id and field.
- Warn (not fail) on: element outside 2% safe area, layer shorter than 0.8 s, gap over 1.2 s with no visible event, missing asset file.
- Never fail silently (a known weakness of text-DSL approaches).

### 6.3 Renderer
- Pure function of time: `renderFrame(ctx, recipe, assets, t)`; no state between frames, so seeking and export are exact.
- Coordinates are fractions of the frame; sizes above 4 are px in a 1080 short-side frame (keeps layouts identical across aspect ratios).
- Easing library: easeOut, easeInOut, linear, hold; keyframe interpolation per property.
- Entrance/exit presets implemented as functions of normalized progress (fadeUp, scaleIn, popIn, blurIn, slideL/R, typeOn, wordIn, charFade, etc.).
- Camera: global transform (zoom, x, y) with per-layer depth factor for parallax.
- Fonts: bundle 2 web fonts (display + sans), load before first render.

### 6.4 Export
- Preferred: WebCodecs `VideoEncoder` + a JS MP4 muxer, frames rendered one by one, audio from the user's file muxed in. Streams to disk; never holds all frames in memory.
- Fallback: `MediaRecorder` on a canvas capture stream (WebM).
- Show progress %, ETA, Stop. Block timeline edits while exporting.
- Acceptance: 6-minute 1080p30 export completes on an 8 GB laptop without the tab crashing.

### 6.5 Projects
- Project = recipe JSON + asset images + audio reference + settings. Save as `.zip`/`.json`; autosave to IndexedDB every few seconds.

## 7. Recipe format v1 (proposal, own syntax)
```json
{
  "version": 1,
  "settings": { "aspect": "16:9", "fps": 30, "duration": 28.0 },
  "scene": { "bg": "#06121A", "accent": "#10222E", "vignette": 0.6 },
  "assets": [
    { "id": "dev", "file": "dev_right.png", "aspect": "1:2", "transparent": true,
      "prompt": "<style lock>. A young developer ..., facing right. Aspect ratio 1:2." }
  ],
  "camera": [
    { "start": 0, "end": 5.9, "x": 0.5, "y": 0.5, "zoom": 1.03 }
  ],
  "layers": [
    { "id": "t1", "type": "text", "text": "Coding the\nwrong way",
      "start": 0.55, "end": 6.2, "x": 0.58, "y": 0.24, "w": 0.3,
      "size": 64, "weight": 800, "color": "#FFFFFF", "align": "left",
      "in": "wordIn", "out": "fadeOut", "z": 4 },
    { "id": "i1", "type": "image", "asset": "dev", "start": 0.15, "end": 6.24,
      "x": 0.25, "y": 0.72, "w": 0.17, "anchor": "bottom", "in": "fadeUp", "out": "fadeOut", "z": 8 },
    { "id": "s1", "type": "shape", "kind": "rect", "start": 2.45, "end": 6.0,
      "x": 0.47, "y": 0.34, "w": 8, "h": 6, "color": "#35D6C0",
      "growTo": { "prop": "w", "from": 8, "to": 330, "t0": 2.45, "t1": 2.8, "pinLeft": true } }
  ]
}
```
Rules: times in seconds (floats), `x`/`y` are element centres as frame fractions, `w`/`h`/`size` follow the unit rule (4 or below = fraction, above 4 = px). LLM is told to return JSON only; validator reports errors by layer id. Keep the layer type list small in v1 and grow it.

## 8. Architecture
- Frontend: single-page web app, vanilla JS or Vite + TypeScript. Modules: `recipe/` (schema, validator, merge), `render/` (frame function, easing, presets), `player/`, `export/`, `assets/`, `store/` (IndexedDB), `ui/`.
- No backend required. Whisper runs as a local Python CLI (later optional: whisper.cpp WASM).
- Dev environment: VS Code + browser. No emulator or heavy SDK needed.

## 9. Non-functional requirements
- Runs on 8 GB RAM; preview at 1/2 resolution by default on slow machines; target 30 fps preview at 1080p for simple scenes.
- Deterministic output: same recipe gives identical frames.
- Offline-capable after first load.
- LLM-generated code/JSON is data only; never `eval` it. Render only from the validated schema.
- All user files stay on device.

## 10. Milestones and "done" criteria
| # | Deliverable | Done when |
|---|---|---|
| M1 | Transcribe script + Prompt Builder | 6-min audio gives `full.srt` + chunks; prompts copy correctly (mostly done) |
| M2 | Recipe schema + validator + merge | Valid sample passes; 10 broken samples each give a clear error naming the layer |
| M3 | Renderer: text, image, shape, card, presets, camera | Sample recipe plays in browser; scrubbing to any t shows the correct frame |
| M4 | Asset manager + project save/open | Import 5 images by slot; reload page without losing work |
| M5 | Export MP4 with audio | 28 s sample exports and plays in VLC with audio in sync; then a 6-min sample exports without crashing |
| M6 | Timeline editor (v2) | Drag/trim layers, inspector edits, undo/redo, keyframes |

## 11. Risks
- LLM output quality varies by chunk: mitigate with validator, "fix this error" re-prompt helper, and a shared style lock/asset list.
- Export performance on 8 GB: stream frames; test early (M5 before M6).
- Style drift across chunks: always send the same asset list and style lock.
- Long prompts (rules are tens of thousands of characters): keep the rules prompt compact and test on both Claude and ChatGPT.

## 12. Legal / IP
- Write original prompts, schema, presets and code. Do not copy the reference product's prompts, recipe syntax or bundled code.
- Use only fonts and libraries with licences that allow redistribution.

## 13. Open questions
1. Final product name and whether it will be public or personal-use only.
2. Free vs paid model, if public.
3. Keep image generation manual (copy prompt, import file) or integrate an API later.
4. Which edit styles to ship first (suggested: one no-assets style and one composed-with-assets style).

## 14. Instructions for the building agent
- Build in the milestone order above; finish and test each before the next.
- Start from the existing `prompt-builder.html`; do not rewrite it.
- Keep dependencies minimal; prefer browser APIs.
- After each milestone, list what was tested and what is known broken.
