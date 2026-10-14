import { StyleRenderContext, TimedWord } from './types';

/**
 * Askew Style (Dense-Askew in pdoom):
 * Tilting table world, alternating angles per word, elastic spring pop,
 * glowing orange badge pill on active word, and mixed typographic pairing.
 */
export const renderAskew = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lw = curLine.words;
  const WPR = isLandscape ? 3 : 2; // Words per row

  // 1. Dynamic font scaling to guarantee zero overflow
  const safeW = (W - 140) / WPR;
  c.font = `900 ${fontSize}px "Archivo", sans-serif`;
  const maxMeasured = Math.max(...lw.map(w => c.measureText(fmt(w.word)).width), 1);
  const dynScale = maxMeasured > safeW * 0.88 ? (safeW * 0.88) / maxMeasured : 1;
  const fs = fontSize * dynScale;

  const rows: TimedWord[][] = [];
  for (let i = 0; i < lw.length; i += WPR) rows.push(lw.slice(i, i + WPR));
  const rowH = fs * 1.72;
  const startY = -((rows.length - 1) * rowH) * 0.5;

  rows.forEach((row, ri) => {
    const rowY = startY + ri * rowH;
    const colW = (W - 120) / WPR;
    const rowStartX = -((row.length - 1) * colW) * 0.5;

    row.forEach((w, wi) => {
      const gi = ri * WPR + wi;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.14);
      const spoken = t >= w.start;
      const age = t - w.start;

      c.save();
      c.translate(rowStartX + wi * colW, rowY);

      // Alternating tilt: -3°, +2.5°, -4°, +3.5°
      const tiltDeg = (gi % 2 === 0 ? -1 : 1) * (2.4 + (gi * 2.3) % 3.6);
      c.rotate((tiltDeg * Math.PI) / 180);

      // Elastic spring pop on new word
      let sc = spoken ? 1.0 : 0.86;
      if (isCur && age >= 0) {
        const sp = Math.min(1, age / 0.16);
        sc = 1 + 0.26 * Math.sin(sp * Math.PI) * Math.exp(-sp * 2.8);
      }
      c.scale(sc, sc);

      // Font mixture: Archivo 900 / Cormorant Garamond 700 / IBM Plex Mono
      const fontDef =
        gi % 3 === 0
          ? `900 ${fs}px "Archivo", sans-serif`
          : gi % 3 === 1
          ? `italic 700 ${Math.round(fs * 1.15)}px "Cormorant Garamond", serif`
          : `700 ${Math.round(fs * 0.86)}px "IBM Plex Mono", monospace`;
      c.font = fontDef;

      const wt = fmt(w.word);
      const tw = c.measureText(wt).width;
      const bpad = fs * 0.36;

      if (isCur) {
        // High-contrast glowing orange badge
        c.shadowColor = C.signal;
        c.shadowBlur = 20;
        roundRect(c, -tw / 2 - bpad, -fs * 0.64, tw + bpad * 2, fs * 1.26, 10);
        c.fillStyle = C.signal;
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = C.paper;
        c.fillText(wt, 0, 4);
      } else {
        c.fillStyle = spoken ? C.ink : 'rgba(26,18,9,0.20)';
        c.fillText(wt, 0, 4);
      }
      c.restore();
    });
  });
};
