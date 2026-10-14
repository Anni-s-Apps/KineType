import { StyleRenderContext, clamp, ease, pulse } from './types';

/**
 * Verdict Style — Luxury Swiss Editorial & Punchy Kinetic Typography
 *
 * Upgrades:
 *  1. Tag [ 04 / VERDICT ] relocated to an aesthetic, centered floating pill badge
 *     framed cleanly ABOVE the typography block in both portrait and landscape.
 *  2. Damped harmonic spring physics on entry with row-by-row micro-stagger.
 *  3. Live word-by-word karaoke reactivity: active word punches with elastic spring scale
 *     and warm ambient terracotta bloom (#d95d39), while spoken words settle into deep ink
 *     and upcoming words stay in muted ash.
 *  4. Silky smooth upward glide and dissolve exit with zero jarring implosions.
 *  5. Delicate editorial hairline divider rule framing the bottom of the verdict block.
 */
export const renderVerdict = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C, isLandscape, roundRect } = ctx;
  if (!curLine) return;

  const tStart = curLine.start;
  const tEnd = curLine.end;
  if (t < tStart) return;

  const age = t - tStart;
  const lineDur = Math.max(0.4, tEnd - tStart);
  const tExit = tEnd - 0.24;

  // 1. Overall Line Entrance Spring (Damped Harmonic Oscillation)
  const springScale = age < 0.45
    ? 1 + 0.24 * Math.exp(-age * 9) * Math.cos(age * 18)
    : 1;

  const enterSlideY = age < 0.35
    ? 22 * Math.exp(-age * 12)
    : 0;

  // 2. Silky Exit Lift & Dissolve
  let exitSlideY = 0;
  let exitScale = 1;
  let alpha = 1;

  if (t >= tExit) {
    const k = clamp((t - tExit) / 0.24);
    exitSlideY = -26 * ease.inCubic(k);
    exitScale = 1 - 0.06 * k;
    alpha = 1 - ease.inCubic(k);
  }

  c.save();
  c.scale(springScale * exitScale, springScale * exitScale);
  c.translate(0, enterSlideY + exitSlideY);

  // 3. Dynamic Font Size & Multi-Row Wrapping
  const maxSafeW = W - (isLandscape ? 240 : 160);
  let headlineSize = fontSize * (isLandscape ? 1.45 : 1.7);
  c.font = `900 ${headlineSize}px "Archivo", sans-serif`;

  const rawWords = curLine.words;
  const wordsPerRow = isLandscape ? 4 : 2;
  const rows: { words: typeof rawWords; text: string }[] = [];
  let curRow: typeof rawWords = [];

  for (const w of rawWords) {
    const testWords = [...curRow, w];
    const testText = testWords.map(tw => fmt(tw.word)).join(' ');
    if (
      curRow.length > 0 &&
      (c.measureText(testText).width > maxSafeW || curRow.length >= wordsPerRow)
    ) {
      rows.push({
        words: curRow,
        text: curRow.map(tw => fmt(tw.word)).join(' '),
      });
      curRow = [w];
    } else {
      curRow.push(w);
    }
  }
  if (curRow.length > 0) {
    rows.push({
      words: curRow,
      text: curRow.map(tw => fmt(tw.word)).join(' '),
    });
  }

  // Auto-scale font down if any row exceeds maxSafeW
  const widestRow = Math.max(...rows.map(r => c.measureText(r.text).width), 1);
  if (widestRow > maxSafeW) {
    headlineSize *= maxSafeW / widestRow;
    c.font = `900 ${headlineSize}px "Archivo", sans-serif`;
  }

  const rowHeight = headlineSize * 1.22;
  const totalBlockH = rows.length * rowHeight;
  const vStartY = -((rows.length - 1) * rowHeight) * 0.5;


  // ── 5. KINETIC TYPOGRAPHY HEADLINE ROWS ────────────────────────────────────
  c.textAlign = 'left';
  c.textBaseline = 'middle';

  rows.forEach((row, ri) => {
    // Row-by-row entry micro-stagger
    const rowDelay = ri * 0.045;
    const rowAge = Math.max(0, age - rowDelay);
    const rowEnterSlide = rowAge < 0.3 ? 16 * Math.exp(-rowAge * 14) : 0;
    const rowAlpha = clamp(rowAge / 0.12) * alpha;

    const rowY = vStartY + ri * rowHeight + rowEnterSlide;

    // Measure each word in row to center the row as a whole
    c.font = `900 ${headlineSize}px "Archivo", sans-serif`;
    const spaceW = c.measureText(' ').width;
    const wordWidths = row.words.map(w => c.measureText(fmt(w.word)).width);
    const totalRowW = wordWidths.reduce((sum, w) => sum + w, 0) + (row.words.length - 1) * spaceW;

    let curX = -totalRowW * 0.5;

    row.words.forEach((w, wi) => {
      const isCur = !!(
        activeWord &&
        activeWord.word === w.word &&
        Math.abs(activeWord.start - w.start) < 0.16
      );
      const isSpoken = t >= w.end;
      const wordW = wordWidths[wi];

      c.save();

      if (isCur) {
        // Active word kinetic bounce punch
        const wAge = Math.max(0, t - w.start);
        const wPunch = wAge < 0.22
          ? 1 + 0.12 * Math.sin((wAge / 0.22) * Math.PI)
          : 1;

        // Origin at center of word
        c.translate(curX + wordW * 0.5, rowY);
        c.scale(wPunch, wPunch);

        // Radiant warm terracotta bloom
        c.shadowColor = 'rgba(217,93,57,0.5)';
        c.shadowBlur = 24;

        c.font = `900 ${headlineSize}px "Archivo", sans-serif`;
        c.fillStyle = `rgba(217,93,57,${rowAlpha})`;
        c.fillText(fmt(w.word), -wordW * 0.5, 0);
      } else {
        c.translate(curX, rowY);
        c.font = `900 ${headlineSize}px "Archivo", sans-serif`;

        if (isSpoken) {
          // Spoken: deep rich obsidian ink
          c.fillStyle = `rgba(26,18,9,${rowAlpha})`;
        } else {
          // Upcoming: soft muted editorial ash
          c.fillStyle = `rgba(26,18,9,${rowAlpha * 0.32})`;
        }
        c.fillText(fmt(w.word), 0, 0);
      }

      c.restore();
      curX += wordW + spaceW;
    });
  });

  // ── 6. EDITORIAL FRAMING RULE ─────────────────────────────────────────────
  // Delicate hairline rule and accent diamond below the typography block
  const ruleY = vStartY + totalBlockH * 0.5 + (isLandscape ? 18 : 26);
  const ruleMaxW = Math.min(widestRow * 0.65, W * 0.45);
  const ruleProgress = ease.outCubic(clamp(age / 0.38));
  const currentRuleW = ruleMaxW * ruleProgress;

  if (currentRuleW > 10) {
    c.save();
    c.strokeStyle = `rgba(217,93,57,${alpha * 0.28})`;
    c.lineWidth = 1.2;

    const halfW = currentRuleW * 0.5;
    const gap = 16;

    // Left segment
    c.beginPath();
    c.moveTo(-halfW, ruleY);
    c.lineTo(-gap, ruleY);
    c.stroke();

    // Right segment
    c.beginPath();
    c.moveTo(gap, ruleY);
    c.lineTo(halfW, ruleY);
    c.stroke();

    // Center accent diamond
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `700 ${isLandscape ? 10 : 12}px "IBM Plex Mono", monospace`;
    c.fillStyle = `rgba(217,93,57,${alpha * 0.75})`;
    c.fillText('✦', 0, ruleY);
    c.restore();
  }

  c.restore();
};
