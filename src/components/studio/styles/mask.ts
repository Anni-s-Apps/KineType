import { StyleRenderContext, TimedWord, clamp } from './types';

/**
 * Mask Style (Loom [MASK] in pdoom):
 * Bone-coloured blocks cover upcoming words and wipe away left-to-right
 * as each word is sung, revealing the crisp type beneath with a hot laser scanline edge.
 */
export const renderMask = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, fontSize, fmt, C } = ctx;
  if (!curLine) return;

  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const lw = curLine.words;
  const sz = fontSize * 0.88;

  // Measure total width to center
  c.font = `900 ${sz}px "Archivo", sans-serif`;
  const wordMetrics = lw.map(w => ({ w, tw: c.measureText(fmt(w.word)).width }));
  const totalW = wordMetrics.reduce((a, m) => a + m.tw + sz * 0.28, -sz * 0.28);
  const maxW = W - 160;
  const scale = Math.min(1, maxW / totalW);
  const scaledSz = sz * scale;
  c.font = `900 ${scaledSz}px "Archivo", sans-serif`;

  // Lay out rows
  const rowH = scaledSz * 1.5;
  const rows: { w: TimedWord; tw: number }[][] = [];
  let cur: { w: TimedWord; tw: number }[] = [];
  let curRowW = 0;
  const gap = scaledSz * 0.28;

  for (const m of wordMetrics.map(m => ({ ...m, tw: m.tw * scale }))) {
    if (curRowW + m.tw > maxW && cur.length > 0) {
      rows.push(cur);
      cur = [];
      curRowW = 0;
    }
    cur.push(m);
    curRowW += m.tw + gap;
  }
  if (cur.length) rows.push(cur);

  const totalRowH = rows.length * rowH;
  let rowY = -totalRowH * 0.5 + rowH * 0.5;

  rows.forEach(row => {
    const rowW = row.reduce((a, m) => a + m.tw + gap, -gap);
    let x = -rowW * 0.5;

    row.forEach(({ w, tw }) => {
      const p = clamp((t - w.start) / Math.max(0.05, w.end - w.start));
      const txt = fmt(w.word);

      // Revealed word behind
      c.fillStyle = p <= 0 ? 'rgba(0,0,0,0)' : p < 1 ? C.signal : C.ink;
      c.fillText(txt, x, rowY);

      // [MASK] block sliding away
      const cover = 1 - p;
      if (cover > 0) {
        const bx = x - 6,
          bw = tw + 12,
          by = rowY - scaledSz * 0.76,
          bh = scaledSz * 0.86;
        const cx2 = bx + bw * (1 - cover);

        c.fillStyle = C.bone;
        c.fillRect(cx2, by, bw * cover, bh);

        // [MASK] label inside
        c.save();
        c.beginPath();
        c.rect(cx2, by, bw * cover, bh);
        c.clip();
        c.font = `600 ${scaledSz * 0.28}px "IBM Plex Mono", monospace`;
        c.textAlign = 'center';
        c.fillStyle = C.ink;
        c.fillText('[MASK]', bx + bw / 2, by + bh * 0.62);
        c.textAlign = 'left';
        c.restore();

        // Hot scan-line edge
        if (p > 0) {
          c.fillStyle = C.signal;
          c.fillRect(cx2 - 2.5, by - 4, 5, bh + 8);
        }
      }
      x += tw + gap;
    });
    rowY += rowH;
  });
};
