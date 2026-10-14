import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Elastic Style:
 * Rubberband kinetic stretch & physical jelly bounce typography.
 * Features:
 *  - Exaggerated horizontal rubberband stretch & jelly snapback oscillations
 *  - Organic squishy physics on active word activation
 *  - Fluid kinetic energy
 */
export const renderElastic = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.22);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitScaleY = 1;
  if (timeToExit < 0.18 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.18;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitScaleY = 1 - 0.5 * exitProg;
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;
  c.scale(1, exitScaleY);

  const sz = Math.min(fontSize * (isLandscape ? 0.88 : 0.98), 78);
  const lh = sz * 1.54;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `900 ${sz}px "Archivo", sans-serif`;
  const spaceW = c.measureText(' ').width * 1.2;

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

      c.save();

      if (isCur) {
        // Physical jelly oscillations
        const popK = clamp(wordAge / 0.22);
        const jellyWave = Math.sin(popK * Math.PI * 3.0) * Math.exp(-popK * 4.0);
        const scaleX = 1 + 0.32 * jellyWave;
        const scaleY = 1 - 0.22 * jellyWave;

        c.translate(x + tw * 0.5, rowY);
        c.scale(scaleX, scaleY);
        c.translate(-(x + tw * 0.5), -rowY);

        c.shadowColor = C.signal;
        c.shadowBlur = 24;
        c.fillStyle = C.signal;
        c.fillText(wordText, x, rowY);
        c.shadowBlur = 0;

      } else if (spoken) {
        c.fillStyle = C.ink;
        c.fillText(wordText, x, rowY);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.26)';
        c.fillText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
