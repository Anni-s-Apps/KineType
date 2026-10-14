import { GraphicContext, GraphicItem } from './types';
import { renderFloral } from './items/floral';
import { renderTree } from './items/tree';
import { renderPetals } from './items/petals';
import { renderBotanicalFern } from './items/botanicalFern';
import { renderButterfly } from './items/butterfly';
import { renderCorners } from './items/corners';
import { renderWaveform } from './items/waveform';
import { renderParticles } from './items/particles';
import { renderStars } from './items/stars';
import { renderVinyl } from './items/vinyl';
import { renderNowPlaying } from './items/nowPlaying';

export * from './types';

export const GRAPHIC_OPTIONS: GraphicItem[] = [
  // 🌿 Nature & Botanical Decorations
  {
    id: 'floral',
    label: 'Corner Floral & Vine',
    category: 'nature',
    icon: '🌸',
    desc: 'Blooming flowers & delicate stems on corners',
    previewBg: 'rgba(214,115,96,0.15)',
  },
  {
    id: 'tree',
    label: 'Aesthetic Bonsai / Tree',
    category: 'nature',
    icon: '🌳',
    desc: 'Sumi-e ink tree silhouette with gentle breeze',
    previewBg: 'rgba(60,80,52,0.15)',
  },
  {
    id: 'petals',
    label: 'Falling Floral Petals',
    category: 'nature',
    icon: '🍃',
    desc: 'Soft rose & sakura petals tumbling down',
    previewBg: 'rgba(201,79,0,0.15)',
  },
  {
    id: 'botanicalFern',
    label: 'Vintage Botanical Fern',
    category: 'nature',
    icon: '🌿',
    desc: 'Arching herbarium fern fronds on border',
    previewBg: 'rgba(74,94,62,0.15)',
  },
  {
    id: 'butterfly',
    label: 'Fluttering Butterfly',
    category: 'nature',
    icon: '🦋',
    desc: 'Delicate line-art butterfly flapping wings',
    previewBg: 'rgba(235,160,140,0.15)',
  },

  // 🎬 Cinematic & Design Accents
  {
    id: 'corners',
    label: 'Viewfinder Corners',
    category: 'cinematic',
    icon: '◰',
    desc: 'Cinematic crop marks & crosshairs',
    previewBg: 'rgba(26,18,9,0.08)',
  },
  {
    id: 'waveform',
    label: 'Live Audio Waveform',
    category: 'audio',
    icon: 'ılı',
    desc: 'Dynamic frequency bars bouncing to rhythm',
    previewBg: 'rgba(201,79,0,0.12)',
  },
  {
    id: 'particles',
    label: 'Floating Dust & Embers',
    category: 'cinematic',
    icon: '✧',
    desc: 'Organic warm particles drifting upwards',
    previewBg: 'rgba(26,18,9,0.08)',
  },
  {
    id: 'stars',
    label: 'Aesthetic Stars',
    category: 'cinematic',
    icon: '✦',
    desc: 'Geometric 4-point star pulses and accents',
    previewBg: 'rgba(201,79,0,0.1)',
  },
  {
    id: 'vinyl',
    label: 'Retro Vinyl Disk',
    category: 'retro',
    icon: '◎',
    desc: 'Spinning vinyl record in top corner',
    previewBg: 'rgba(26,18,9,0.12)',
  },
  {
    id: 'nowPlaying',
    label: 'Now Playing Badge',
    category: 'retro',
    icon: '♫',
    desc: 'Minimal floating song card with pulsing indicator',
    previewBg: 'rgba(237,228,204,0.3)',
  },
];

export const renderGraphicsOverlay = (
  activeGraphics: string[],
  ctx: GraphicContext
) => {
  if (activeGraphics.includes('tree')) renderTree(ctx);
  if (activeGraphics.includes('botanicalFern')) renderBotanicalFern(ctx);
  if (activeGraphics.includes('floral')) renderFloral(ctx);
  if (activeGraphics.includes('petals')) renderPetals(ctx);
  if (activeGraphics.includes('butterfly')) renderButterfly(ctx);
  if (activeGraphics.includes('particles')) renderParticles(ctx);
  if (activeGraphics.includes('stars')) renderStars(ctx);
  if (activeGraphics.includes('waveform')) renderWaveform(ctx);
  if (activeGraphics.includes('corners')) renderCorners(ctx);
  if (activeGraphics.includes('vinyl')) renderVinyl(ctx);
  if (activeGraphics.includes('nowPlaying')) renderNowPlaying(ctx);
};
