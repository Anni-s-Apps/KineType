# ⚡ Kinetype Studio

<p align="center">
  <a href="https://github.com/Anni-s-Apps/KineType/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Deterministic-60%20FPS-ff5c35?style=flat-square" alt="60 FPS" />
  <img src="https://img.shields.io/badge/WebCodecs-Hardware%20Accelerated-success?style=flat-square" alt="WebCodecs" />
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
</p>

> **The Open-Source Kinetic Typography & Motion-as-Code Video Engine.**  
> Turn music, voiceovers, and lyrics into cinema-grade 60 FPS motion videos directly in the browser with zero cloud render costs.

---

## 🌟 Highlights

- 🎬 **18 Built-in Kinetic Typography Styles**: Editorial Spring Slam, Multi-Ring Spiral, 3D Vortex, Cyber Glitch, Weightless Float, Comic Pop-Art, Venetian Split, Sine Wave, Neon Tube, Letterpress Stamp, Waterfall Cascade, Jelly Elastic, Swiss Specimen, and more.
- ⚡ **Deterministic 60 FPS WebCodecs Export**: Pure offline frame-by-frame rendering engine with GPU backpressure protection — zero frame drops, zero desync, and full-duration MP4 generation.
- 🎵 **Groq Whisper AI Alignment**: Word-level timestamp synchronization directly in-browser using Groq's high-speed Whisper API.
- 🇮🇳 **Multilingual & Devanagari Support**: Built-in support for Hindi/Devanagari matras and English with crisp typography.
- 🌿 **Procedural Motifs & Overlays**: Real-time canvas overlays including Bonsai trees, botanical ferns, audio waveforms, celestial stars, floating petals, and film grain.
- 🤖 **AI Style Creator Framework**: Includes the Master AI Prompt for Claude, ChatGPT, Cursor, and Windsurf to create new custom animation styles in seconds.
- 📱 **Dual Aspect Ratio Support**: 9:16 Vertical (Shorts, Reels, TikTok) and 16:9 Landscape (YouTube, Cinema).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern Chromium browser (Chrome, Edge, Brave, Arc) with WebCodecs support

### Installation
```bash
git clone https://github.com/Anni-s-Apps/KineType.git
cd KineType
npm install
```

### Launch Studio
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎨 Motion Style Catalog

| Style | Aesthetic | Physics & Interaction |
| :--- | :--- | :--- |
| **Verdict** | Luxury Editorial | Damped harmonic spring entrance + hairline baseline diamond rule |
| **Mask** | Editorial Redaction | Smooth cubic bone tablet wipe with terracotta laser scanline |
| **Spiral** | Continuous Cosmic Flow | Multi-ring Archimedean spiral filling full canvas with zero jhatka |
| **Spiral 2** | 3D Perspective Vortex | Angled elliptical turntable perspective with inward suction |
| **Glitch** | Cybernetic Shutter | High-frequency chromatic RGB split impact & digital scanlines |
| **Float** | Weightless Zero-G | Per-word Lissajous floating harmonic oscillations |
| **Comic** | Pop-Art Graphic Novel | Action speed rays, chunky outlines & punchy squash-and-stretch |
| **Split** | Venetian Blinds | Opposing horizontal split halves with magnetic lock seam |
| **Wave** | Serpentine Sine Wave | Harmonic undulating liquid ribbon with local tangent rotation |
| **Neon** | Tokyo Night Tube | Vintage gas discharge ignition flicker & dual-layer glowing bloom |
| **Stamp** | Letterpress Deboss | Z-axis physical slam down into paper with wax seal badge |
| **Cascade** | Typography Waterfall | Domino gravity tumble with ground impact baseline flare |
| **Elastic** | Rubberband Physics | Exaggerated horizontal stretch with jelly snapback oscillations |
| **Specimen** | Swiss Modernist Grid | Architectural crosshair measurement brackets `[ + ]` |
| **Hook** | Viral Scale Slam | Focal word impact explosion with directional 3D strobe echoes |
| **Mono** | Tactile Terminal | Monospace typewriter with live blinking block cursor |
| **Serif** | Haute Literary | Italic Cormorant Garamond with floating celestial diamond spark |
| **Askew** | Playful Poster Art | Alternating organic angular tilts (-3.5° to +3.5°) + sticker pill |

---

## 🛠️ Architecture & Adding Custom Styles

Every motion style in Kinetype Studio is a pure, self-contained TypeScript function implementing the `StyleRenderContext` interface:

```typescript
import { StyleRenderContext } from './types';

export const renderMyStyle = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C } = ctx;
  if (!curLine) return;

  // c is CanvasRenderingContext2D centered at (0, 0)
  // Clean dynamic wrapping within maxW = W - 180
  // Deterministic 60 FPS continuous math
};
```

### Create with AI
Use our pre-configured [Master AI Prompt Framework](docs/AI_STYLE_CREATOR_PROMPT.md). Simply paste it into Claude, ChatGPT, Cursor, or Windsurf — the AI will interview you about your visual vision and generate a drop-in `.ts` style file ready to run!

---

## 📦 Video Export Engine

Kinetype Studio features a deterministic browser-based rendering pipeline:
1. **Audio Decoding**: Decodes full track audio with Web Audio API.
2. **Audio Encoding**: Encodes AAC audio track via `AudioEncoder` into `mp4-muxer` with queue drainage.
3. **Deterministic Frame Loop**: Advances time $t$ by exactly $1/\text{FPS}$ per frame on an offscreen canvas.
4. **Hardware Backpressure**: Caps `VideoEncoder.encodeQueueSize <= 12` to prevent GPU driver resets and Windows TDR timeouts.
5. **Container Patching**: Automatically patches MP4 duration header to ensure full playback duration across all media players.

---

## 🤝 Contributing & Community

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

- 📖 **New Style Guide**: Check out our [Contributing Guide](CONTRIBUTING.md) to build and submit your own kinetic typography styles.
- 🎵 **Song Pipeline**: Learn how to process, align, and add custom music tracks in the [Audio Pipeline Guide](PIPELINE_GUIDE.md).
- 📜 **Code of Conduct**: Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information. Free for personal and commercial use!

