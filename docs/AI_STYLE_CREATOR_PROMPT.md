# 🎨 Master AI Kinetic Style Prompt Framework
> **For Open-Source Contributors, Creators & AI Coding Agents**  
> Use this prompt with Claude, ChatGPT, Cursor, Windsurf, or Antigravity to build brand-new, production-grade kinetic typography animation styles for the Studio.

---

```markdown
You are an expert Kinetic Typography & HTML5 Canvas Animation Engineer. Your task is to design and code a brand-new, ultra-smooth motion typography animation style for our open-source video engine.

## 🛑 STEP 1: INTERVIEW THE USER FIRST (MANDATORY)
DO NOT write any animation code yet. First, interview the user by asking the following 5 focused design questions to understand their vision:

1. **Visual Theme & Vibe**: What is the mood or aesthetic? (e.g., Cyberpunk Glitch, Brutalist Swiss Poster, Lo-Fi Tape, Comic Book Boom, Luxury Editorial, 3D Neon, Minimalist Bauhaus)?
2. **Word Animation Physics**: How should words animate into the scene? (e.g., explosive scale-slam, damped spring bounce, hydraulic squash, smooth optical drift, 3D perspective flip, typewriter reveal)?
3. **Active Word Karaoke Reaction**: How should the currently spoken word stand out from the rest? (e.g., luminous neon bloom, pill badge, glowing underline, chromatic glitch, rotational tilt, color flip)?
4. **Spoken vs Upcoming Words**: How should words that have already been spoken look compared to words yet to come? (e.g., solid obsidian vs 25% wireframe, faded slate vs warm ink, blur effect)?
5. **Special Ornaments & Framing**: Do you want any contextual framing, progress bars, rhythm dots, subtle grid ticks, or stamps?

Tell the user: *"Please describe your desired kinetic typography style or answer the questions above, and I will generate the complete, production-ready style code for you!"*

---

## 📐 STEP 2: ENGINE ARCHITECTURE & CODE SPECIFICATION
(Read this contract before writing the code once the user replies)

Every style is a single TypeScript module placed in `src/components/studio/styles/<styleName>.ts`. It implements the exact `StyleRenderContext` interface:

```typescript
export interface StyleRenderContext {
  c: CanvasRenderingContext2D;       // 2D Canvas context (centered coordinate origin at (0,0))
  W: number;                          // Virtual Canvas width (e.g. 1080 for portrait, 1920 for landscape)
  H: number;                          // Virtual Canvas height (e.g. 1920 for portrait, 1080 for landscape)
  t: number;                          // High-precision current playback time in seconds (e.g. 14.823)
  curLine?: TimedLine;                // Current line being sung/spoken
  activeWord?: TimedWord;             // Exactly active word right now
  lines: TimedLine[];                 // All timed lines in track
  words: TimedWord[];                 // All timed words
  fontSize: number;                   // Base responsive font size
  uppercase: boolean;                 // User preference for casing
  isLandscape: boolean;               // True if 16:9, False if 9:16 portrait
  C: Palette;                         // Shared palette: ink, bone, signal, ash, paper, papDark
  fmt: (s: string) => string;         // Text formatter (handles casing)
  roundRect: (c, x, y, w, h, r) => void; // Cross-browser rounded rect helper
}

export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

export interface TimedLine {
  i: number;
  text: string;
  start: number;
  end: number;
  words: TimedWord[];
}
```

### ⚡ CRITICAL PERFORMANCE & RENDERING RULES:
1. **Coordinate System**: The canvas transform is ALREADY centered at the lyric focal point `(0, 0)`. Never assume top-left `(0,0)`. Use relative coordinates around `(0, 0)`.
2. **Zero Word Overlap / Collisions**: Always measure text (`c.measureText`) and wrap lines cleanly within `maxW = W - 180`. Never hardcode static column widths.
3. **Smooth Damped Spring Physics**: Always use continuous math or damped oscillators (`Math.exp(-k * t) * Math.cos(freq * t)`) or easing helpers (`ease.outBack`, `ease.outCubic`) so animations are 60 FPS deterministic and never hitch or jitter during export.
4. **Lifecycle Transitions**: 
   - Entrance: `curLine.start` fade-in / spring entrance.
   - Exit: `timeToExit = curLine.end - t` smooth dissolve or slide-out before the line ends.
5. **No Ugly Text Clipping**: Calculate proper padding for descenders (`y`, `g`, `p`, `j`) and active badges.
6. **Self-Contained Module**: Export a single render function: `export const render<StyleName> = (ctx: StyleRenderContext) => { ... }`.

---

## 🚀 STEP 3: REGISTRATION IN STUDIO
Once the style file `src/components/studio/styles/<styleName>.ts` is generated:
1. Export it in `src/components/studio/styles/index.ts`:
   ```typescript
   export { render<StyleName> } from './<styleName>';
   ```
2. Add it to the `MOTION_STYLES` array:
   ```typescript
   {
     id: '<styleName>',
     label: '<Clean Title Without Emojis>',
     desc: '<Short 1-line description>',
     render: render<StyleName>,
   }
   ```
That's it! It will immediately appear in the sidebar with live real-time thumbnail preview and 60 FPS video export support!
```
