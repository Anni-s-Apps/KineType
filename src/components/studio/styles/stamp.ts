import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Stamp Style:
 * Tactile editorial letterpress & hot wax seal deboss typography.
 * Features:
 *  - High-impact mechanical stamp slam from above
 *  - Tactile debossed ink shadow simulating pressed paper
 *  - Active word stamped in rich terracotta wax seal pill with micro border
 *  - Physical material presence
 */
export const renderStamp = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
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
  const lh = sz * 1.56;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `900 ${sz}px "Archivo", sans-serif`;
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
        // Physical slam down from Z-axis: starts at 1.4x scale and slams down to 1.0x
        const slamK = clamp(wordAge / 0.14);
        const slamScale = 1 + 0.32 * Math.exp(-slamK * 4.0) * Math.cos(slamK * Math.PI * 2.5);

        c.translate(x + tw * 0.5, rowY);
        c.scale(slamScale, slamScale);
        c.translate(-(x + tw * 0.5), -rowY);

        // Tactile wax seal stamp pill
        const padX = 10;
        const padY = 5;
        const pillW = tw + padX * 2;
        const pillH = sz * 1.14;

        c.shadowColor = 'rgba(0,0,0,0.22)';
        c.shadowBlur = 12;
        c.shadowOffsetY = 4;
        roundRect(c, x - padX, rowY - pillH * 0.5, pillW, pillH, 6);
        c.fillStyle = C.signal;
        c.fill();
        c.shadowBlur = 0;
        c.shadowOffsetY = 0;

        // Debossed inner border
        c.strokeStyle = 'rgba(255,255,255,0.4)';
        c.lineWidth = 1.5;
        roundRect(c, x - padX + 3, rowY - pillH * 0.5 + 3, pillW - 6, pillH - 6, 4);
        c.stroke();

        // Stamped white text
        c.fillStyle = '#ffffff';
        c.fillText(wordText, x, rowY + 1);

      } else if (spoken) {
        // Debossed letterpress effect on spoken words
        // Subtle top shadow giving an engraved / pressed paper feel
        c.fillStyle = 'rgba(0,0,0,0.12)';
        c.fillText(wordText, x, rowY - 1);
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
