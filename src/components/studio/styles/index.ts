import { MotionStyleDefinition, StyleRenderContext } from './types';
import { renderAskew } from './askew';
import { renderHook } from './hook';
import { renderVerdict } from './verdict';
import { renderMask } from './mask';
import { renderPress } from './press';
import { renderMono } from './mono';
import { renderSerif } from './serif';

export * from './types';
export { renderAskew } from './askew';
export { renderHook } from './hook';
export { renderVerdict } from './verdict';
export { renderMask } from './mask';
export { renderPress } from './press';
export { renderMono } from './mono';
export { renderSerif } from './serif';

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
    id: 'press',
    label: 'Press',
    desc: 'Industrial clamp jaws with physical squish',
    render: renderPress,
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
  const fn = styleMap.get(id) || renderAskew;
  fn(ctx);
};
