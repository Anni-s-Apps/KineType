import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Neon Style:
 * Atmospheric gas-discharge glowing neon tube kinetic typography.
 * Features:
 *  - Unlit glass tube outlines on upcoming words
 *  - Micro-flicker ignition burst when word activates
 *  - Multi-pass luminous neon bloom (core white + outer glowing terracotta)
 *  - Subtle ambient tube buzz pulse
 */
export const renderNeon = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.22);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitFlicker = 1;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitFlicker = Math.sin(exitProg * 40) > 0 ? 0.3 : 1;
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha * exitFlicker;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;

  const sz = Math.min(fontSize * (isLandscape ? 0.88 : 0.98), 78);
  const lh = sz * 1.54;
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
        // Neon ignition flicker for first 0.09s
        let ignitionAlpha = 1;
        if (wordAge < 0.09) {
          ignitionAlpha = Math.sin(wordAge * 120) > 0 ? 0.4 : 1.0;
        }

        const popK = clamp(wordAge / 0.16);
        const popScale = 1 + 0.12 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);

        c.translate(x + tw * 0.5, rowY);
        c.scale(popScale, popScale);
        c.translate(-(x + tw * 0.5), -rowY);
        c.globalAlpha = globalAlpha * ignitionAlpha;

        // Outer ambient glow pass
        c.shadowColor = '#ff4500';
        c.shadowBlur = 38;
        c.strokeStyle = C.signal;
        c.lineWidth = 6;
        c.strokeText(wordText, x, rowY);

        // Core inner white hot filament pass
        c.shadowColor = '#ffffff';
        c.shadowBlur = 10;
        c.fillStyle = '#ffffff';
        c.fillText(wordText, x, rowY);

      } else if (spoken) {
        // Spoken words: glowing warm ink with subtle residual ambient
        c.shadowColor = 'rgba(217, 93, 57, 0.25)';
        c.shadowBlur = 8;
        c.fillStyle = C.ink;
        c.fillText(wordText, x, rowY);
      } else {
        // Unlit glass tube: delicate wireframe outline
        c.strokeStyle = 'rgba(26, 18, 9, 0.22)';
        c.lineWidth = 1.5;
        c.strokeText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
