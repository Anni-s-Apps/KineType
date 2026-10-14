import { StyleRenderContext, TimedWord, clamp, ease, pulse } from './types';

/**
 * Mask Style — High-Fashion Redaction Wipe & Laser Kinetic Reveal
 *
 * Upgrades:
 *  1. Replaced crude "[MASK]" text-boxes with ultra-chic editorial redaction pads
 *     featuring subtle dot matrices and hairline borders.
 *  2. Smooth non-linear cubic wipe easing with dynamic laser scanline edge.
 *  3. Word-by-word reveal:
 *     - Upcoming words are concealed behind warm bone redaction tablets.
 *     - Active word wipes open with a glowing terracotta laser blade (#d95d39)
 *       and an elastic micro-punch ($1.10x$).
 *     - Spoken words settle into deep obsidian ink with razor-sharp typography.
 *  4. Corrected vertical font metrics so descenders ('g', 'y', 'p') are never clipped.
 *  5. Silky smooth entrance spring and soft exit glide.
 */
export const renderMask = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C, isLandscape, roundRect } = ctx;
  if (!curLine) return;

  const tStart = curLine.start;
  const tEnd = curLine.end;
  if (t < tStart) return;

  const age = t - tStart;
  const tExit = tEnd - 0.22;

  // 1. Entrance & Exit Dynamics
  const enterScale = age < 0.35 ? 1 + 0.18 * Math.exp(-age * 12) : 1;
  let exitSlideY = 0;
  let exitScale = 1;
  let alpha = 1;

  if (t >= tExit) {
    const k = clamp((t - tExit) / 0.22);
    exitSlideY = -20 * ease.inCubic(k);
    exitScale = 1 - 0.05 * k;
    alpha = 1 - ease.inCubic(k);
  }

  c.save();
  c.scale(enterScale * exitScale, enterScale * exitScale);
  c.translate(0, exitSlideY);

  c.textAlign = 'left';
  c.textBaseline = 'middle';

  const rawWords = curLine.words;
  const maxSafeW = W - (isLandscape ? 240 : 160);
  let maskSz = fontSize * (isLandscape ? 1.35 : 1.55);
  c.font = `900 ${maskSz}px "Archivo", sans-serif`;

  // Measure and wrap words into balanced rows
  const wordMetrics = rawWords.map(w => ({
    w,
    text: fmt(w.word),
    tw: c.measureText(fmt(w.word)).width,
  }));

  const spaceW = c.measureText(' ').width;
  const wordsPerRow = isLandscape ? 4 : 2;
  const rows: { w: TimedWord; text: string; tw: number }[][] = [];
  let curRow: { w: TimedWord; text: string; tw: number }[] = [];
  let curRowW = 0;
  const gap = maskSz * 0.26;

  for (const m of wordMetrics) {
    if (curRow.length > 0 && (curRowW + m.tw > maxSafeW || curRow.length >= wordsPerRow)) {
      rows.push(curRow);
      curRow = [];
      curRowW = 0;
    }
    curRow.push(m);
    curRowW += m.tw + gap;
  }
  if (curRow.length) rows.push(curRow);

  // Auto-scale down if any row exceeds maxSafeW
  const widestRow = Math.max(
    ...rows.map(r => r.reduce((sum, item) => sum + item.tw + gap, -gap)),
    1
  );
  if (widestRow > maxSafeW) {
    const scaleFactor = maxSafeW / widestRow;
    maskSz *= scaleFactor;
    c.font = `900 ${maskSz}px "Archivo", sans-serif`;
    rows.forEach(r => {
      r.forEach(item => {
        item.tw *= scaleFactor;
      });
    });
  }

  const rowH = maskSz * 1.35;
  const totalRowH = rows.length * rowH;
  let rowY = -((rows.length - 1) * rowH) * 0.5;

  rows.forEach((row, ri) => {
    const rowAge = Math.max(0, age - ri * 0.04);
    const rowAlpha = clamp(rowAge / 0.12) * alpha;

    const rowW = row.reduce((sum, item) => sum + item.tw + gap, -gap);
    let x = -rowW * 0.5;

    row.forEach(({ w, text, tw }) => {
      const isCur = !!(
        activeWord &&
        activeWord.word === w.word &&
        Math.abs(activeWord.start - w.start) < 0.16
      );
      const isSpoken = t >= w.end;
      const isUpcoming = t < w.start;

      // Wipe progress with smooth cubic curve
      const rawProgress = (t - w.start) / Math.max(0.06, w.end - w.start);
      const p = clamp(rawProgress);
      const wipeEase = ease.outCubic(p);

      // Accurate bounding pad metrics covering ascenders and descenders
      const padX = x - 8;
      const padW = tw + 16;
      const padH = maskSz * 1.08;
      const padY = rowY - padH * 0.5;
      const cornerR = 8;

      // 1. Render Underlying Text
      c.save();
      c.font = `900 ${maskSz}px "Archivo", sans-serif`;

      if (isCur) {
        // Kinetic pop for active word
        const wAge = Math.max(0, t - w.start);
        const wPunch = wAge < 0.22 ? 1 + 0.10 * Math.sin((wAge / 0.22) * Math.PI) : 1;

        c.save();
        c.translate(x + tw * 0.5, rowY);
        c.scale(wPunch, wPunch);

        // Radiant glow bloom
        c.shadowColor = 'rgba(217,93,57,0.55)';
        c.shadowBlur = 24;

        c.fillStyle = `rgba(217,93,57,${rowAlpha})`;
        c.fillText(text, -tw * 0.5, 0);
        c.restore();
      } else if (isSpoken) {
        // Solid deep ink for completed words
        c.fillStyle = `rgba(26,18,9,${rowAlpha})`;
        c.fillText(text, x, rowY);
      } else {
        // Subtle ghost text beneath mask for depth
        c.fillStyle = `rgba(26,18,9,${rowAlpha * 0.15})`;
        c.fillText(text, x, rowY);
      }
      c.restore();

      // 2. Render Redaction Mask Pad (if not fully wiped)
      const cover = 1 - wipeEase;
      if (cover > 0.001) {
        c.save();

        const maskLeft = padX + padW * (1 - cover);
        const maskWidth = padW * cover;

        // Clip to remaining mask area
        c.beginPath();
        roundRect(c, maskLeft, padY, maskWidth, padH, Math.min(cornerR, maskWidth * 0.5));
        c.clip();

        // Warm bone redaction fill
        c.fillStyle = `rgba(235,226,208,${rowAlpha * 0.95})`;
        c.fill();

        // Subtle confidential dot pattern inside redaction tablet
        const dotGap = 10;
        c.fillStyle = `rgba(28,21,13,${rowAlpha * 0.22})`;
        const dotY = padY + padH * 0.5;
        for (let dx = padX + 12; dx < padX + padW - 8; dx += dotGap) {
          if (dx >= maskLeft && dx <= maskLeft + maskWidth) {
            c.beginPath();
            c.arc(dx, dotY, 1.8, 0, Math.PI * 2);
            c.fill();
          }
        }

        // Hairline outline
        c.strokeStyle = `rgba(28,21,13,${rowAlpha * 0.18})`;
        c.lineWidth = 1;
        roundRect(c, padX, padY, padW, padH, cornerR);
        c.stroke();

        c.restore();

        // 3. Hot Laser Scanline Edge leading the wipe
        if (p > 0.01 && p < 0.99) {
          c.save();
          const laserX = maskLeft;
          const laserH = padH + 8;
          const laserY = padY - 4;

          c.shadowColor = 'rgba(217,93,57,0.85)';
          c.shadowBlur = 18;

          c.fillStyle = `rgba(217,93,57,${rowAlpha})`;
          c.fillRect(laserX - 1.5, laserY, 3.5, laserH);

          // Intense center laser spark
          c.fillStyle = '#ffffff';
          c.fillRect(laserX - 0.75, laserY + 3, 1.5, laserH - 6);
          c.restore();
        }
      }

      x += tw + gap;
    });

    rowY += rowH;
  });

  c.restore();
};
