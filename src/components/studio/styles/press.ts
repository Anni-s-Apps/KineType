import { StyleRenderContext, TimedWord, ease, lerp } from './types';

/**
 * Press Style (Dense-Press in pdoom):
 * Typographic pressure where words start spread out and compress kick by kick
 * into a solid typographic slab bounded by horizontal hydraulic clamp bars.
 */
export const renderPress = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, fontSize, fmt, C } = ctx;
  if (!curLine) return;

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lw = curLine.words;
  const sz = fontSize * 1.05;

  // Compress factor: 0 = loose spread, 1 = tight compressed slab
  const elapsed = Math.max(0, t - curLine.start);
  const pressK = Math.min(1, elapsed / Math.max(0.1, curLine.end - curLine.start));
  const lineSpacing = lerp(sz * 1.6, sz * 0.72, ease.outCubic(pressK));
  const WPR = 2;

  const rows: TimedWord[][] = [];
  for (let i = 0; i < lw.length; i += WPR) rows.push(lw.slice(i, i + WPR));
  const startY = -((rows.length - 1) * lineSpacing) * 0.5;

  rows.forEach((row, ri) => {
    const rowY = startY + ri * lineSpacing;
    const colW = lerp(220, 60, ease.outCubic(pressK));
    const rsx = -((row.length - 1) * colW) * 0.5;

    row.forEach((w, wi) => {
      const spoken = t >= w.start;
      c.save();
      c.translate(rsx + wi * colW, rowY);
      c.font = `900 ${sz}px "Archivo", sans-serif`;

      if (spoken) {
        c.fillStyle = C.ink;
        if (t >= w.start && t < w.end) {
          c.shadowColor = C.signal;
          c.shadowBlur = 18;
        }
      } else {
        c.fillStyle = 'rgba(26,18,9,0.22)';
      }

      c.fillText(fmt(w.word), 0, 0);
      c.shadowBlur = 0;
      c.restore();
    });
  });

  // Clamp bars appear when compressed
  if (pressK > 0.45) {
    const barH = 3;
    c.fillStyle = C.signal;
    c.fillRect(-W * 0.38, -rows.length * lineSpacing * 0.5 - 16, W * 0.76, barH);
    c.fillRect(-W * 0.38, rows.length * lineSpacing * 0.5 + 10, W * 0.76, barH);
  }
};
