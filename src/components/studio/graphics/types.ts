import { Palette } from '../styles/types';

export interface GraphicContext {
  c: CanvasRenderingContext2D;
  W: number;
  H: number;
  t: number;
  isLandscape: boolean;
  songTitle: string;
  C: Palette;
  isPlaying: boolean;
}

export interface GraphicItem {
  id: string;
  label: string;
  category: 'nature' | 'cinematic' | 'audio' | 'retro';
  icon: string;
  desc: string;
  previewBg: string;
}
