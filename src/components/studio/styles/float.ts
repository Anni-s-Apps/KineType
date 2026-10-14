import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Float Style:
 * Weightless zero-gravity organic floating typography.
 * Features:
 *  - Per-word Lissajous floating harmonic oscillations
 *  - Buoyant vertical spring lift and soft atmospheric glow on active word
 *  - Balanced dynamic line wrapping with zero overlap
 *  - Silky optical entrance & dissolve
 */
export const renderFloat = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.28);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.22 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.22;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = -24 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;
  c.translate(0, exitY);

  const sz = Math.min(fontSize * (isLandscape ? 0.88 : 0.98), 80);
  const lh = sz * 1.58;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `italic 700 ${sz}px "Cormorant Garamond", serif`;
  const spaceW = c.measureText(' ').width * 1.15;

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

  let globalWordIdx = 0;

  rows.forEach(row => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let x = -rowW * 0.5;

    row.forEach(w => {
      const wordText = fmt(w.word);
      const tw = c.measureText(wordText).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const spoken = t >= w.start;
      const wordAge = Math.max(0, t - w.start);

      // Organic Lissajous micro-float phase per word
      const floatPhase = t * 1.5 + globalWordIdx * 0.75;
      const floatOffsetY = Math.sin(floatPhase) * 7 + Math.cos(floatPhase * 0.6) * 4;

      c.save();
      c.translate(x, rowY + floatOffsetY);

      if (isCur) {
        // Buoyant spring pop
        const popK = clamp(wordAge / 0.18);
        const popScale = 1 + 0.14 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.2);
        c.scale(popScale, popScale);

        // Radiant amber/terracotta atmospheric bloom
        c.shadowColor = C.signal;
        c.shadowBlur = 28;
        c.fillStyle = C.signal;
        c.fillText(wordText, 0, 0);
        c.shadowBlur = 0;

        // Floating poetic star
        c.font = `italic 400 ${Math.round(sz * 0.32)}px "Cormorant Garamond", serif`;
        c.textAlign = 'center';
        c.fillText('✦', tw * 0.5, -sz * 0.52);
      } else if (spoken) {
        c.fillStyle = C.ink;
        c.fillText(wordText, 0, 0);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(wordText, 0, 0);
      }

      c.restore();
      x += tw + spaceW;
      globalWordIdx++;
    });

    rowY += lh;
  });

  c.restore();
};
