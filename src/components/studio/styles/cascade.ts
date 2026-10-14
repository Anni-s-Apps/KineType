import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Cascade Style:
 * Cascading gravity waterfall & tumbling domino kinetic typography.
 * Features:
 *  - Words tumble into the scene with natural gravity & damped ground impact bounce
 *  - Staggered waterfall entrance per word
 *  - Active word kicks glowing terracotta baseline impact spark
 *  - Architectural alignment
 */
export const renderCascade = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = 28 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  if (exitAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = exitAlpha;
  c.translate(0, exitY);

  const sz = Math.min(fontSize * (isLandscape ? 0.85 : 0.95), 76);
  const lh = sz * 1.55;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `800 ${sz}px "Archivo", sans-serif`;
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

  let wordIndex = 0;

  rows.forEach(row => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let x = -rowW * 0.5;

    row.forEach(w => {
      const wordText = fmt(w.word);
      const tw = c.measureText(wordText).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const spoken = t >= w.start;
      const wordAge = Math.max(0, t - w.start);

      // Cascading drop: each word drops from -40px above when line starts
      const staggerDelay = wordIndex * 0.04;
      const cascadeK = clamp((lineAge - staggerDelay) / 0.24);
      const dropY = (1 - ease.outBack(cascadeK)) * -35;
      const wordAlpha = ease.outCubic(cascadeK);

      c.save();
      c.globalAlpha = exitAlpha * wordAlpha;
      c.translate(x, rowY + dropY);

      if (isCur) {
        // Active word energetic spring punch
        const popK = clamp(wordAge / 0.16);
        const popScale = 1 + 0.14 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);
        c.scale(popScale, popScale);

        c.shadowColor = C.signal;
        c.shadowBlur = 26;
        c.fillStyle = C.signal;
        c.fillText(wordText, 0, 0);
        c.shadowBlur = 0;

        // Ground impact baseline flare
        c.fillStyle = C.signal;
        c.fillRect(0, sz * 0.46, tw, 3);

      } else if (spoken) {
        c.fillStyle = C.ink;
        c.fillText(wordText, 0, 0);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(wordText, 0, 0);
      }

      c.restore();
      x += tw + spaceW;
      wordIndex++;
    });

    rowY += lh;
  });

  c.restore();
};
