import { StyleRenderContext, TimedWord, clamp, ease, pulse } from './types';

/**
 * Press Style — Heavy Industrial Hydraulic Compression & Typographic Clamp
 *
 * Upgrades:
 *  1. Fixed text collision: words and rows wrap dynamically to never overlap.
 *  2. Real hydraulic vise jaws (top and bottom clamp bars with pressure teeth and metric gauges)
 *     that slam inward on line entry with physical spring impact and subtle micro-rumble.
 *  3. Material squish physics: active word compresses vertically (0.92) and expands horizontally (1.08)
 *     like hot metal stamped under a hydraulic press, glowing in burnt-orange (#d95d39).
 *  4. Spoken words lock into solid heavyweight obsidian ink (#1a1209).
 *  5. Smooth hydraulic release and lift exit — zero awkward clipping or static pop-ins.
 */
export const renderPress = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C, isLandscape, roundRect } = ctx;
  if (!curLine) return;

  const tStart = curLine.start;
  const tEnd = curLine.end;
  if (t < tStart) return;

  const age = t - tStart;
  const tExit = tEnd - 0.22;

  // 1. Hydraulic Clamp Progress (Fast spring clamp inward from top & bottom)
  const clampK = ease.outBack(clamp(age / 0.28));
  const impactAge = age - 0.26;
  const impactRumble = impactAge > 0 && impactAge < 0.16
    ? Math.sin(impactAge * 70) * 2.5 * (1 - impactAge / 0.16)
    : 0;

  // 2. Smooth Hydraulic Release Exit
  let exitSlideY = 0;
  let exitScale = 1;
  let alpha = 1;

  if (t >= tExit) {
    const k = clamp((t - tExit) / 0.22);
    exitSlideY = -22 * ease.inCubic(k);
    exitScale = 1 - 0.05 * k;
    alpha = 1 - ease.inCubic(k);
  }

  c.save();
  c.scale(exitScale, exitScale);
  c.translate(0, exitSlideY + impactRumble);

  c.textAlign = 'left';
  c.textBaseline = 'middle';

  const rawWords = curLine.words;
  const maxSafeW = W - (isLandscape ? 260 : 180);
  let pressSz = fontSize * (isLandscape ? 1.4 : 1.6);
  c.font = `900 ${pressSz}px "Archivo", sans-serif`;

  // Dynamically wrap words into neat, uncrowded rows
  const wordsPerRow = isLandscape ? 4 : 2;
  const rows: { w: TimedWord; text: string; tw: number }[][] = [];
  let curRow: { w: TimedWord; text: string; tw: number }[] = [];
  let curRowW = 0;
  const spaceW = c.measureText(' ').width;

  for (const w of rawWords) {
    const txt = fmt(w.word);
    const tw = c.measureText(txt).width;
    if (curRow.length > 0 && (curRowW + tw > maxSafeW || curRow.length >= wordsPerRow)) {
      rows.push(curRow);
      curRow = [];
      curRowW = 0;
    }
    curRow.push({ w, text: txt, tw });
    curRowW += tw + spaceW;
  }
  if (curRow.length) rows.push(curRow);

  // Auto-scale font down if any row exceeds maxSafeW
  const widestRow = Math.max(
    ...rows.map(r => r.reduce((sum, item) => sum + item.tw + spaceW, -spaceW)),
    1
  );
  if (widestRow > maxSafeW) {
    const scaleFactor = maxSafeW / widestRow;
    pressSz *= scaleFactor;
    c.font = `900 ${pressSz}px "Archivo", sans-serif`;
    rows.forEach(r => {
      r.forEach(item => {
        item.tw *= scaleFactor;
      });
    });
  }

  const rowHeight = pressSz * 1.20;
  const totalBlockH = rows.length * rowHeight;
  const vStartY = -((rows.length - 1) * rowHeight) * 0.5;

  // ── 3. HYDRAULIC CLAMP JAWS (TOP & BOTTOM BARS) ───────────────────────────
  const barW = Math.min(W * 0.76, Math.max(widestRow + 60, 280));
  const openOffset = (1 - clampK) * 65; // Moves inward by 65px
  const clampPad = isLandscape ? 24 : 32;

  const topBarY = vStartY - clampPad - openOffset;
  const bottomBarY = vStartY + totalBlockH * 0.5 + clampPad + openOffset;

  c.save();
  // Top Clamp Bar
  c.fillStyle = `rgba(26,18,9,${alpha * 0.85})`;
  c.fillRect(-barW * 0.5, topBarY - 2, barW, 4);

  // Top Teeth (Hydraulic Grip Brackets)
  c.fillRect(-barW * 0.5, topBarY + 2, 6, 7);
  c.fillRect(barW * 0.5 - 6, topBarY + 2, 6, 7);
  c.fillRect(-3, topBarY + 2, 6, 5);

  // Top Gauge Label
  const topBadge = `[ HYDRAULIC PRESS · ${String(curLine.i + 1).padStart(2, '0')} ]`;
  c.font = `700 11px "IBM Plex Mono", monospace`;
  c.textAlign = 'center';
  c.fillStyle = `rgba(217,93,57,${alpha * 0.85})`;
  c.fillText(topBadge, 0, topBarY - 14);

  // Bottom Clamp Bar
  c.fillStyle = `rgba(26,18,9,${alpha * 0.85})`;
  c.fillRect(-barW * 0.5, bottomBarY - 2, barW, 4);

  // Bottom Teeth
  c.fillRect(-barW * 0.5, bottomBarY - 9, 6, 7);
  c.fillRect(barW * 0.5 - 6, bottomBarY - 9, 6, 7);
  c.fillRect(-3, bottomBarY - 7, 6, 5);

  // Bottom Pressure Spec
  c.font = `600 10px "IBM Plex Mono", monospace`;
  c.fillStyle = `rgba(26,18,9,${alpha * 0.45})`;
  c.fillText('PRESSURE: 2400 PSI · SOLID STATE SLAB', 0, bottomBarY + 16);
  c.restore();

  // ── 4. TYPOGRAPHIC SLAB (PUNCH & COMPRESS) ────────────────────────────────
  c.textAlign = 'left';
  c.textBaseline = 'middle';

  rows.forEach((row, ri) => {
    const rowY = vStartY + ri * rowHeight;
    const rowW = row.reduce((sum, item) => sum + item.tw + spaceW, -spaceW);
    let curX = -rowW * 0.5;

    row.forEach(({ w, text, tw }) => {
      const isCur = !!(
        activeWord &&
        activeWord.word === w.word &&
        Math.abs(activeWord.start - w.start) < 0.16
      );
      const isSpoken = t >= w.end;

      c.save();

      if (isCur) {
        // Material compression under stamp: squishes vertical (0.92) & expands horizontal (1.08)
        const wAge = Math.max(0, t - w.start);
        const squish = wAge < 0.20
          ? 1 + 0.10 * Math.sin((wAge / 0.20) * Math.PI)
          : 1;

        c.translate(curX + tw * 0.5, rowY);
        c.scale(squish, 2 - squish);

        // Radiant hydraulic glow
        c.shadowColor = 'rgba(217,93,57,0.6)';
        c.shadowBlur = 24;

        c.font = `900 ${pressSz}px "Archivo", sans-serif`;
        c.fillStyle = `rgba(217,93,57,${alpha})`;
        c.fillText(text, -tw * 0.5, 0);
      } else {
        c.translate(curX, rowY);
        c.font = `900 ${pressSz}px "Archivo", sans-serif`;

        if (isSpoken) {
          // Solid heavy obsidian ink
          c.fillStyle = `rgba(26,18,9,${alpha})`;
        } else {
          // Uncompressed upcoming word: soft architectural ash
          c.fillStyle = `rgba(26,18,9,${alpha * 0.25})`;
        }
        c.fillText(text, 0, 0);
      }

      c.restore();
      curX += tw + spaceW;
    });
  });

  c.restore();
};
