import { GraphicContext } from '../types';

export const renderTree = (ctx: GraphicContext) => {
  const { c, W, H, t, isLandscape } = ctx;
  c.save();

  // Corner Tree: bottom-right or bottom-left corner
  // Planted at bottom corner
  const treeBaseX = isLandscape ? W - 140 : W - 110;
  const treeBaseY = H;
  const treeScale = isLandscape ? 0.9 : 1.1;

  c.translate(treeBaseX, treeBaseY);
  c.scale(treeScale, treeScale);

  // Subtle wind sway
  const wind = Math.sin(t * 1.5) * 0.03;

  // Trunk & Limbs in rich sumi-e charcoal ink
  c.fillStyle = 'rgba(38, 28, 20, 0.92)';
  c.strokeStyle = 'rgba(38, 28, 20, 0.92)';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Base Roots
  c.beginPath();
  c.moveTo(50, 0);
  c.quadraticCurveTo(0, -25, -20, -70);
  c.quadraticCurveTo(-35, -130, -50, -200);
  c.lineTo(-30, -200);
  c.quadraticCurveTo(-15, -120, 15, -60);
  c.quadraticCurveTo(35, -20, 80, 0);
  c.closePath();
  c.fill();

  // Main Trunk curvature with wind sway
  c.save();
  c.translate(-40, -200);
  c.rotate(wind);

  c.lineWidth = 18;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-20, -80, -60, -140);
  c.stroke();

  // Primary Branch Left
  c.lineWidth = 11;
  c.beginPath();
  c.moveTo(-35, -70);
  c.quadraticCurveTo(-90, -100, -150, -110);
  c.stroke();

  // Sub-branch Left
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(-110, -95);
  c.quadraticCurveTo(-150, -60, -190, -75);
  c.stroke();

  // Primary Branch Right (spreading across)
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(-50, -120);
  c.quadraticCurveTo(0, -170, 40, -190);
  c.stroke();

  // Top Leader Branch
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(-60, -140);
  c.quadraticCurveTo(-75, -200, -60, -260);
  c.stroke();

  // Foliage Cloud Clusters (Pine / Bonsai foliage pads)
  const drawFoliageCluster = (x: number, y: number, r: number, tint: string) => {
    c.save();
    c.translate(x, y);
    c.fillStyle = tint;
    c.beginPath();
    // Overlapping organic cloud ellipses
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.arc(-r * 0.45, r * 0.15, r * 0.75, 0, Math.PI * 2);
    c.arc(r * 0.45, r * 0.15, r * 0.75, 0, Math.PI * 2);
    c.arc(0, -r * 0.35, r * 0.65, 0, Math.PI * 2);
    c.fill();

    // Subtle edge highlight
    c.fillStyle = 'rgba(100, 130, 85, 0.35)';
    c.beginPath();
    c.arc(0, -r * 0.2, r * 0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  const cDeep = 'rgba(42, 56, 36, 0.88)';
  const cMid = 'rgba(60, 80, 52, 0.85)';
  const cWarm = 'rgba(84, 108, 72, 0.82)';

  // Cluster positions on branches
  drawFoliageCluster(-190, -80, 36, cDeep);
  drawFoliageCluster(-150, -115, 42, cMid);
  drawFoliageCluster(-100, -145, 46, cWarm);
  drawFoliageCluster(-60, -265, 40, cDeep);
  drawFoliageCluster(-20, -220, 38, cMid);
  drawFoliageCluster(40, -195, 34, cWarm);
  drawFoliageCluster(-70, -180, 48, cMid);

  c.restore(); // end trunk sway

  c.restore();
};
