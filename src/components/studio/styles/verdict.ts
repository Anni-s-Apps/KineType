import { StyleRenderContext, clamp, ease, pulse } from './types';

/**
 * Verdict Style (verdict.ts in pdoom):
 * Giant centered line slam, radial glow burst, elastic hold,
 * and implosion on line end. Words wrap dynamically into punchy rows to never overflow.
 */
export const renderVerdict = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const tSlam = curLine.start;
  const tHold = curLine.end - 0.2;

  if (t < tSlam) return;

  const dtSlam = t - tSlam;
  const slamScale = 1 + 0.32 * Math.exp(-dtSlam * 7);
  let implodeScale = 1;
  let alpha = 1;

  if (t >= tHold) {
    const k = clamp((t - tHold) / 0.22);
    implodeScale = 1 - ease.inCubic(k);
    alpha = 1 - k * k;
  }

  c.save();
  c.scale(slamScale * implodeScale, slamScale * implodeScale);

  const impPulse = pulse(t, tSlam, 0.14);
  if (impPulse > 0.01) {
    c.shadowColor = C.signal;
    c.shadowBlur = 42 * impPulse;
  }

  // Dynamic wrap into lines that fit within maxSafeW
  const maxSafeW = W - 180;
  let testSz = fontSize * 1.5;
  c.font = `900 ${testSz}px "Archivo", sans-serif`;

  const rawWords = curLine.words.map(w => fmt(w.word));
  const vRows: string[] = [];
  let curVRow: string[] = [];
  const wordsPerVRow = isLandscape ? 4 : 2;

  for (const rw of rawWords) {
    const testRow = [...curVRow, rw].join(' ');
    if (curVRow.length > 0 && (c.measureText(testRow).width > maxSafeW || curVRow.length >= wordsPerVRow)) {
      vRows.push(curVRow.join(' '));
      curVRow = [rw];
    } else {
      curVRow.push(rw);
    }
  }
  if (curVRow.length > 0) vRows.push(curVRow.join(' '));

  // Check if any row still exceeds maxSafeW and scale testSz down
  const widestRow = Math.max(...vRows.map(r => c.measureText(r).width), 1);
  if (widestRow > maxSafeW) {
    testSz *= maxSafeW / widestRow;
    c.font = `900 ${testSz}px "Archivo", sans-serif`;
  }

  const vRowH = testSz * 1.25;
  const vStartY = -((vRows.length - 1) * vRowH) * 0.5;

  c.fillStyle = `rgba(26,18,9,${alpha})`;
  vRows.forEach((r, ri) => {
    c.fillText(r, 0, vStartY + ri * vRowH);
  });

  c.shadowBlur = 0;

  // Mono subtitle tag
  c.font = `500 22px "IBM Plex Mono", monospace`;
  c.fillStyle = `rgba(201,79,0,${alpha * 0.8})`;
  c.fillText(`[ ${String(curLine.i).padStart(2, '0')} / VERDICT ]`, 0, vStartY + vRows.length * vRowH * 0.5 + 45);

  c.restore();
};
