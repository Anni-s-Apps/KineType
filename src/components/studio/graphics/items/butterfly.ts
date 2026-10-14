import { GraphicContext } from '../types';

export const renderButterfly = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape } = ctx;
  c.save();

  // Floating flutter position near upper-left or center
  const baseX = isLandscape ? W * 0.22 : W * 0.28;
  const baseY = isLandscape ? H * 0.24 : H * 0.20;

  // Gentle hovering flight path
  const flyX = baseX + Math.sin(t * 1.8) * 35;
  const flyY = baseY + Math.cos(t * 2.2) * 22;
  const flightAngle = Math.sin(t * 1.8) * 0.25;

  c.translate(flyX, flyY);
  c.rotate(flightAngle);

  // Rapid wing flapping
  const wingFlap = Math.sin(t * 14);

  // Slender Body
  c.fillStyle = 'rgba(38, 28, 20, 0.95)';
  c.beginPath();
  c.ellipse(0, 0, 3, 14, 0, 0, Math.PI * 2);
  c.fill();

  // Head & Antennae
  c.beginPath();
  c.arc(0, -14, 2.5, 0, Math.PI * 2);
  c.fill();

  c.strokeStyle = 'rgba(38, 28, 20, 0.9)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -14);
  c.quadraticCurveTo(-6, -22, -10, -26);
  c.moveTo(0, -14);
  c.quadraticCurveTo(6, -22, 10, -26);
  c.stroke();

  // Draw Wings with flapping scaleX
  const drawWingPair = (side: 1 | -1) => {
    c.save();
    c.scale(side * Math.abs(wingFlap), 1);

    // Forewing
    c.fillStyle = 'rgba(214, 115, 96, 0.85)';
    c.strokeStyle = 'rgba(38, 28, 20, 0.7)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -6);
    c.bezierCurveTo(25, -28, 48, -18, 44, 4);
    c.bezierCurveTo(36, 14, 12, 10, 0, 2);
    c.closePath();
    c.fill();
    c.stroke();

    // Forewing inner vein art
    c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, -2);
    c.lineTo(34, -4);
    c.stroke();

    // Hindwing
    c.fillStyle = 'rgba(235, 160, 140, 0.8)';
    c.strokeStyle = 'rgba(38, 28, 20, 0.7)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, 2);
    c.bezierCurveTo(24, 10, 32, 28, 18, 32);
    c.bezierCurveTo(6, 32, 2, 18, 0, 8);
    c.closePath();
    c.fill();
    c.stroke();

    c.restore();
  };

  drawWingPair(1);
  drawWingPair(-1);

  c.restore();
};
