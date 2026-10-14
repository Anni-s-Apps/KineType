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

    // Retina-sharp thumbnail resolution
    const size = 160;
    canvas.width = size;
    canvas.height = size;

    // Soft sandy background
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, size, size);

    // Auto-fit rendering per graphic
    ctx.save();

    if (id === 'floral') {
      // Scale down 400x400 virtual space to 160x160 so the whole branch & flower fit
      const scale = size / 420;
      ctx.scale(scale, scale);
      renderFloral({
        c: ctx,
        W: 420,
        H: 420,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'tree') {
      // Tree is planted at bottom corner, scale 500x500 to 160x160 so full bonsai fits
      const scale = size / 520;
      ctx.scale(scale, scale);
      renderTree({
        c: ctx,
        W: 520,
        H: 520,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'petals') {
      const scale = size / 260;
      ctx.scale(scale, scale);
      renderPetals({
        c: ctx,
        W: 260,
        H: 260,
        t: 2.2,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'botanicalFern') {
      // Fern frond length ~ 440, scale 480x480 to 160x160 so full arched fern fits
      const scale = size / 480;
      ctx.scale(scale, scale);
      renderBotanicalFern({
        c: ctx,
        W: 480,
        H: 480,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'butterfly') {
      // Center the butterfly right in the thumbnail
      ctx.translate(size * 0.5, size * 0.5);
      ctx.scale(1.3, 1.3);
      // Draw centered butterfly
      const bCtx = {
        c: ctx,
        W: 0,
        H: 0,
        t: 1.2,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      };
      // renderButterfly uses baseX, baseY. We offset so it's centered:
      ctx.translate(- (bCtx.isLandscape ? 0 : 0), 0);
      renderButterfly({
        ...bCtx,
        W: size * 0.5 / 0.28,
        H: size * 0.5 / 0.20,
      });
    } else if (id === 'corners') {
      renderCorners({
        c: ctx,
        W: size,
        H: size,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'waveform') {
      const scale = size / 260;
      ctx.scale(scale, scale);
      renderWaveform({
        c: ctx,
        W: 260,
        H: 260,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'particles') {
      renderParticles({
        c: ctx,
        W: size,
        H: size,
        t: 3.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
    } else if (id === 'stars') {
      renderStars({
        c: ctx,
        W: size,
        H: size,
        t: 1.5,
        isLandscape: false,
        songTitle: '',
        C,
        isPlaying: false,
      });
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
