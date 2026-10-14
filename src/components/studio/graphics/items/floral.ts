import { GraphicContext } from '../types';

export const renderFloral = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape } = ctx;
  c.save();

  // Subtle wind sway
  const sway = Math.sin(t * 1.4) * 0.035;

  // Helper: Draw single botanical leaf
  const drawLeaf = (x: number, y: number, angle: number, size: number, color: string) => {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(size * 0.45, -size * 0.35, size * 0.8, -size * 0.15, size, 0);
    c.bezierCurveTo(size * 0.8, size * 0.15, size * 0.45, size * 0.35, 0, 0);
    c.fill();
    // Central vein
    c.strokeStyle = 'rgba(26,18,9,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(size * 0.85, 0);
    c.stroke();
    c.restore();
  };

  // Helper: Draw blooming flower with petals and center
  const drawBlossom = (
    x: number,
    y: number,
    r: number,
    petalCount: number,
    rot: number,
    petalColor: string,
    centerColor: string
  ) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    const breathe = 1 + Math.sin(t * 2.2 + x) * 0.04;
    c.scale(breathe, breathe);

    c.fillStyle = petalColor;
    for (let i = 0; i < petalCount; i++) {
      const a = (i * 2 * Math.PI) / petalCount;
      c.save();
      c.rotate(a);
      c.beginPath();
      c.ellipse(r * 0.65, 0, r * 0.55, r * 0.32, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    // Pistil Center
    c.fillStyle = centerColor;
    c.beginPath();
    c.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    c.fill();

    // Center pollen dots
    c.fillStyle = 'rgba(26,18,9,0.4)';
    c.beginPath();
    c.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  // 1. TOP-LEFT CORNER VINE & BLOSSOMS
  c.save();
  c.translate(0, 0);
  c.rotate(sway);

  // Main Vine Stem
  c.strokeStyle = 'rgba(45, 36, 26, 0.85)';
  c.lineWidth = 3.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(110, 60, 160, 210);
  c.quadraticCurveTo(190, 310, 260, 340);
  c.stroke();

  // Secondary Branch 1
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(110, 70);
  c.quadraticCurveTo(240, 90, 330, 130);
  c.stroke();

  // Secondary Branch 2
  c.beginPath();
  c.moveTo(150, 190);
  c.quadraticCurveTo(90, 270, 70, 380);
  c.stroke();

  // Leaves along stems
  const leafColor1 = 'rgba(74, 94, 62, 0.85)';
  const leafColor2 = 'rgba(92, 115, 78, 0.8)';
  drawLeaf(65, 38, 0.6, 32, leafColor1);
  drawLeaf(110, 85, 1.2, 36, leafColor2);
  drawLeaf(135, 150, 0.8, 30, leafColor1);
  drawLeaf(170, 240, 1.5, 34, leafColor2);
  drawLeaf(205, 310, 0.9, 28, leafColor1);
  drawLeaf(250, 335, 0.4, 24, leafColor2);

  // Leaves on branches
  drawLeaf(170, 80, 0.1, 26, leafColor1);
  drawLeaf(230, 95, 0.3, 30, leafColor2);
  drawLeaf(285, 115, 0.5, 24, leafColor1);
  drawLeaf(120, 230, 2.1, 28, leafColor2);
  drawLeaf(80, 320, 1.9, 26, leafColor1);

  // Blossoms
  const petalPink = 'rgba(214, 115, 96, 0.92)';
  const petalCream = 'rgba(240, 175, 155, 0.9)';
  const centerGold = 'rgba(212, 150, 42, 0.95)';

  drawBlossom(160, 210, 22, 5, t * 0.2, petalPink, centerGold);
  drawBlossom(330, 130, 18, 5, 0.8, petalCream, centerGold);
  drawBlossom(260, 340, 16, 5, 0.4, petalPink, centerGold);
  drawBlossom(70, 380, 15, 5, -0.6, petalCream, centerGold);
  c.restore();

  // 2. BOTTOM-RIGHT CORNER COMPLEMENTARY FLOWER
  c.save();
  c.translate(W, H);
  c.rotate(Math.PI + sway * 0.8);

  c.strokeStyle = 'rgba(45, 36, 26, 0.8)';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(90, 50, 140, 180);
  c.quadraticCurveTo(160, 240, 220, 260);
  c.stroke();

  drawLeaf(50, 30, 0.6, 26, leafColor1);
  drawLeaf(95, 70, 1.1, 30, leafColor2);
  drawLeaf(135, 160, 1.3, 28, leafColor1);
  drawLeaf(180, 230, 0.8, 24, leafColor2);

  drawBlossom(140, 180, 20, 5, -t * 0.2, petalPink, centerGold);
  drawBlossom(220, 260, 15, 5, 0.5, petalCream, centerGold);
  c.restore();

  c.restore();
};
