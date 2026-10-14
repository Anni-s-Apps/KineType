import { GraphicContext } from '../types';

export const renderWaveform = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape, C } = ctx;
  c.save();
  const barCount = isLandscape ? 38 : 26;
  const barW = isLandscape ? 6 : 5;
  const gap = isLandscape ? 8 : 7;
  const totalW = barCount * (barW + gap) - gap;
  const startX = (W - totalW) * 0.5;

  // Position waveform comfortably ABOVE the bottom lyrics subtitle line so they never collide
  const eqY = isLandscape ? H - 115 : H - 165;

  for (let i = 0; i < barCount; i++) {
    const freq = Math.sin(t * 8 + i * 0.45) * 0.5 + 0.5;
    const beat = Math.sin(t * 4 + i * 0.2) * Math.cos(t * 6 - i * 0.3);
    const h = 8 + Math.abs(freq * beat) * (isLandscape ? 38 : 48);

    c.fillStyle = i % 4 === 0 ? C.signal : 'rgba(26,18,9,0.55)';
    c.fillRect(startX + i * (barW + gap), eqY - h * 0.5, barW, h);
  }
  c.restore();
};
