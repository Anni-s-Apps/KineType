import { GraphicContext } from '../types';

export const renderBotanicalFern = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape } = ctx;
  c.save();

  // Bottom-Left corner arching fern frond
  const originX = 0;
  const originY = H;
  const sway = Math.sin(t * 1.3) * 0.025;

  c.translate(originX, originY);
  c.rotate(-Math.PI * 0.45 + sway);

  const frondLen = isLandscape ? 380 : 440;
  const leafletPairs = 18;

  // Main stem (rachis)
  c.strokeStyle = 'rgba(50, 40, 30, 0.9)';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(frondLen * 0.5, 40, frondLen, 120);
  c.stroke();

  // Draw pairs of pinnate leaflets along the curving spine
  for (let i = 2; i <= leafletPairs; i++) {
    const frac = i / leafletPairs;
    // Point on quadratic curve
    const tFrac = frac;
    const inv = 1 - tFrac;
    const px = inv * inv * 0 + 2 * inv * tFrac * (frondLen * 0.5) + tFrac * tFrac * frondLen;
    const py = inv * inv * 0 + 2 * inv * tFrac * 40 + tFrac * tFrac * 120;

    // Tangent angle
    const tx = 2 * inv * (frondLen * 0.5) + 2 * tFrac * (frondLen - frondLen * 0.5);
    const ty = 2 * inv * 40 + 2 * tFrac * (120 - 40);
    const baseAngle = Math.atan2(ty, tx);

    const leafSize = Math.sin(frac * Math.PI) * (isLandscape ? 36 : 42);
    const tint = i % 2 === 0 ? 'rgba(64, 82, 54, 0.85)' : 'rgba(80, 102, 68, 0.82)';

    // Leaflet Upper
    c.save();
    c.translate(px, py);
    c.rotate(baseAngle - 1.1);
    c.fillStyle = tint;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(leafSize * 0.5, -leafSize * 0.35, leafSize * 0.8, -leafSize * 0.15, leafSize, 0);
    c.bezierCurveTo(leafSize * 0.8, leafSize * 0.15, leafSize * 0.5, leafSize * 0.35, 0, 0);
    c.fill();
    c.restore();

    // Leaflet Lower
    c.save();
    c.translate(px, py);
    c.rotate(baseAngle + 1.1);
    c.fillStyle = tint;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(leafSize * 0.5, -leafSize * 0.35, leafSize * 0.8, -leafSize * 0.15, leafSize, 0);
    c.bezierCurveTo(leafSize * 0.8, leafSize * 0.15, leafSize * 0.5, leafSize * 0.35, 0, 0);
    c.fill();
    c.restore();
  }

  c.restore();
};
