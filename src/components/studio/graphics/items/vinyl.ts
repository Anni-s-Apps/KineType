import { GraphicContext } from '../types';

export const renderVinyl = (ctx: GraphicContext) => {
  const { c, W, t, isLandscape, C } = ctx;
  c.save();
  const vx = isLandscape ? W - 90 : W - 80;
  const vy = isLandscape ? 75 : 85;
  const vr = isLandscape ? 38 : 34;

  c.translate(vx, vy);
  c.rotate(t * 2.5);

  // Outer vinyl ring
  c.beginPath();
  c.arc(0, 0, vr, 0, Math.PI * 2);
  c.fillStyle = C.ink;
  c.fill();

  // Grooves
  c.strokeStyle = 'rgba(232,220,200,0.25)';
  c.lineWidth = 1;
  [0.85, 0.7, 0.55].forEach(k => {
    c.beginPath();
    c.arc(0, 0, vr * k, 0, Math.PI * 2);
    c.stroke();
  });

  // Center vinyl label
  c.beginPath();
  c.arc(0, 0, vr * 0.38, 0, Math.PI * 2);
  c.fillStyle = C.signal;
  c.fill();

  // Spindle hole
  c.beginPath();
  c.arc(0, 0, 3, 0, Math.PI * 2);
  c.fillStyle = C.paper;
  c.fill();

  c.restore();
};
