import { StyleRenderContext, TimedWord, clamp, ease } from './types';

/**
 * Mono Style:
 * High-end tactile monospace terminal & studio typewriter aesthetic.
 * Features:
 *  - Dynamic multi-row wrapping respecting canvas bounds
 *  - Damped harmonic spring entrance & terminal scanline wipe
 *  - Active word tactile highlight block with live blinking terminal cursor
 *  - Spoken vs upcoming word optical contrast
 *  - Minimal editorial frame corners & status readout (no clutter)
 */
export const renderMono = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;

  const lineAge = Math.max(0, t - curLine.start);
  const lineDur = Math.max(0.1, curLine.end - curLine.start);
  const timeToExit = curLine.end - t;

  // 1. Damped entrance & exit
  const enterK = clamp(lineAge / 0.22);
  const enterSpring = ease.outBack(enterK);
  const enterAlpha = clamp(lineAge / 0.16);

  let exitAlpha = 1;
  let exitY = 0;
  if (timeToExit < 0.20 && timeToExit >= 0) {
    const exitProg = 1 - timeToExit / 0.20;
    exitAlpha = 1 - ease.inCubic(exitProg);
    exitY = -24 * ease.outCubic(exitProg);
  } else if (timeToExit < 0) {
    exitAlpha = 0;
  }

  const globalAlpha = enterAlpha * exitAlpha;
  if (globalAlpha <= 0.005) return;

  c.save();
  c.globalAlpha = globalAlpha;

  // Subtle vertical entrance slide
  const enterSlideY = (1 - enterSpring) * 18;
  c.translate(0, enterSlideY + exitY);

  // 2. Measure & dynamic wrap
  const sz = Math.min(fontSize * (isLandscape ? 0.72 : 0.82), 64);
  const lh = sz * 1.58;
  const maxW = W - (isLandscape ? 220 : 160);

  c.font = `600 ${sz}px "IBM Plex Mono", monospace`;
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

  // 3. Technical Minimal Header (Studio tape counter)
  c.save();
  const lineNum = String(curLine.i + 1).padStart(3, '0');
  const totalSec = Math.floor(t);
  const ms = Math.floor((t % 1) * 100);
  const timeCode = `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

  const headerY = -totalH * 0.5 - 46;
  c.font = `500 ${Math.max(13, Math.round(sz * 0.30))}px "IBM Plex Mono", monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = C.ash;
  c.fillText(`[ TTY-01 // LN:${lineNum} // TC:${timeCode} ]`, 0, headerY);
  c.restore();

  // 4. Render rows and words
  c.textAlign = 'left';
  c.textBaseline = 'middle';

  // Blinking cursor state (5Hz flash)
  const cursorBlink = Math.sin(t * 12) > 0;

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
        // Active word: energetic spring punch
        const popK = clamp(wordAge / 0.14);
        const punchScale = 1 + 0.12 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);
        c.translate(x + tw * 0.5, rowY);
        c.scale(punchScale, punchScale);
        c.translate(-(x + tw * 0.5), -rowY);

        // Highlight Pill block (Signal Terracotta with soft ambient bloom)
        const padX = 8;
        const padY = 5;
        const pillH = sz * 1.18;
        const pillY = rowY - pillH * 0.5;

        c.shadowColor = C.signal;
        c.shadowBlur = 18;
        roundRect(c, x - padX, pillY - padY, tw + padX * 2, pillH + padY * 2, 6);
        c.fillStyle = C.signal;
        c.fill();
        c.shadowBlur = 0;

        // Word text in clean contrast paper
        c.fillStyle = '#ffffff';
        c.fillText(wordText, x, rowY);

        // Blinking terminal block cursor right next to word
        if (cursorBlink) {
          c.fillStyle = '#ffffff';
          c.fillRect(x + tw + 3, rowY - sz * 0.48, 5, sz * 0.96);
        }
      } else if (spoken) {
        // Spoken words: Crisp warm obsidian ink
        c.fillStyle = C.ink;
        c.fillText(wordText, x, rowY);
      } else {
        // Upcoming words: Clean subtle muted ash wireframe
        c.fillStyle = 'rgba(26, 18, 9, 0.28)';
        c.fillText(wordText, x, rowY);
      }

      c.restore();
      x += tw + spaceW;
    });

    rowY += lh;
  });

  // 5. Minimal Corner Framing Guides
  c.save();
  const boxW = Math.min(maxW + 60, W - 80);
  const boxH = totalH + 110;
  const leftX = -boxW * 0.5;
  const rightX = boxW * 0.5;
  const topY = -boxH * 0.5;
  const botY = boxH * 0.5;
  const tickLen = 14;

  c.strokeStyle = 'rgba(26, 18, 9, 0.18)';
  c.lineWidth = 1.5;

  // Top-left
  c.beginPath();
  c.moveTo(leftX, topY + tickLen);
  c.lineTo(leftX, topY);
  c.lineTo(leftX + tickLen, topY);
  c.stroke();

  // Top-right
  c.beginPath();
  c.moveTo(rightX - tickLen, topY);
  c.lineTo(rightX, topY);
  c.lineTo(rightX, topY + tickLen);
  c.stroke();

  // Bottom-left
  c.beginPath();
  c.moveTo(leftX, botY - tickLen);
  c.lineTo(leftX, botY);
  c.lineTo(leftX + tickLen, botY);
  c.stroke();

  // Bottom-right
  c.beginPath();
  c.moveTo(rightX - tickLen, botY);
  c.lineTo(rightX, botY);
  c.lineTo(rightX, botY - tickLen);
  c.stroke();

  c.restore();

  c.restore();
};
