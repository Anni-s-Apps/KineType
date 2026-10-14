import { GraphicContext } from '../types';

export const renderStars = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape } = ctx;
  c.save();
  c.font = '22px "Cormorant Garamond", serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  const starPoints = isLandscape
    ? [
        { x: W * 0.15, y: H * 0.22, sym: '✦' },
        { x: W * 0.85, y: H * 0.26, sym: '✧' },
        { x: W * 0.18, y: H * 0.72, sym: '✳' },
        { x: W * 0.82, y: H * 0.76, sym: '✦' },
      ]
    : [
        { x: W * 0.16, y: H * 0.18, sym: '✦' },
        { x: W * 0.84, y: H * 0.22, sym: '✧' },
        { x: W * 0.18, y: H * 0.70, sym: '✳' },
        { x: W * 0.82, y: H * 0.74, sym: '✦' },
      ];

  starPoints.forEach((sp, idx) => {
    const pulseK = 0.6 + 0.4 * Math.sin(t * 3.5 + idx * 1.6);
    c.fillStyle = idx % 2 === 0 ? `rgba(201,79,0,${pulseK * 0.85})` : `rgba(26,18,9,${pulseK * 0.45})`;
    c.save();
    c.translate(sp.x, sp.y);
    c.rotate(t * 0.8 + idx);
    c.scale(pulseK, pulseK);
    c.fillText(sp.sym, 0, 0);
    c.restore();
  });
  c.restore();
};
