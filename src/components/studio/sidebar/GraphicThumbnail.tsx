import React, { useRef, useEffect } from 'react';
import { renderFloral } from '../graphics/items/floral';
import { renderTree } from '../graphics/items/tree';
import { renderPetals } from '../graphics/items/petals';
import { renderBotanicalFern } from '../graphics/items/botanicalFern';
import { renderButterfly } from '../graphics/items/butterfly';
import { renderCorners } from '../graphics/items/corners';
import { renderWaveform } from '../graphics/items/waveform';
import { renderParticles } from '../graphics/items/particles';
import { renderStars } from '../graphics/items/stars';
import { renderVinyl } from '../graphics/items/vinyl';
import { renderNowPlaying } from '../graphics/items/nowPlaying';
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

    // Render scale for crisp mini preview
    const W = 100;
    const H = 100;
    canvas.width = W;
    canvas.height = H;

    // Background paper
    ctx.fillStyle = '#f5eedc';
    ctx.fillRect(0, 0, W, H);

    // Subtle paper grain / border
    ctx.strokeStyle = 'rgba(26,18,9,0.08)';
    ctx.strokeRect(0, 0, W, H);

    const gCtx = {
      c: ctx,
      W,
      H,
      t: 1.5,
      isLandscape: false,
      songTitle: 'Song',
      C,
      isPlaying: false,
    };

    switch (id) {
      case 'floral':
        renderFloral(gCtx);
        break;
      case 'tree':
        renderTree(gCtx);
        break;
      case 'petals':
        renderPetals(gCtx);
        break;
      case 'botanicalFern':
        renderBotanicalFern(gCtx);
        break;
      case 'butterfly':
        renderButterfly(gCtx);
        break;
      case 'corners':
        renderCorners(gCtx);
        break;
      case 'waveform':
        renderWaveform(gCtx);
        break;
      case 'particles':
        renderParticles(gCtx);
        break;
      case 'stars':
        renderStars(gCtx);
        break;
      case 'vinyl':
        renderVinyl(gCtx);
        break;
      case 'nowPlaying':
        renderNowPlaying(gCtx);
        break;
      default:
        break;
    }
  }, [id]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none object-cover"
      style={{ display: 'block' }}
    />
  );
};
