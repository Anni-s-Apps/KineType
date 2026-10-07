import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Tv,
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { renderFrame, AssetMap } from '../../render/renderer';

interface CanvasPlayerProps {
  recipe: Recipe;
  assets: AssetMap;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  previewQuality: number;
  onChangeQuality: (q: number) => void;
  showSafeAreas: boolean;
  audioUrl: string | null;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  recipe,
  assets,
  currentTime,
  isPlaying,
  onTogglePlay,
  previewQuality,
  showSafeAreas,
  audioUrl,
  audioElementRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  const fps = recipe.settings?.fps || 30;
  const isPortrait = recipe.settings?.aspect === '9:16';
  const baseW = isPortrait ? 1080 : 1920;
  const baseH = isPortrait ? 1920 : 1080;
  const targetAspect = isPortrait ? 9 / 16 : 16 / 9;

  // Responsive scale calculation to fit viewport perfectly
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availW = rect.width - 56;
      const availH = rect.height - 64;

      if (availW > 0 && availH > 0) {
        const scaleW = availW / baseW;
        const scaleH = availH / baseH;
        const fitScale = Math.max(0.15, Math.min(scaleW, scaleH, 0.9));
        setScale(fitScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [baseW, baseH, targetAspect]);

  // Render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderW = Math.round(baseW * previewQuality);
    const renderH = Math.round(baseH * previewQuality);

    if (canvas.width !== renderW || canvas.height !== renderH) {
      canvas.width = renderW;
      canvas.height = renderH;
    }

    renderFrame(ctx, recipe, assets, currentTime, {
      width: renderW,
      height: renderH,
      showSafeAreas,
      quality: previewQuality,
    });
  }, [recipe, assets, currentTime, previewQuality, showSafeAreas, isPortrait, baseW, baseH]);

  const displayW = Math.round(baseW * scale);
  const displayH = Math.round(baseH * scale);

  // Active text preview for subtitle overlay badge
  const activeTextLayer = recipe.layers?.find(
    (l) => l.type === 'text' && !l.hidden && currentTime >= l.start && currentTime <= l.end
  ) as any;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center overflow-hidden relative select-none bg-background p-4"
      style={{
        backgroundImage:
          'radial-gradient(circle, color-mix(in srgb, var(--foreground) 12%, transparent) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Hidden Audio element */}
      {audioUrl && (
        <audio ref={audioElementRef as any} src={audioUrl} preload="auto" />
      )}

      <div className="flex flex-col items-center gap-1.5 transition-all duration-100">
        {/* Top Canvas Info Bar */}
        <div
          className="flex items-center justify-between px-1 text-[11px] font-mono text-muted-foreground select-none"
          style={{ width: displayW }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold uppercase tracking-wider text-foreground text-[10px]">
              {isPlaying ? 'Playing' : 'Preview'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <span className="bg-card border border-border px-1.5 py-0.5 rounded text-foreground font-mono">
              {isPortrait ? '9:16 REEL' : '16:9 VIDEO'}
            </span>
            <span className="bg-card border border-border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
              {previewQuality === 1 ? '1080p' : `${previewQuality * 100}%`}
            </span>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl border border-border/80 group cursor-pointer transition-all duration-100 bg-black flex items-center justify-center shrink-0"
          style={{ width: displayW, height: displayH }}
          onClick={onTogglePlay}
          title={isPlaying ? 'Click to Pause (Space)' : 'Click to Play (Space)'}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {/* Hover Play/Pause Overlay Icon */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-background/90 text-foreground border border-border flex items-center justify-center shadow-lg backdrop-blur-xs">
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </div>
          </div>

          {/* Active text subtitle badge at bottom of canvas */}
          {activeTextLayer && (
            <div className="absolute bottom-3 left-4 right-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-center pointer-events-none animate-in fade-in duration-150">
              <p className="text-xs font-medium text-white/95 truncate">
                {activeTextLayer.text.replace(/\n/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Canvas resolution indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 font-mono select-none pointer-events-none">
        {isPortrait ? '1080 × 1920 (9:16 Vertical Reel)' : '1920 × 1080 (16:9 Full HD)'} · {fps} FPS
      </div>
    </div>
  );
};
