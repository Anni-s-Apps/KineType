import { StyleRenderContext, clamp, ease, pulse, prog, lerp } from './types';

/**
 * Hook Style (Hook x4 in pdoom):
 * Full-frame word slam, type-specimen guidelines (baseline & cap-height),
 * multi-layered ghost echo trails, impact glow, and technical mono footnote.
 */
export const renderHook = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const bigW = activeWord || curLine.words[0];
  if (!bigW) return;

  const age = Math.max(0, t - bigW.start);
  const CAP = 0.686; // Archivo cap height

  // 1. Dynamic safe font size
  let hookSz = fontSize * (isLandscape ? 1.6 : 1.95);
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  const wordText = fmt(bigW.word);
  const mw = c.measureText(wordText).width;
  const maxHookW = W - 160;
  if (mw > maxHookW) {
    hookSz *= maxHookW / mw;
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  }

  // 2. High-impact slam bounce physics (arrives huge, bounces, subtle creep)
  const slamK = ease.outExpo(Math.min(1, age / 0.14));
  const slamScale = 1 + 0.38 * (1 - slamK) + 0.015 * Math.min(age, 2.5);

  const capH = hookSz * CAP;
  const baseY = 0; // Relative to center

  // 3. Type-specimen guidelines (baseline & cap-height hairlines)
  c.save();
  const guideAlpha = clamp(1 - age / 2.0) * 0.35 + 0.08;
  c.strokeStyle = `rgba(26,18,9,${guideAlpha})`;
  c.lineWidth = 1;

  // Baseline hairline across canvas
  c.beginPath();
  c.moveTo(-W * 0.45, capH * 0.5);
  c.lineTo(W * 0.45, capH * 0.5);
  c.stroke();

  // Cap-height hairline across canvas
  c.beginPath();
  c.moveTo(-W * 0.45, -capH * 0.5);
  c.lineTo(W * 0.45, -capH * 0.5);
  c.stroke();

  // Tiny mono guide annotations in the margins
  c.font = `400 13px "IBM Plex Mono", monospace`;
  c.fillStyle = `rgba(26,18,9,${guideAlpha * 1.6})`;
  c.textAlign = 'left';
  c.fillText('baseline', -W * 0.42, capH * 0.5 + 16);
  c.fillText('cap-height · 0.686 em', -W * 0.42, -capH * 0.5 - 8);
  c.restore();

  // 4. Ghost Echoes & Trails (Multiple falling/receding strobe outlines)
  c.save();
  c.translate(0, 0);
  c.scale(slamScale, slamScale);
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // Multi-layered strobe outline trails
  const trailCount = 4;
  for (let j = trailCount; j >= 1; j--) {
    const echoScale = 1.0 + j * 0.06 * Math.max(0, 1 - age / 0.35);
    const echoAlpha = clamp((1 - age / 0.4) * (0.35 / j));
    if (echoAlpha > 0.01) {
      c.save();
      c.scale(echoScale, echoScale);
      c.font = `900 ${hookSz}px "Archivo", sans-serif`;
      c.strokeStyle = j % 2 === 0 ? C.signal : `rgba(26,18,9,${echoAlpha})`;
      c.lineWidth = 2.5;
      c.strokeText(wordText, 0, 0);
      c.restore();
    }
  }

  // 5. Impact Pulse Glow
  const impPulse = pulse(t, bigW.start, 0.14);
  if (impPulse > 0.01) {
    c.shadowColor = C.signal;
    c.shadowBlur = 60 * impPulse;
  }

  // 6. Main Solid Slam Text
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  c.fillStyle = C.ink;
  c.fillText(wordText, 0, 0);
  c.shadowBlur = 0;
  c.restore();

  // 7. Technical Footnote / Metadata Readout below
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const footnoteY = (hookSz * CAP) * 0.5 + 75;

  c.font = `500 18px "IBM Plex Mono", monospace`;
  c.fillStyle = C.signal;
  c.fillText(`› ${curLine.text.toUpperCase()}`, 0, footnoteY);

  c.font = `400 13px "IBM Plex Mono", monospace`;
  c.fillStyle = C.ash;
  c.fillText(`HOOK SLAM · ${(bigW.end - bigW.start).toFixed(2)}s · T=${t.toFixed(2)}s`, 0, footnoteY + 28);
  c.restore();
};
