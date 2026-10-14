# Contributing to KineType Studio 🎨

First off, thank you for considering contributing to **KineType Studio**! Projects like this thrive because of creative developers designing wild typography animations, fine-tuning physics, and improving rendering performance.

---

## 🚀 How to Contribute a New Kinetic Typography Style

Adding a new kinetic style takes under 15 minutes! Every style is a single self-contained TypeScript file in `src/components/studio/styles/`.

### 1. Style Contract Interface
Implement the standard `StyleRenderContext` interface:

```typescript
// src/components/studio/styles/myAwesomeStyle.ts
import { StyleRenderContext, clamp, ease } from './types';

export const renderMyAwesomeStyle = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;

  // 1. Canvas origin (0, 0) is ALREADY centered at the lyric focal point.
  // 2. Wrap text cleanly within maxW = W - 180.
  // 3. Use continuous deterministic math (Math.sin, ease.*) for jitter-free 60 FPS export.
};
```

### 2. Register the Style
1. Export your style in `src/components/studio/styles/index.ts`:
   ```typescript
   export { renderMyAwesomeStyle } from './myAwesomeStyle';
   ```
2. Add your style metadata to `MOTION_STYLES` in `src/components/studio/styles/index.ts`:
   ```typescript
   {
     id: 'myAwesomeStyle',
     label: 'My Awesome Style',
     desc: 'Smooth elastic typography with glowing trail',
     render: renderMyAwesomeStyle,
   }
   ```

### 3. Golden Rules for Styles:
- **Relative Coordinates**: Never assume canvas top-left is (0, 0). The center is already (0, 0).
- **Zero Word Overlap**: Measure words using `c.measureText()` and wrap lines cleanly.
- **Pure Deterministic Math**: Never use `Date.now()` or random `Math.random()` inside the render function. Time `t` is passed in as a deterministic float so 60 FPS offline export renders identical frames.
- **Support Dual Ratios**: Test your style in both **9:16 Portrait** and **16:9 Landscape**.

---

## 🛠️ Local Development Setup

1. Fork & clone the repo:
   ```bash
   git clone https://github.com/Anni-s-Apps/KineType.git
   cd KineType
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Pull Request Guidelines

1. Create a feature branch:
   ```bash
   git checkout -b feat/add-my-style
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat(styles): add myAwesomeStyle with rubberband squash"
   ```
3. Push to your fork and submit a Pull Request to `main`.
4. Include a quick 3-second screen recording / GIF of the animation in your PR description.

Thank you for making open-source motion typography accessible to everyone! ❤️
