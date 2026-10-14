import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Split Style:
 * High-fashion Venetian horizontal horizon split typography.
 * Features:
 *  - Top and bottom text halves slide in from opposing horizontal directions
 *  - Magnetic snap-lock on active word with luminous terracotta horizon seam line
 *  - High-contrast editorial typography
 *  - Clean multi-row wrapping
 */
export const renderSplit = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.22);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitSplit = 0;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitSplit = ease.outCubic(exitProg) * 25;
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;

  const sz = Math.min(fontSize * (isLandscape ? 0.86 : 0.96), 76);
  const lh = sz * 1.54;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `900 ${sz}px "Archivo", sans-serif`;
  const spaceW = c.measureText(' ').width;

  const rows: TimedWord[][] = [];
  let curRow: TimedWord[] = [];
  let curW = 0;

  for (const w of curLine.words) {
    const tw = c.measureText(fmt(w.word)).width;
    if (curW + tw > maxW && curRow.length > 0) {
      rows.push(curRow);
      curRow = [];
      curW = 0;
    }
    curRow.push(w);
    curW += tw + spaceW;
  }
  if (curRow.length) rows.push(curRow);

  const totalH = rows.length * lh;
  let rowY = -totalH * 0.5 + lh * 0.48;

  c.textAlign = 'left';
  c.textBaseline = 'middle';

  rows.forEach(row => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let x = -rowW * 0.5;

    row.forEach(w => {
      const wordText = fmt(w.word);
      const tw = c.measureText(wordText).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const spoken = t >= w.start;
      const wordAge = Math.max(0, t - w.start);

      // Horizontal opposing split offset
      let topShiftX = 0;
      let botShiftX = 0;

      if (!spoken) {
        topShiftX = -12;
        botShiftX = 12;
      } else if (isCur && wordAge < 0.20) {
        const snapK = wordAge / 0.20;
        const offset = 14 * (1 - ease.outBack(snapK));
        topShiftX = -offset;
        botShiftX = offset;
      }

      topShiftX -= exitSplit;
      botShiftX += exitSplit;

      c.save();

      // Top Half Clip
      c.save();
      c.beginPath();
      c.rect(x - 20, rowY - sz * 0.8, tw + 40, sz * 0.8);
      c.clip();
      c.fillStyle = isCur ? C.signal : spoken ? C.ink : 'rgba(26,18,9,0.25)';
      c.fillText(wordText, x + topShiftX, rowY);
      c.restore();

      // Bottom Half Clip
      c.save();
      c.beginPath();
      c.rect(x - 20, rowY, tw + 40, sz * 0.8);
      c.clip();
      c.fillStyle = isCur ? C.signal : spoken ? C.ink : 'rgba(26,18,9,0.25)';
      c.fillText(wordText, x + botShiftX, rowY);
      c.restore();

      // Horizon Seam Line on Active Word
      if (isCur) {
        c.shadowColor = C.signal;
        c.shadowBlur = 16;
        c.strokeStyle = C.signal;
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(x - 4, rowY);
        c.lineTo(x + tw + 4, rowY);
        c.stroke();
        c.shadowBlur = 0;
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
