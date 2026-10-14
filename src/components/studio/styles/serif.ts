import { StyleRenderContext } from './types';

/**
 * Serif Style (Fuse editorial / Cormorant Garamond in pdoom):
 * Luxury editorial floating serif, soft wave oscillation, wrapped lines,
 * and illuminated signal star ornaments with underline on the active word.
 */
export const renderSerif = (ctx: StyleRenderContext) => {
  const { c, W, t, curLine, activeWord, fontSize, fmt, C } = ctx;
  if (!curLine) return;

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // Smooth vertical float
  const floatY = Math.sin(t * 1.6) * 14;
  c.save();
  c.translate(0, floatY);

  const sz = Math.min(fontSize * 1.25, 96);
  c.font = `italic 600 ${sz}px "Cormorant Garamond", serif`;
  c.fillStyle = C.ink;

  const fullTxt = fmt(curLine.text);
  const maxW = W - 160;
  const totalTW = c.measureText(fullTxt).width;

  if (totalTW < maxW) {
    c.fillText(fullTxt, 0, -24);
  } else {
    const half = Math.ceil(curLine.words.length / 2);
    const r1 = curLine.words.slice(0, half).map(w => fmt(w.word)).join(' ');
    const r2 = curLine.words.slice(half).map(w => fmt(w.word)).join(' ');
    c.fillText(r1, 0, -sz * 0.68);
    c.fillText(r2, 0, sz * 0.68);
  }

  // Active word: glowing star accents + underline
  if (activeWord) {
    c.font = `italic 700 ${sz * 0.62}px "Cormorant Garamond", serif`;
    c.fillStyle = C.signal;
    c.shadowColor = C.signal;
    c.shadowBlur = 20;
    const badgeText = `✦  ${fmt(activeWord.word)}  ✦`;
    c.fillText(badgeText, 0, sz * 1.2);
    c.shadowBlur = 0;

    const uw = c.measureText(badgeText).width;
    c.fillStyle = C.signal;
    c.fillRect(-uw * 0.5, sz * 1.2 + sz * 0.38, uw, 2);
  }

  c.restore();
};
