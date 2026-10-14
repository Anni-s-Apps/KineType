import { MotionStyleDefinition, StyleRenderContext } from './types';
import { renderVerdict } from './verdict';
import { renderMask } from './mask';
import { renderSpiral } from './spiral';
import { renderSpiral2 } from './spiral2';
import { renderAskew } from './askew';
import { renderHook } from './hook';
import { renderMono } from './mono';
import { renderSerif } from './serif';
import { renderGlitch } from './glitch';
import { renderFloat } from './float';
import { renderComic } from './comic';
import { renderSplit } from './split';
import { renderWave } from './wave';
import { renderNeon } from './neon';
import { renderStamp } from './stamp';
import { renderCascade } from './cascade';
import { renderElastic } from './elastic';
import { renderSpecimen } from './specimen';

export * from './types';
export { renderVerdict } from './verdict';
export { renderMask } from './mask';
export { renderSpiral } from './spiral';
export { renderSpiral2 } from './spiral2';
export { renderAskew } from './askew';
export { renderHook } from './hook';
export { renderMono } from './mono';
export { renderSerif } from './serif';
export { renderGlitch } from './glitch';
export { renderFloat } from './float';
export { renderComic } from './comic';
export { renderSplit } from './split';
export { renderWave } from './wave';
export { renderNeon } from './neon';
export { renderStamp } from './stamp';
export { renderCascade } from './cascade';
export { renderElastic } from './elastic';
export { renderSpecimen } from './specimen';

export const MOTION_STYLES: MotionStyleDefinition[] = [
  {
    id: 'verdict',
    label: 'Verdict',
    desc: 'Editorial spring slam with live baseline rule',
    render: renderVerdict,
  },
  {
    id: 'mask',
    label: 'Mask',
    desc: 'Editorial redaction wipe with glowing scanline',
    render: renderMask,
  },
  {
    id: 'spiral',
    label: 'Spiral',
    desc: 'Continuous multi-ring full canvas orbital flow',
    render: renderSpiral,
  },
  {
    id: 'spiral2',
    label: 'Spiral 2',
    desc: '3D perspective tilted vortex with inward suction',
    render: renderSpiral2,
  },
  {
    id: 'glitch',
    label: 'Glitch',
    desc: 'Cybernetic shutter & chromatic RGB split impact',
    render: renderGlitch,
  },
  {
    id: 'float',
    label: 'Float',
    desc: 'Zero-gravity Lissajous floating harmonic drift',
    render: renderFloat,
  },
  {
    id: 'comic',
    label: 'Comic',
    desc: 'Pop-art action speed rays with chunky outlines',
    render: renderComic,
  },
  {
    id: 'split',
    label: 'Split',
    desc: 'Opposing Venetian horizontal blinds with snap seam',
    render: renderSplit,
  },
  {
    id: 'wave',
    label: 'Wave',
    desc: 'Harmonic sine-wave ribbon with tangent flow',
    render: renderWave,
  },
  {
    id: 'neon',
    label: 'Neon',
    desc: 'Multi-pass gas discharge tube with ignition flicker',
    render: renderNeon,
  },
  {
    id: 'stamp',
    label: 'Stamp',
    desc: 'Letterpress paper deboss & hot wax seal impact',
    render: renderStamp,
  },
  {
    id: 'cascade',
    label: 'Cascade',
    desc: 'Gravity tumbling waterfall with ground bounce',
    render: renderCascade,
  },
  {
    id: 'elastic',
    label: 'Elastic',
    desc: 'Rubberband kinetic stretch with jelly snapback',
    render: renderElastic,
  },
  {
    id: 'specimen',
    label: 'Specimen',
    desc: 'Swiss modernist architectural grid & crosshair marks',
    render: renderSpecimen,
  },
  {
    id: 'askew',
    label: 'Askew',
    desc: 'Dynamic poster angles with spring sticker pop',
    render: renderAskew,
  },
  {
    id: 'hook',
    label: 'Hook',
    desc: 'Focal scale-slam with kinetic echo outlines',
    render: renderHook,
  },
  {
    id: 'mono',
    label: 'Mono',
    desc: 'Tactile typewriter terminal with live cursor',
    render: renderMono,
  },
  {
    id: 'serif',
    label: 'Serif',
    desc: 'Luxury Cormorant Garamond with diamond accent',
    render: renderSerif,
  },
];

const styleMap = new Map<string, (ctx: StyleRenderContext) => void>();
MOTION_STYLES.forEach(s => styleMap.set(s.id, s.render));

export const renderMotionStyle = (id: string, ctx: StyleRenderContext) => {
  const fn = styleMap.get(id) || renderVerdict;
  fn(ctx);
};
