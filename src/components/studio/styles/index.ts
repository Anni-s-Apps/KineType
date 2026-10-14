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
    id: 'askew',
    label: '⚡ Askew',
    desc: 'Tilting angles + spring pop badge',
    render: renderAskew,
  },
  {
    id: 'hook',
    label: '💥 Hook Slam',
    desc: 'Specimen guidelines + slam echoes',
    render: renderHook,
  },
  {
    id: 'verdict',
    label: '⚖️ Verdict',
    desc: 'Multi-row line slam + implosion',
    render: renderVerdict,
  },
  {
    id: 'mask',
    label: '▓ [MASK]',
    desc: 'Bone blocks wipe left→right',
    render: renderMask,
  },
  {
    id: 'press',
    label: '🗜 Press',
    desc: 'Words compress into slab',
    render: renderPress,
  },
  {
    id: 'mono',
    label: '> Mono',
    desc: 'Terminal cursor + line tag',
    render: renderMono,
  },
  {
    id: 'serif',
    label: '✦ Serif',
    desc: 'Cormorant float + star underline',
    render: renderSerif,
  },
];

const styleMap = new Map<string, (ctx: StyleRenderContext) => void>();
MOTION_STYLES.forEach(s => styleMap.set(s.id, s.render));

export const renderMotionStyle = (id: string, ctx: StyleRenderContext) => {
  const fn = styleMap.get(id) || renderAskew;
  fn(ctx);
};
