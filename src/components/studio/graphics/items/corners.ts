import { GraphicContext } from '../types';

export const renderCorners = (ctx: GraphicContext) => {
  const { c, W, H, isLandscape } = ctx;
  c.save();
  c.strokeStyle = 'rgba(26,18,9,0.32)';
  c.lineWidth = 2;
  const pad = isLandscape ? 40 : 48;
  const len = isLandscape ? 40 : 50;

  // Top-Left
  c.beginPath();
  c.moveTo(pad, pad + len);
  c.lineTo(pad, pad);
  c.lineTo(pad + len, pad);
  c.stroke();

  // Top-Right
  c.beginPath();
  c.moveTo(W - pad - len, pad);
  c.lineTo(W - pad, pad);
  c.lineTo(W - pad, pad + len);
  c.stroke();

  // Bottom-Left
  c.beginPath();
  c.moveTo(pad, H - pad - len);
  c.lineTo(pad, H - pad);
  c.lineTo(pad + len, H - pad);
  c.stroke();

  // Bottom-Right
  c.beginPath();
  c.moveTo(W - pad - len, H - pad);
  c.lineTo(W - pad, H - pad);
  c.lineTo(W - pad, H - pad - len);
  c.stroke();

  // Subtle edge crosshairs
  const chSize = 7;
  c.lineWidth = 1.2;
  c.strokeStyle = 'rgba(26,18,9,0.22)';
  c.beginPath();
  c.moveTo(W * 0.5 - chSize, pad);
  c.lineTo(W * 0.5 + chSize, pad);
  c.moveTo(W * 0.5, pad - chSize);
  c.lineTo(W * 0.5, pad + chSize);
  c.stroke();
  c.restore();
};
