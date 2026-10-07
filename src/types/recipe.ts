export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface RecipeSettings {
  aspect: AspectRatio;
  fps: number;
  duration: number;
  title?: string;
}

export interface RecipeScene {
  bg: string;
  bgGradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  accent?: string;
  vignette?: number;
  grid?: boolean;
}

export interface RecipeAsset {
  id: string;
  file?: string;
  aspect?: string;
  transparent?: boolean;
  prompt: string;
  url?: string;
  dataUrl?: string;
}

export interface CameraKeyframe {
  start: number;
  end: number;
  x: number;
  y: number;
  zoom: number;
  ease?: 'linear' | 'easeOut' | 'easeInOut' | 'hold';
}

export interface GrowAnimation {
  prop: 'w' | 'h' | 'size' | 'opacity' | 'scale' | 'x' | 'y';
  from: number;
  to: number;
  t0: number;
  t1: number;
  ease?: string;
  pinLeft?: boolean;
  pinTop?: boolean;
}

export type AnimationPreset =
  | 'fadeUp'
  | 'fadeDown'
  | 'scaleIn'
  | 'popIn'
  | 'blurIn'
  | 'slideL'
  | 'slideR'
  | 'typeOn'
  | 'wordIn'
  | 'charFade'
  | 'zoomRotateIn'
  | 'bounceIn'
  | 'fadeOut'
  | 'scaleOut'
  | 'slideOutL'
  | 'slideOutR'
  | 'fadeDownOut'
  | 'none';

export type ShapeKind =
  | 'rect'
  | 'pill'
  | 'circle'
  | 'ring'
  | 'line'
  | 'arrow'
  | 'check'
  | 'cross'
  | 'card'
  | 'codeBlock';

export interface BaseLayer {
  id: string;
  start: number;
  end: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  opacity?: number;
  scale?: number;
  rotation?: number;
  in?: AnimationPreset;
  out?: AnimationPreset;
  inDuration?: number;
  outDuration?: number;
  z?: number;
  depth?: number; // 0 to 1 for camera parallax
  growTo?: GrowAnimation;
  hidden?: boolean;
  locked?: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  size?: number;
  weight?: number | string;
  color?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  shadow?: boolean | string;
  highlightWords?: string[];
  highlightColor?: string;
  badge?: boolean;
  badgeBg?: string;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  asset: string;
  anchor?: 'center' | 'bottom' | 'top';
  cornerRadius?: number;
  border?: {
    color: string;
    width: number;
  };
  shadow?: boolean | string;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  kind: ShapeKind;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  dashed?: boolean;
  arrowHeadSize?: number;
  icon?: string;
}

export interface CardLayer extends BaseLayer {
  type: 'card';
  title?: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  bg?: string;
  border?: string;
  textColor?: string;
  accentColor?: string;
  code?: string;
  codeLang?: string;
}

export type RecipeLayer = TextLayer | ImageLayer | ShapeLayer | CardLayer;

export interface Recipe {
  version: 1;
  settings: RecipeSettings;
  scene: RecipeScene;
  assets?: RecipeAsset[];
  camera?: CameraKeyframe[];
  layers: RecipeLayer[];
}

export interface ValidationError {
  layerId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
