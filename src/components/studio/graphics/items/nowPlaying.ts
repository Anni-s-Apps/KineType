import { GraphicContext } from '../types';

export const renderNowPlaying = (ctx: GraphicContext) => {
  const { c, songTitle, t, isLandscape, C } = ctx;
  c.save();
  const cardX = isLandscape ? 60 : 54;
  const cardY = isLandscape ? 55 : 65;
  const cardW = isLandscape ? 280 : 250;
  const cardH = 46;

  // Card background
  c.fillStyle = 'rgba(237,228,204,0.85)';
  c.strokeStyle = 'rgba(26,18,9,0.18)';
  c.lineWidth = 1.2;
  c.beginPath();
  const r = 12;
  c.moveTo(cardX + r, cardY);
  c.lineTo(cardX + cardW - r, cardY);
  c.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
  c.lineTo(cardX + cardW, cardY + cardH - r);
  c.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
  c.lineTo(cardX + r, cardY + cardH);
  c.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
  c.lineTo(cardX, cardY + r);
  c.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
  c.closePath();
  c.fill();
  c.stroke();

  // Pulsing dot
  const dotPulse = Math.sin(t * 6) * 0.4 + 0.6;
  c.fillStyle = `rgba(201,79,0,${dotPulse})`;
  c.beginPath();
  c.arc(cardX + 18, cardY + cardH * 0.5, 4, 0, Math.PI * 2);
  c.fill();

  // Text inside card
  c.font = '700 12px "IBM Plex Mono", monospace';
  c.fillStyle = C.signal;
  c.fillText('NOW PLAYING', cardX + 30, cardY + 20);

  c.font = '500 13px "Archivo", sans-serif';
  c.fillStyle = C.ink;
  const shortTitle = songTitle.length > 18 ? songTitle.slice(0, 18) + '...' : songTitle;
  c.fillText(shortTitle, cardX + 30, cardY + 36);

  c.restore();
};
