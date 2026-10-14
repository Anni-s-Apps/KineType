import { GraphicContext } from '../types';

export const renderParticles = (ctx: GraphicContext) => {
  const { c, W, H, t } = ctx;
  c.save();
  const count = 30;
  for (let i = 0; i < count; i++) {
    const px = ((i * 127.3 + t * (12 + (i % 5) * 6)) % (W + 60)) - 30;
    const py = ((i * 311.7 - t * (16 + (i % 4) * 5)) % (H + 60));
    const finalY = py < 0 ? py + H + 60 : py;
    const alpha = 0.12 + 0.18 * Math.sin(t * 2 + i * 1.5);
    const r = 1.2 + (i % 3) * 1.2;

    c.fillStyle = i % 5 === 0 ? `rgba(201,79,0,${Math.max(0, alpha * 1.5)})` : `rgba(26,18,9,${Math.max(0, alpha)})`;
    c.beginPath();
    c.arc(px, finalY, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
};
