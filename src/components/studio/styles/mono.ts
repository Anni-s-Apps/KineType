import { StyleRenderContext, TimedWord } from './types';

/**
 * Mono Style (Stack / Open in pdoom):
 * IBM Plex Mono technical terminal style with solid box cursor highlight
 * on the active word, wireframe outlines on upcoming words, and technical line inspection tags.
 */
export const renderMono = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C } = ctx;
  if (!curLine) return;

  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const lw = curLine.words;
  const sz = Math.min(fontSize * 0.78, 62);
  const lh = sz * 1.55;
  const maxW = W - 180;

  c.font = `700 ${sz}px "IBM Plex Mono", monospace`;
  const rows: TimedWord[][] = [];
  let curRow: TimedWord[] = [];
  let curW = 0;
  const sp = c.measureText(' ').width;

  for (const w of lw) {
    const tw = c.measureText(w.word).width;
    if (curW + tw > maxW && curRow.length > 0) {
      rows.push(curRow);
      curRow = [];
      curW = 0;
    }
    curRow.push(w);
    curW += tw + sp;
  }
  if (curRow.length) rows.push(curRow);

  const totalH = rows.length * lh;
  let rowY = -totalH * 0.5 + lh * 0.5;

  rows.forEach(row => {
    const rowW = row.reduce((a, w) => a + c.measureText(w.word).width + sp, -sp);
    let x = -rowW * 0.5;

    row.forEach(w => {
      const tw = c.measureText(w.word).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.14);
      const spoken = t >= w.start;

      if (isCur) {
        // Block cursor highlight
        c.fillStyle = C.signal;
        c.fillRect(x - 4, rowY - sz * 0.72, tw + 8, sz * 0.88);
        c.fillStyle = C.paper;
      } else if (spoken) {
        c.fillStyle = C.ink;
      } else {
        c.strokeStyle = 'rgba(26,18,9,0.30)';
        c.lineWidth = 1.2;
        c.strokeText(fmt(w.word), x, rowY);
        x += tw + sp;
        return;
      }

      c.fillText(fmt(w.word), x, rowY);
      x += tw + sp;
    });
    rowY += lh;
  });

  // Inspection tag at bottom
  const lineNo = String(curLine.i).padStart(3, '0');
  c.font = `400 18px "IBM Plex Mono", monospace`;
  c.fillStyle = C.ash;
  c.textAlign = 'right';
  c.fillText(`› LINE ${lineNo}`, W * 0.4, totalH * 0.5 + 44);
  c.textAlign = 'left';
};
