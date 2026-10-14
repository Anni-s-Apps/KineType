import { StyleRenderContext, TimedWord, clamp, ease, pulse } from './types';

/**
 * Hook Style:
 * High-retention viral & punchy kinetic typography.
 * Features:
 *  - Massive focal word scale-slam with damped spring bounce
 *  - Multi-layer kinetic echo outlines with directional momentum
 *  - Warm radial impact bloom on each spoken word
 *  - Perfectly wrapped lyric context subtitle (guaranteed ZERO overflow)
 *  - Minimal rhythm dot track at bottom
 */
export const renderHook = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const bigW = activeWord || curLine.words[0];
  if (!bigW) return;

  const age = Math.max(0, t - bigW.start);
  const timeToExit = curLine.end - t;

  // Global exit fade
  let exitAlpha = 1;
  if (timeToExit < 0.16 && timeToExit >= 0) {
    exitAlpha = 1 - ease.inCubic(1 - timeToExit / 0.16);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }
  if (exitAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = exitAlpha;

  // 1. Safe font scaling for big focal word
  let hookSz = fontSize * (isLandscape ? 1.55 : 1.95);
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  const wordText = fmt(bigW.word);
  const mw = c.measureText(wordText).width;
  const maxHookW = W - (isLandscape ? 220 : 160);
  if (mw > maxHookW) {
    hookSz *= maxHookW / mw;
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  }

  // 2. High-impact spring slam bounce
  // Explodes inward, bounces elastically with damped harmonic inertia
  const slamK = clamp(age / 0.14);
  const springDecay = Math.exp(-slamK * 3.2);
  const slamScale = 1 + 0.32 * springDecay * Math.cos(slamK * Math.PI * 2.2);

  c.save();
  c.translate(0, -hookSz * 0.14);
  c.scale(slamScale, slamScale);
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // 3. Strobe Echo Layers (Kinetic 3D offset outlines on impact)
  const impPulse = pulse(t, bigW.start, 0.20);
  const echoOffset = 9 * Math.max(0, 1 - age / 0.26);

  // Layer A: Signal orange offset echo (bottom-right)
  if (age < 0.32) {
    const alphaA = clamp((1 - age / 0.32) * 0.75);
    c.save();
    c.translate(echoOffset, echoOffset);
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
    c.strokeStyle = `rgba(217, 93, 57, ${alphaA})`;
    c.lineWidth = 3;
    c.strokeText(wordText, 0, 0);
    c.restore();
  }

  // Layer B: Subtle ash offset echo (top-left)
  if (age < 0.22) {
    const alphaB = clamp((1 - age / 0.22) * 0.45);
    c.save();
    c.translate(-echoOffset * 0.7, -echoOffset * 0.7);
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
    c.strokeStyle = `rgba(26, 18, 9, ${alphaB})`;
    c.lineWidth = 2;
    c.strokeText(wordText, 0, 0);
    c.restore();
  }

  // 4. Warm Impact Bloom
  if (impPulse > 0.01) {
    c.shadowColor = C.signal;
    c.shadowBlur = 42 * impPulse;
  }

  // 5. Main Focal Word
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  c.fillStyle = C.ink;
  c.fillText(wordText, 0, 0);
  c.shadowBlur = 0;

  c.restore();

  // 6. Safe Wrapped Lyric Subtitle Context Below
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  const subSz = Math.max(20, Math.min(28, Math.round(fontSize * 0.38)));
  const subLh = subSz * 1.48;
  c.font = `600 ${subSz}px "Archivo", sans-serif`;

  const subMaxW = W - (isLandscape ? 240 : 180);
  const subWords = curLine.words;
  const subRows: TimedWord[][] = [];
  let curSubRow: TimedWord[] = [];
  let curSubW = 0;
  const spaceW = c.measureText(' ').width;

  for (const sw of subWords) {
    const stw = c.measureText(fmt(sw.word)).width;
    if (curSubW + stw > subMaxW && curSubRow.length > 0) {
      subRows.push(curSubRow);
      curSubRow = [];
      curSubW = 0;
    }
    curSubRow.push(sw);
    curSubW += stw + spaceW;
  }
  if (curSubRow.length) subRows.push(curSubRow);

  const subTotalH = subRows.length * subLh;
  const subtitleCenterY = hookSz * 0.52 + 52 + subTotalH * 0.5;

  let curSubY = subtitleCenterY - subTotalH * 0.5 + subLh * 0.5;

  subRows.forEach((row) => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let startX = -rowW * 0.5;

    c.textAlign = 'left';
    row.forEach((w) => {
      const wt = fmt(w.word);
      const wtw = c.measureText(wt).width;
      const isWordActive = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const isSpoken = t >= w.start;

      if (isWordActive) {
        c.fillStyle = C.signal;
        c.fillText(wt, startX, curSubY);
      } else if (isSpoken) {
        c.fillStyle = C.ink;
        c.fillText(wt, startX, curSubY);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.32)';
        c.fillText(wt, startX, curSubY);
      }

      startX += wtw + spaceW;
    });

    curSubY += subLh;
  });

  // 7. Minimal progress dot indicator
  const dotCount = curLine.words.length;
  if (dotCount > 1 && dotCount <= 12) {
    const dotSpacing = 16;
    const dotsTotalW = (dotCount - 1) * dotSpacing;
    const dotsY = subtitleCenterY + subTotalH * 0.5 + 32;
    let dotX = -dotsTotalW * 0.5;

    curLine.words.forEach((w) => {
      const passed = t >= w.start;
      const isCurrent = activeWord && activeWord.word === w.word;

      c.beginPath();
      c.arc(dotX, dotsY, isCurrent ? 4.5 : 3, 0, Math.PI * 2);
      if (isCurrent) {
        c.fillStyle = C.signal;
      } else if (passed) {
        c.fillStyle = C.ink;
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.20)';
      }
      c.fill();
      dotX += dotSpacing;
    });
  }

  c.restore();

  c.restore();
};
