// ─── Shared Motion Styles Types & Utilities ──────────────────────────────────

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

export interface Palette {
  ink: string;
  bone: string;
  signal: string;
  ash: string;
  paper: string;
  papDark: string;
}

export const C: Palette = {
  ink: '#1a1209',      // near-black warm ink
  bone: '#e8dcc8',     // warm off-white
  signal: '#c94f00',   // burnt-orange signal
  ash: '#7a6e5f',      // warm mid grey
  paper: '#f4edd8',    // cream paper
  papDark: '#e0d4bc',  // slightly darker paper
};

export interface StyleRenderContext {
  c: CanvasRenderingContext2D;
  W: number;
  H: number;
  t: number;
  curLine?: TimedLine;
  activeWord?: TimedWord;
  lines: TimedLine[];
  words: TimedWord[];
  fontSize: number;
  uppercase: boolean;
  isLandscape: boolean;
  C: Palette;
  fmt: (s: string) => string;
  roundRect: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => void;
}

export interface MotionStyleDefinition {
  id: string;
  label: string;
  desc: string;
  render: (ctx: StyleRenderContext) => void;
}

// ── Math & easing helpers
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ease = {
  outExpo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outBack: (x: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  inCubic: (x: number) => x * x * x,
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
};
export const pulse = (t: number, t0: number, hw: number) => Math.max(0, 1 - Math.abs(t - t0) / hw);
