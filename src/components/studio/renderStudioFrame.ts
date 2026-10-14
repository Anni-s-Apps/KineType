import { C, TimedWord, TimedLine, renderMotionStyle } from './styles';
import { renderGraphicsOverlay } from './graphics';

export interface RenderStudioFrameOptions {
  c: CanvasRenderingContext2D;
  W: number;
  H: number;
  t: number;
  isLandscape: boolean;
  songTitle: string;
  lines: TimedLine[];
  words: TimedWord[];
  motionStyle: string;
  fontSize: number;
  uppercase: boolean;
  activeGraphics: string[];
  isPlaying?: boolean;
}

export const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/**
 * Pure deterministic frame renderer for both live preview and offline 60fps export
 */
export function renderStudioFrame(options: RenderStudioFrameOptions) {
  const {
    c,
    W,
    H,
    t,
    isLandscape,
    songTitle,
    lines,
    words,
    motionStyle,
    fontSize,
    uppercase,
    activeGraphics,
    isPlaying = true,
  } = options;

  // 1. Warm Paper Canvas Background
  c.fillStyle = C.paper;
  c.fillRect(0, 0, W, H);

  // Warm subtle radial vignette
  const vig = c.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(40,25,8,0.05)');
  vig.addColorStop(1, 'rgba(40,25,8,0.18)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  // 1.5 Graphic Overlays (Corners, Waveform, Particles, Stars, Flora, Bonsai, Fern, Butterfly)
  renderGraphicsOverlay(activeGraphics, {
    c,
    W,
    H,
    t,
    isLandscape,
    songTitle,
    C,
    isPlaying,
  });

  // Active timing and text formatting
  const curLine =
    lines.find(l => t >= l.start && t < l.end) ||
    lines.find(l => l.start <= t && l.end >= t - 0.5);
  const activeWord = words.find(w => t >= w.start && t < w.end);
  const fmt = (s: string) => (uppercase ? s.toUpperCase() : s);

  // 2. Center Kinetic Zone
  c.save();
  c.translate(W * 0.5, H * 0.44);

  if (!curLine) {
    // Musical rest symbol during pauses
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const breathY = Math.sin(t * 1.4) * 16;
    c.font = `italic 400 48px "Cormorant Garamond", serif`;
    c.fillStyle = 'rgba(26,18,9,0.35)';
    c.fillText('♩', 0, breathY);
  } else {
    // Dispatch to modular motion style
    renderMotionStyle(motionStyle, {
      c,
      W,
      H,
      t,
      curLine,
      activeWord,
      lines,
      words,
      fontSize,
      uppercase,
      isLandscape,
      C,
      fmt,
      roundRect,
    });
  }
  c.restore();

  // 3. Bottom Caption Subtitle Line (clean, zero overlap with graphics/waveform)
  if (curLine) {
    // Positioned cleanly near bottom margin below any audio waveform bars
    const capY = isLandscape ? H - 60 : H - 90;

    // Draw words with spoken/active coloring — NO opaque background fog
    const baseCapSz = isLandscape ? 30 : 38;
    c.font = `700 ${baseCapSz}px "Archivo", sans-serif`;
    c.textBaseline = 'middle';
    const lw = curLine.words;
    const sp = c.measureText(' ').width;
    const totalW2 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + sp, -sp);
    const capMaxW = W - 140;
    const capSz = totalW2 > capMaxW ? baseCapSz * (capMaxW / totalW2) : baseCapSz;
    c.font = `700 ${capSz}px "Archivo", sans-serif`;
    const spScaled = c.measureText(' ').width;
    const totalW3 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + spScaled, -spScaled);
    let bx = W * 0.5 - totalW3 * 0.5;

    lw.forEach(w => {
      const isCur = !!(
        activeWord &&
        activeWord.word === w.word &&
        Math.abs(activeWord.start - w.start) < 0.14
      );
      const spoken = t >= w.start;
      const tw2 = c.measureText(fmt(w.word)).width;
      c.textAlign = 'left';
      c.fillStyle = isCur ? C.signal : spoken ? C.ink : C.ash;
      c.fillText(fmt(w.word), bx, capY);
      bx += tw2 + spScaled;
    });
    c.textAlign = 'left';
  }
}
