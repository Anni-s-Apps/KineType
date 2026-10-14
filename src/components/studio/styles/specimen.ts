import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Specimen Style:
 * Swiss modernist grid & architectural blueprint typography.
 * Features:
 *  - Precision architectural crosshair measurement marks [ + ] on active word
 *  - Hairline baseline grid rules & subtle technical metric tags
 *  - Strict International Typographic Style aesthetic
 *  - High contrast and perfect optical clarity
 */
export const renderSpecimen = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  const enterK = clamp(lineAge / 0.20);
  const enterAlpha = ease.outCubic(enterK);

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = -20 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;
  c.translate(0, exitY);

  const sz = Math.min(fontSize * (isLandscape ? 0.86 : 0.96), 76);
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
        // Active word: glowing terracotta emphasis
        c.fillStyle = C.signal;
        c.fillText(wordText, x, rowY);

        // Architectural precision brackets [ + ]
        const padX = 8;
        const armLen = 8;
        const topArmY = rowY - sz * 0.52;
        const botArmY = rowY + sz * 0.52;

        c.strokeStyle = C.signal;
        c.lineWidth = 1.5;

        // Left bracket
        c.beginPath();
        c.moveTo(x - padX + armLen, topArmY);
        c.lineTo(x - padX, topArmY);
        c.lineTo(x - padX, botArmY);
        c.lineTo(x - padX + armLen, botArmY);
        c.stroke();

        // Right bracket
        c.beginPath();
        c.moveTo(x + tw + padX - armLen, topArmY);
        c.lineTo(x + tw + padX, topArmY);
        c.lineTo(x + tw + padX, botArmY);
        c.lineTo(x + tw + padX - armLen, botArmY);
        c.stroke();

        // Center micro crosshair above word
        c.beginPath();
        const chX = x + tw * 0.5;
        const chY = topArmY - 8;
        c.moveTo(chX - 4, chY);
        c.lineTo(chX + 4, chY);
        c.moveTo(chX, chY - 4);
        c.lineTo(chX, chY + 4);
        c.stroke();

      } else if (spoken) {
        c.fillStyle = C.ink;
        c.fillText(wordText, x, rowY);
      } else {
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
