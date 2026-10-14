import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Comic Style:
 * High-impact pop-art & graphic novel kinetic typography.
 * Features:
 *  - Chunky comic stroke outlines and punchy action typography
 *  - Radial comic speed burst lines on active word impact
 *  - Dynamic elastic squash-and-stretch bounce
 *  - Zero collision multi-row wrapping
 */
export const renderComic = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.18);
  const enterScale = 0.85 + 0.15 * ease.outBack(enterK);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitScale = 1;
  if (timeToExit < 0.18 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.18;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitScale = 1 + 0.18 * exitProg;
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;
  c.scale(enterScale * exitScale, enterScale * exitScale);

  const sz = Math.min(fontSize * (isLandscape ? 0.88 : 0.98), 78);
  const lh = sz * 1.55;
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
        // Comic action slam
        const popK = clamp(wordAge / 0.15);
        const impulse = Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);
        const scaleX = 1 + 0.18 * impulse;
        const scaleY = 1 - 0.08 * impulse;

        c.translate(x + tw * 0.5, rowY);
        c.scale(scaleX, scaleY);
        c.translate(-(x + tw * 0.5), -rowY);

        // Radiant comic speed burst rays
        if (wordAge < 0.25) {
          c.save();
          const burstAlpha = (1 - wordAge / 0.25) * 0.7;
          c.strokeStyle = `rgba(217, 93, 57, ${burstAlpha})`;
          c.lineWidth = 2.5;
          const rayLen = sz * 0.75;
          const cx = x + tw * 0.5;
          const cy = rowY;

          for (let ray = 0; ray < 8; ray++) {
            const angle = (ray * Math.PI) / 4;
            const rStart = sz * 0.55;
            const rEnd = rStart + rayLen * (1 - wordAge / 0.25);
            c.beginPath();
            c.moveTo(cx + Math.cos(angle) * rStart, cy + Math.sin(angle) * rStart);
            c.lineTo(cx + Math.cos(angle) * rEnd, cy + Math.sin(angle) * rEnd);
            c.stroke();
          }
          c.restore();
        }

        // Tactile comic pill badge
        const padX = 12;
        const padY = 6;
        roundRect(c, x - padX, rowY - sz * 0.58 - padY, tw + padX * 2, sz * 1.16 + padY * 2, 8);
        c.fillStyle = C.signal;
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = C.ink;
        c.stroke();

        // White comic text with drop shadow
        c.fillStyle = '#ffffff';
        c.fillText(wordText, x, rowY + 1);

      } else if (spoken) {
        // Spoken words: chunky graphic ink
        c.lineWidth = 4;
        c.strokeStyle = '#ffffff';
        c.strokeText(wordText, x, rowY);
        c.fillStyle = C.ink;
        c.fillText(wordText, x, rowY);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.25)';
        c.fillText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
