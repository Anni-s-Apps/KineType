export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  hold: (_t: number) => 1,
};

export function getEasing(name?: string): EasingFunction {
  if (!name) return Easing.easeOutCubic;
  switch (name) {
    case 'linear':
      return Easing.linear;
    case 'easeOut':
    case 'easeOutQuad':
      return Easing.easeOutQuad;
    case 'easeOutCubic':
      return Easing.easeOutCubic;
    case 'easeInOut':
    case 'easeInOutCubic':
      return Easing.easeInOutCubic;
    case 'elastic':
    case 'elasticOut':
      return Easing.easeOutElastic;
    case 'back':
    case 'backOut':
      return Easing.easeOutBack;
    case 'hold':
      return Easing.hold;
    default:
      return Easing.easeOutCubic;
  }
}
