import { AnimationPreset } from '../types/recipe';
import { getEasing } from './easing';

export interface TransformState {
  offsetX: number;
  offsetY: number;
  scale: number;
  opacity: number;
  rotation: number;
  blur?: number;
  progress: number;
}

export function computeEntranceTransform(
  preset: AnimationPreset | undefined,
  progress: number // 0 to 1
): TransformState {
  const p = Math.max(0, Math.min(1, progress));
  const easeOut = getEasing('easeOutCubic')(p);
  const easeBack = getEasing('backOut')(p);
  const easeElastic = getEasing('elasticOut')(p);

  switch (preset) {
    case 'fadeUp':
      return {
        offsetX: 0,
        offsetY: (1 - easeOut) * 50,
        scale: 1,
        opacity: easeOut,
        rotation: 0,
        progress: p,
      };

    case 'fadeDown':
      return {
        offsetX: 0,
        offsetY: -(1 - easeOut) * 50,
        scale: 1,
        opacity: easeOut,
        rotation: 0,
        progress: p,
      };

    case 'scaleIn':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 0.6 + 0.4 * easeOut,
        opacity: easeOut,
        rotation: 0,
        progress: p,
      };

    case 'popIn':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 0.3 + 0.7 * easeBack,
        opacity: Math.min(1, p * 2.5),
        rotation: 0,
        progress: p,
      };

    case 'bounceIn':
      return {
        offsetX: 0,
        offsetY: (1 - easeElastic) * 60,
        scale: 0.4 + 0.6 * easeElastic,
        opacity: Math.min(1, p * 3),
        rotation: 0,
        progress: p,
      };

    case 'blurIn':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 0.95 + 0.05 * easeOut,
        opacity: easeOut,
        rotation: 0,
        blur: (1 - easeOut) * 16,
        progress: p,
      };

    case 'slideL':
      return {
        offsetX: -(1 - easeOut) * 120,
        offsetY: 0,
        scale: 1,
        opacity: easeOut,
        rotation: 0,
        progress: p,
      };

    case 'slideR':
      return {
        offsetX: (1 - easeOut) * 120,
        offsetY: 0,
        scale: 1,
        opacity: easeOut,
        rotation: 0,
        progress: p,
      };

    case 'zoomRotateIn':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 0.4 + 0.6 * easeBack,
        opacity: easeOut,
        rotation: (1 - easeOut) * -12,
        progress: p,
      };

    case 'typeOn':
    case 'wordIn':
    case 'charFade':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        opacity: 1,
        rotation: 0,
        progress: p,
      };

    default:
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        opacity: 1,
        rotation: 0,
        progress: p,
      };
  }
}

export function computeExitTransform(
  preset: AnimationPreset | undefined,
  progress: number // 0 (start exit) to 1 (fully exited)
): TransformState {
  const p = Math.max(0, Math.min(1, progress));
  const easeIn = p * p;

  switch (preset) {
    case 'fadeOut':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };

    case 'scaleOut':
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1 - 0.2 * easeIn,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };

    case 'fadeDownOut':
      return {
        offsetX: 0,
        offsetY: easeIn * 40,
        scale: 1,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };

    case 'slideOutL':
      return {
        offsetX: -easeIn * 120,
        offsetY: 0,
        scale: 1,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };

    case 'slideOutR':
      return {
        offsetX: easeIn * 120,
        offsetY: 0,
        scale: 1,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };

    default:
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        opacity: 1 - easeIn,
        rotation: 0,
        progress: 1 - p,
      };
  }
}
