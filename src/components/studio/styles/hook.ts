import { StyleRenderContext, clamp, ease, pulse } from './types';

/**
 * Hook Style (Clean, high-impact kinetic typography):
 * Focused entirely on punchy, aesthetic word animations with no developer debug lines.
 * Features:
 *  - High-impact spring scale-slam
 *  - 3D kinetic strobe echo offsets that expand on impact
 *  - Warm radial impact glow
 *  - Clean lyric context subtitle (no debug frames or technical annotations)
 */
export const renderHook = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C, isLandscape } = ctx;
  if (!curLine) return;

  const bigW = activeWord || curLine.words[0];
  if (!bigW) return;

  const age = Math.max(0, t - bigW.start);

  // 1. Safe font scaling — never overflows canvas
  let hookSz = fontSize * (isLandscape ? 1.6 : 2.0);
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  const wordText = fmt(bigW.word);
  const mw = c.measureText(wordText).width;
  const maxHookW = W - 180;
  if (mw > maxHookW) {
    hookSz *= maxHookW / mw;
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  }

  // 2. High-impact spring slam bounce (explodes in, bounces elastically, then settles)
  const slamK = ease.outExpo(Math.min(1, age / 0.14));
  const slamScale = 1 + 0.35 * (1 - slamK) + 0.012 * Math.min(age, 2.0);

  c.save();
  c.scale(slamScale, slamScale);
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // 3. Strobe Echo Layers (Kinetic 3D offset outlines that pulse outward on impact)
  const impPulse = pulse(t, bigW.start, 0.18);
  const echoOffset = 8 * Math.max(0, 1 - age / 0.28);

  // Layer A: Signal orange offset echo (bottom-right)
  if (age < 0.35) {
    const alphaA = clamp((1 - age / 0.35) * 0.7);
    c.save();
    c.translate(echoOffset, echoOffset);
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
    c.strokeStyle = `rgba(201,79,0,${alphaA})`;
    c.lineWidth = 3;
    c.strokeText(wordText, 0, 0);
    c.restore();
  }

  // Layer B: Subtle ash offset echo (top-left)
  if (age < 0.25) {
    const alphaB = clamp((1 - age / 0.25) * 0.4);
    c.save();
    c.translate(-echoOffset * 0.7, -echoOffset * 0.7);
    c.font = `900 ${hookSz}px "Archivo", sans-serif`;
    c.strokeStyle = `rgba(26,18,9,${alphaB})`;
    c.lineWidth = 2;
    c.strokeText(wordText, 0, 0);
    c.restore();
  }

  // 4. Warm Impact Glow
  if (impPulse > 0.01) {
    c.shadowColor = C.signal;
    c.shadowBlur = 45 * impPulse;
  }

  // 5. Main Solid Slam Word (Rich warm ink)
  c.font = `900 ${hookSz}px "Archivo", sans-serif`;
  c.fillStyle = C.ink;
  c.fillText(wordText, 0, 0);
  c.shadowBlur = 0;

  c.restore();

  // 6. Clean, aesthetic lyric context subtitle below
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const subtitleY = (hookSz * 0.686) * 0.5 + 58;

  c.font = `600 24px "Archivo", sans-serif`;
  c.fillStyle = C.ash;
  c.fillText(curLine.text, 0, subtitleY);
  c.restore();
};
