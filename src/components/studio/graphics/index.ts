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

export * from './types';

export const GRAPHIC_OPTIONS: GraphicItem[] = [
  // ── Botanical & Nature Motifs ─────────────────────────────────────────────
  {
    id: 'floral',
    index: '№ 01',
    label: 'Corner Floral',
    sublabel: 'Flora Japonica',
    category: 'nature',
    desc: 'Blooming branch & delicate corner vine',
  },
  {
    id: 'tree',
    index: '№ 02',
    label: 'Bonsai Silhouette',
    sublabel: 'Pinus Silvestris',
    category: 'nature',
    desc: 'Sumi-e ink tree with gentle breeze',
  },
  {
    id: 'petals',
    index: '№ 03',
    label: 'Falling Petals',
    sublabel: 'Sakura Decidua',
    category: 'nature',
    desc: 'Soft petals drifting & tumbling down',
  },
  {
    id: 'botanicalFern',
    index: '№ 04',
    label: 'Herbarium Fern',
    sublabel: 'Pteridophyta',
    category: 'nature',
    desc: 'Vintage arching pinnate fronds',
  },
  {
    id: 'butterfly',
    index: '№ 05',
    label: 'Vintage Butterfly',
    sublabel: 'Papilio Flutter',
    category: 'nature',
    desc: 'Delicate line-art fluttering wings',
  },

  // ── Cinematic & Acoustic Accents ──────────────────────────────────────────
  {
    id: 'corners',
    index: '№ 06',
    label: 'Viewfinder Crop',
    sublabel: 'Optical Marks',
    category: 'cinematic',
    desc: 'Cinematic crop ticks & crosshairs',
  },
  {
    id: 'waveform',
    index: '№ 07',
    label: 'Acoustic EQ',
    sublabel: 'Frequens Pulses',
    category: 'audio',
    desc: 'Rhythmic audio frequency bar pulses',
  },
  {
    id: 'particles',
    index: '№ 08',
    label: 'Warm Dust',
    sublabel: 'Pulvis Ambient',
    category: 'cinematic',
    desc: 'Floating textured paper dust embers',
  },
  {
    id: 'stars',
    index: '№ 09',
    label: 'Geometric Stars',
    sublabel: 'Astra Polaris',
    category: 'cinematic',
    desc: 'Minimal 4-point star pulses & accents',
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
};
