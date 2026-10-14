import { GraphicContext } from '../types';

export const renderPetals = (ctx: GraphicContext) => {
  const { c, W, H, t } = ctx;
  c.save();

  const count = 26;
  const petalColors = [
    'rgba(214, 115, 96, 0.85)',
    'rgba(235, 150, 135, 0.8)',
    'rgba(201, 79, 0, 0.75)',
    'rgba(240, 180, 170, 0.75)',
  ];

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random values per petal
    const seedX = ((i * 137.5) % 1000) / 1000;
    const speed = 35 + (i % 7) * 12;
    const swaySpeed = 1.2 + (i % 5) * 0.4;
    const swayAmp = 25 + (i % 6) * 15;

    // Continuous downward loop
    const py = ((i * 211.3 + t * speed) % (H + 120)) - 60;
    const px = (seedX * W) + Math.sin(t * swaySpeed + i * 1.7) * swayAmp;

    // 3D tumble: rot and scaleY flip
    const rot = t * (0.8 + (i % 3) * 0.5) + i * 2;
    const tumble = Math.cos(t * 2.2 + i * 1.3);
    const size = 11 + (i % 4) * 4;

    c.save();
    c.translate(px, py);
    c.rotate(rot);
    c.scale(1, tumble); // 3D flipping in breeze

    c.fillStyle = petalColors[i % petalColors.length];
    c.beginPath();
    // Teardrop curved petal shape
    c.moveTo(0, -size);
    c.bezierCurveTo(size * 0.75, -size * 0.6, size * 0.75, size * 0.5, 0, size);
    c.bezierCurveTo(-size * 0.75, size * 0.5, -size * 0.75, -size * 0.6, 0, -size);
    c.fill();

    // Subtle petal crease
    c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -size * 0.7);
    c.lineTo(0, size * 0.7);
    c.stroke();

    c.restore();
  }

  c.restore();
};
