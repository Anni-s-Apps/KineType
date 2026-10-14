import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Serif Style:
 * Haute luxury editorial & literary aesthetic (Cormorant Garamond).
 * Features:
 *  - Balanced typographic multi-line wrap
 *  - Poetic organic float & silky harmonic entrance
 *  - In-line word karaoke: active word illuminates with rich terracotta italic emphasis
 *  - Delicate micro-diamond accent & smooth hairline underline
 *  - Zero crude repetition of words
 */
export const renderSerif = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const timeToExit = curLine.end - t;

  // 1. Silky harmonic entrance and exit
  const enterK = clamp(lineAge / 0.26);
  const enterEase = ease.outCubic(enterK);
  const enterAlpha = clamp(lineAge / 0.18);

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.24 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.24;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = -20 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;

  // Poetic breathing float
  const floatY = Math.sin(t * 1.5) * 8;
  const enterY = (1 - enterEase) * 22;
  c.translate(0, floatY + enterY + exitY);

  // 2. Dynamic typography sizing & wrap
  const sz = Math.min(fontSize * (isLandscape ? 1.05 : 1.15), 84);
  const lh = sz * 1.38;
  const maxW = W - (isLandscape ? 200 : 140);

  c.font = `italic 600 ${sz}px "Cormorant Garamond", serif`;
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
  let rowY = -totalH * 0.5 + lh * 0.45;

  // 3. Delicate Luxury Header Ornament
  c.save();
  const ornamentY = -totalH * 0.5 - 38;
  c.font = `italic 400 ${Math.max(16, Math.round(sz * 0.28))}px "Cormorant Garamond", serif`;
  c.fillStyle = C.ash;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`— ✦ —`, 0, ornamentY);
  c.restore();

  // 4. Render rows with inline editorial karaoke
  c.textAlign = 'left';
  c.textBaseline = 'middle';

  rows.forEach((row) => {
    const rowW = row.reduce((acc, w) => acc + c.measureText(fmt(w.word)).width + spaceW, -spaceW);
    let x = -rowW * 0.5;

    row.forEach((w) => {
      const wordText = fmt(w.word);
      const tw = c.measureText(wordText).width;
      const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.16);
      const spoken = t >= w.start;
      const wordAge = Math.max(0, t - w.start);

      c.save();

      if (isCur) {
        // Active word: subtle luxury float & glowing terracotta accent
        const popK = clamp(wordAge / 0.18);
        const scalePunch = 1 + 0.08 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.2);

        c.translate(x + tw * 0.5, rowY);
        c.scale(scalePunch, scalePunch);
        c.translate(-(x + tw * 0.5), -rowY);

        // Radiant glow
        c.shadowColor = C.signal;
        c.shadowBlur = 22;
        c.fillStyle = C.signal;
        c.fillText(wordText, x, rowY);
        c.shadowBlur = 0;

        // Elegant hairline underline beneath active word
        const underlineY = rowY + sz * 0.44;
        const lineDraw = ease.outCubic(clamp(wordAge / 0.14));
        c.strokeStyle = C.signal;
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(x, underlineY);
        c.lineTo(x + tw * lineDraw, underlineY);
        c.stroke();

        // Delicate floating diamond above word
        const sparkY = rowY - sz * 0.48;
        c.font = `italic 400 ${Math.round(sz * 0.28)}px "Cormorant Garamond", serif`;
        c.textAlign = 'center';
        c.fillText('✧', x + tw * 0.5, sparkY);
        c.font = `italic 600 ${sz}px "Cormorant Garamond", serif`;
        c.textAlign = 'left';

      } else if (spoken) {
        // Spoken words: Deep obsidian luxury ink
        c.fillStyle = '#140f09';
        c.fillText(wordText, x, rowY);
      } else {
        // Upcoming words: Warm graphite
        c.fillStyle = 'rgba(26, 18, 9, 0.32)';
        c.fillText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  c.restore();
};
