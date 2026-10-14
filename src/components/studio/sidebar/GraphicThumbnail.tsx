import React, { useRef, useEffect } from 'react';
import { renderFloral } from '../graphics/items/floral';
import { renderTree } from '../graphics/items/tree';
import { renderPetals } from '../graphics/items/petals';
import { renderBotanicalFern } from '../graphics/items/botanicalFern';
import { drawButterflyAt } from '../graphics/items/butterfly';
import { C } from '../styles/types';

interface Props {
  id: string;
}

export const GraphicThumbnail: React.FC<Props> = ({ id }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sharp canvas resolution
    const size = 180;
    canvas.width = size;
    canvas.height = size;

    // Softer warm sandy linen paper background
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, size, size);

    ctx.save();

    if (id === 'floral') {
      // Scale and offset so blooming flower and vine branches fit nicely in frame
      ctx.translate(-15, -15);
      const scale = size / 340;
      ctx.scale(scale, scale);
      renderFloral({
        c: ctx,
        W: 340,
        H: 340,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'tree') {
      // Tree silhouette auto-fit: place trunk base near bottom center
      // In renderTree: treeBaseX = W - 110, treeBaseY = H.
      // Tree canopy extends ~250px up and 200px left.
      // So virtual space: W = 400, H = 360, treeBaseX = 260, treeBaseY = 350.
      ctx.translate(15, 10);
      const scale = size / 420;
      ctx.scale(scale, scale);
      renderTree({
        c: ctx,
        W: 390,
        H: 390,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'butterfly') {
      // Beautifully centered butterfly with wings spread
      drawButterflyAt(ctx, size * 0.5, size * 0.52, 1.2, 1.85);
    } else if (id === 'botanicalFern') {
      // Arching fern frond: scale to fit diagonally from bottom-left to top-right
      ctx.translate(10, size - 10);
      ctx.rotate(-Math.PI * 0.42);
      const scale = size / 480;
      ctx.scale(scale, scale);

      // Draw frond
      const frondLen = 420;
      const leafletPairs = 15;
      ctx.strokeStyle = 'rgba(50, 40, 30, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(frondLen * 0.5, 30, frondLen, 90);
      ctx.stroke();

      for (let i = 2; i <= leafletPairs; i++) {
        const frac = i / leafletPairs;
        const inv = 1 - frac;
        const px = inv * inv * 0 + 2 * inv * frac * (frondLen * 0.5) + frac * frac * frondLen;
        const py = inv * inv * 0 + 2 * inv * frac * 30 + frac * frac * 90;
        const tx = 2 * inv * (frondLen * 0.5) + 2 * frac * (frondLen - frondLen * 0.5);
        const ty = 2 * inv * 30 + 2 * frac * (90 - 30);
        const baseAngle = Math.atan2(ty, tx);

        const leafSize = Math.sin(frac * Math.PI) * 44;
        const tint = i % 2 === 0 ? 'rgba(64, 82, 54, 0.88)' : 'rgba(80, 102, 68, 0.84)';

        // Leaflet Pair
        [-1.15, 1.15].forEach(angOffset => {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(baseAngle + angOffset);
          ctx.fillStyle = tint;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(leafSize * 0.5, -leafSize * 0.35, leafSize * 0.8, -leafSize * 0.15, leafSize, 0);
          ctx.bezierCurveTo(leafSize * 0.8, leafSize * 0.15, leafSize * 0.5, leafSize * 0.35, 0, 0);
          ctx.fill();
          ctx.restore();
        });
      }
    } else if (id === 'petals') {
      // 9 delicate flower petals tumbling gracefully in the box
      const petals = [
        { x: 0.28, y: 0.22, rot: 0.6, s: 15, c: 'rgba(214, 115, 96, 0.9)' },
        { x: 0.68, y: 0.28, rot: -0.8, s: 18, c: 'rgba(235, 150, 135, 0.85)' },
        { x: 0.48, y: 0.52, rot: 0.2, s: 20, c: 'rgba(201, 79, 0, 0.85)' },
        { x: 0.22, y: 0.72, rot: -0.4, s: 16, c: 'rgba(240, 180, 170, 0.9)' },
        { x: 0.76, y: 0.76, rot: 0.9, s: 14, c: 'rgba(214, 115, 96, 0.85)' },
        { x: 0.82, y: 0.45, rot: 1.2, s: 13, c: 'rgba(235, 150, 135, 0.8)' },
        { x: 0.35, y: 0.88, rot: -0.7, s: 12, c: 'rgba(201, 79, 0, 0.8)' },
      ];

      petals.forEach(p => {
        ctx.save();
        ctx.translate(p.x * size, p.y * size);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.75, -p.s * 0.6, p.s * 0.75, p.s * 0.5, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.75, p.s * 0.5, -p.s * 0.75, -p.s * 0.6, 0, -p.s);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.s * 0.7);
        ctx.lineTo(0, p.s * 0.7);
        ctx.stroke();
        ctx.restore();
      });
    } else if (id === 'corners') {
      // Cinematic viewfinder crop marks framing thumbnail
      ctx.strokeStyle = 'rgba(26,18,9,0.55)';
      ctx.lineWidth = 2.2;
      const pad = 18;
      const len = 24;

      // 4 Corners
      ctx.beginPath();
      ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
      ctx.moveTo(size - pad - len, pad); ctx.lineTo(size - pad, pad); ctx.lineTo(size - pad, pad + len);
      ctx.moveTo(pad, size - pad - len); ctx.lineTo(pad, size - pad); ctx.lineTo(pad + len, size - pad);
      ctx.moveTo(size - pad - len, size - pad); ctx.lineTo(size - pad, size - pad); ctx.lineTo(size - pad, size - pad - len);
      ctx.stroke();

      // Center crosshair
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(26,18,9,0.35)';
      const mid = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(mid - 7, mid); ctx.lineTo(mid + 7, mid);
      ctx.moveTo(mid, mid - 7); ctx.lineTo(mid, mid + 7);
      ctx.stroke();
    } else if (id === 'waveform') {
      // Pulsing audio frequency bars in center
      const barCount = 14;
      const barW = 5;
      const gap = 5;
      const totalW = barCount * (barW + gap) - gap;
      const startX = (size - totalW) * 0.5;
      const midY = size * 0.5;

      const heights = [14, 24, 38, 52, 68, 56, 42, 60, 72, 48, 36, 28, 20, 12];
      for (let i = 0; i < barCount; i++) {
        const h = heights[i % heights.length];
        ctx.fillStyle = i % 3 === 1 ? '#d95d39' : 'rgba(28,21,13,0.6)';
        ctx.beginPath();
        ctx.roundRect(startX + i * (barW + gap), midY - h * 0.5, barW, h, 2);
        ctx.fill();
      }
    } else if (id === 'particles') {
      // Warm floating dust and amber embers
      for (let i = 0; i < 22; i++) {
        const px = ((i * 37.1) % (size - 24)) + 12;
        const py = ((i * 73.3) % (size - 24)) + 12;
        const r = 2 + (i % 4) * 1.5;
        ctx.fillStyle = i % 4 === 0 ? 'rgba(217,93,57,0.75)' : 'rgba(28,21,13,0.35)';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === 'stars') {
      // Aesthetic geometric stars
      ctx.font = '36px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#d95d39';
      ctx.fillText('✦', size * 0.5, size * 0.48);

      ctx.font = '20px "Cormorant Garamond", serif';
      ctx.fillStyle = 'rgba(28,21,13,0.55)';
      ctx.fillText('✧', size * 0.22, size * 0.24);
      ctx.fillText('✳', size * 0.78, size * 0.26);
      ctx.fillText('✦', size * 0.24, size * 0.76);
      ctx.fillText('✧', size * 0.76, size * 0.74);
    }

    ctx.restore();
  }, [id]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};
