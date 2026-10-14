import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Wave Style:
 * Liquid harmonic sine-wave kinetic ribbon typography.
 * Features:
 *  - Words and characters flow smoothly along an undulating sine wave
 *  - Dynamic tangent rotation matching wave slope
 *  - Active word crests with glowing radiant amber bloom
 *  - Pure mathematical fluid motion
 */
export const renderWave = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.25);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = -22 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;
  c.translate(0, exitY);

  const sz = Math.min(fontSize * (isLandscape ? 0.85 : 0.95), 76);
  const lh = sz * 1.62;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `800 ${sz}px "Archivo", sans-serif`;
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

  // Wave parameters
  const waveAmp = 18;
  const waveFreq = 0.0065;
  const waveSpeed = 2.4;

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  rows.forEach((row, ri) => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let curX = -rowW * 0.5;

    row.forEach(w => {
      const wordText = fmt(w.word);
      const tw = c.measureText(wordText).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const spoken = t >= w.start;
      const wordAge = Math.max(0, t - w.start);

      const wordMidX = curX + tw * 0.5;
      const wavePhase = wordMidX * waveFreq + t * waveSpeed + ri * 1.2;
      const waveY = Math.sin(wavePhase) * waveAmp;
      // Slope derivative: dY/dX = waveAmp * waveFreq * cos(wavePhase)
      const slope = waveAmp * waveFreq * Math.cos(wavePhase);
      const tangentRot = Math.atan(slope) * 0.65;

      c.save();
      c.translate(wordMidX, rowY + waveY);
      c.rotate(tangentRot);

      if (isCur) {
        // Crest punch
        const popK = clamp(wordAge / 0.16);
        const popScale = 1 + 0.14 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);
        c.scale(popScale, popScale);

        c.shadowColor = C.signal;
        c.shadowBlur = 28;
        c.fillStyle = C.signal;
        c.fillText(wordText, 0, 0);
        c.shadowBlur = 0;

        // Glowing crest underline
        c.strokeStyle = C.signal;
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-tw * 0.5, sz * 0.46);
        c.lineTo(tw * 0.5, sz * 0.46);
        c.stroke();
      } else if (spoken) {
        c.fillStyle = C.ink;
        c.fillText(wordText, 0, 0);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(wordText, 0, 0);
      }

      c.restore();
      curX += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
