import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Askew Style:
 * Dynamic editorial poster & tactile kinetic stickers.
 * Features:
 *  - Word-level flex layout with dynamic wrapping: ZERO collisions or overlap
 *  - Alternating subtle angular tilts (-3.5° to +3.5°)
 *  - Active word: elastic squash-and-stretch pop into warm signal pill
 *  - Tactile paper sticker shadow & rounded geometry
 *  - Spoken vs upcoming word optical clarity
 */
export const renderAskew = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  // 1. Line entrance and exit
  const enterK = clamp(lineAge / 0.24);
  const enterSpring = ease.outBack(enterK);
  const enterAlpha = clamp(lineAge / 0.16);

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

  const enterY = (1 - enterSpring) * 18;
  c.translate(0, enterY + exitY);

  // 2. Measure & safe layout
  const sz = Math.min(fontSize * (isLandscape ? 0.85 : 0.95), 78);
  const lh = sz * 1.62;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `900 ${sz}px "Archivo", sans-serif`;
  const spaceW = c.measureText(' ').width * 1.25;

  // Measure word dimensions including pill padding
  const padX = sz * 0.28;
  const padY = sz * 0.16;

  interface MeasuredWord {
    word: TimedWord;
    text: string;
    tw: number;
    totalW: number;
    angle: number;
    globalIndex: number;
  }

  const measured: MeasuredWord[] = curLine.words.map((w, idx) => {
    const text = fmt(w.word);
    const tw = c.measureText(text).width;
    // Alternating organic tilt angle between -3.5° and +3.5°
    const angle = (idx % 2 === 0 ? -1 : 1) * (2.2 + ((idx * 1.7) % 1.6));
    return {
      word: w,
      text,
      tw,
      totalW: tw + padX * 2,
      angle,
      globalIndex: idx,
    };
  });

  // Dynamic row partition
  const rows: MeasuredWord[][] = [];
  let curRow: MeasuredWord[] = [];
  let curW = 0;

  for (const mw of measured) {
    if (curW + mw.totalW > maxW && curRow.length > 0) {
      rows.push(curRow);
      curRow = [];
      curW = 0;
    }
    curRow.push(mw);
    curW += mw.totalW + spaceW;
  }
  if (curRow.length) rows.push(curRow);

  const totalH = rows.length * lh;
  let rowY = -totalH * 0.5 + lh * 0.5;

  // 3. Render words
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  rows.forEach((row) => {
    const rowContentW = row.reduce((acc, mw) => acc + mw.totalW + spaceW, -spaceW);
    let curX = -rowContentW * 0.5;

    row.forEach((mw) => {
      const centerX = curX + mw.totalW * 0.5;
      const isCur = !!(activeWord && activeWord.word === mw.word.word && Math.abs(activeWord.start - mw.word.start) < 0.16);
      const spoken = t >= mw.word.start;
      const wordAge = Math.max(0, t - mw.word.start);

      c.save();
      c.translate(centerX, rowY);

      // Rotational tilt
      const rad = (mw.angle * Math.PI) / 180;
      c.rotate(rad);

      // Elastic squash-and-stretch on activation
      let scaleX = 1;
      let scaleY = 1;
      if (isCur && wordAge >= 0) {
        const popK = clamp(wordAge / 0.16);
        const impulse = Math.sin(popK * Math.PI) * Math.exp(-popK * 2.8);
        scaleX = 1 + 0.16 * impulse;
        scaleY = 1 - 0.08 * impulse;
      } else if (!spoken) {
        scaleX = 0.94;
        scaleY = 0.94;
      }
      c.scale(scaleX, scaleY);

      c.font = `900 ${sz}px "Archivo", sans-serif`;

      if (isCur) {
        // High-contrast glowing tactile terracotta pill
        const pillW = mw.tw + padX * 2;
        const pillH = sz + padY * 2;

        c.shadowColor = C.signal;
        c.shadowBlur = 24;
        roundRect(c, -pillW * 0.5, -pillH * 0.5, pillW, pillH, 12);
        c.fillStyle = C.signal;
        c.fill();
        c.shadowBlur = 0;

        // Subtle bottom lip on pill for tactile paper sticker depth
        c.fillStyle = 'rgba(0, 0, 0, 0.18)';
        c.fillRect(-pillW * 0.5 + 4, pillH * 0.5 - 3, pillW - 8, 3);

        // Pristine contrast text
        c.fillStyle = '#ffffff';
        c.fillText(mw.text, 0, 2);
      } else if (spoken) {
        // Spoken words: Deep obsidian ink with subtle soft pill outline or text
        c.fillStyle = C.ink;
        c.fillText(mw.text, 0, 2);
      } else {
        // Upcoming words: Clean subtle 28% ink
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(mw.text, 0, 2);
      }

      c.restore();
      curX += mw.totalW + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
