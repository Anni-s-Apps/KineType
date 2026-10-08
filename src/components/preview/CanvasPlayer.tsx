import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  MousePointer,
  Hand,
  Maximize2,
  Tv,
  Eye,
  Sliders,
} from 'lucide-react';
import { Recipe, RecipeLayer } from '../../types/recipe';
import { renderFrame, AssetMap, resolveSize } from '../../render/renderer';
import { TransformGizmo } from './TransformGizmo';

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
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
  onDuplicateLayer?: (layerId: string) => void;
  onRemoveLayer?: (layerId: string) => void;
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
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onRemoveLayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  const fps = recipe.settings?.fps || 30;
  const isPortrait = recipe.settings?.aspect === '9:16';
  const baseW = isPortrait ? 1080 : 1920;
  const baseH = isPortrait ? 1920 : 1080;
  const targetAspect = isPortrait ? 9 / 16 : 16 / 9;
  const shortSide = Math.min(baseW, baseH);

  // Responsive scale calculation to fit viewport perfectly
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availW = rect.width - 56;
      const availH = rect.height - 70;

      if (availW > 0 && availH > 0) {
        const scaleW = availW / baseW;
        const scaleH = availH / baseH;
        const fitScale = Math.max(0.15, Math.min(scaleW, scaleH, 0.95));
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

  // Find currently active selected layer at current time
  const visibleLayers = (recipe.layers || [])
    .filter((l) => !l.hidden && currentTime >= l.start && currentTime <= l.end)
    .sort((a, b) => (b.z || 0) - (a.z || 0)); // Topmost first for hit testing

  const selectedLayer = visibleLayers.find((l) => l.id === selectedLayerId);

  // Hit testing when clicking directly on the canvas surface
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    // If click was on a button, gizmo handle, or anything other than canvas/container, do not deselect
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.pointer-events-auto')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / displayW; // 0..1
    const clickY = (e.clientY - rect.top) / displayH; // 0..1

    // Check hit on visible layers from topmost down
    for (const l of visibleLayers) {
      const lx = l.x ?? 0.5;
      const ly = l.y ?? 0.5;

      let unscaledW = 160;
      let unscaledH = 100;
      if (l.type === 'text') {
        const fontSize = resolveSize((l as any).size || 52, shortSide, 48);
        const lines = ((l as any).text || '').split('\n');
        const maxLineLen = Math.max(1, ...lines.map((ln: string) => ln.length));
        unscaledW = maxLineLen * fontSize * 0.58 + 24;
        unscaledH = lines.length * fontSize * 1.3 + 16;
      } else if (l.type === 'image') {
        unscaledW = resolveSize((l as any).w || 320, shortSide, 280);
        unscaledH = resolveSize((l as any).h, shortSide, unscaledW * 1.2);
      } else if (l.type === 'shape') {
        unscaledW = resolveSize((l as any).w || 120, shortSide, 100);
        unscaledH = resolveSize((l as any).h || 60, shortSide, 50);
      } else if (l.type === 'card') {
        unscaledW = resolveSize((l as any).w || 400, shortSide, 360);
        unscaledH = resolveSize((l as any).h || 220, shortSide, 200);
      }

      const layerScale = l.scale ?? 1;
      const halfW = (unscaledW * layerScale) / baseW / 2;
      const halfH = (unscaledH * layerScale) / baseH / 2;

      // Distance test (simple axis-aligned approximation for selection)
      if (
        clickX >= lx - halfW &&
        clickX <= lx + halfW &&
        clickY >= ly - halfH &&
        clickY <= ly + halfH
      ) {
        onSelectLayer(l.id);
        return;
      }
    }

    // Clicked empty background: deselect
    onSelectLayer('');
  };

  // Keyboard Nudge for selected layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!selectedLayer) return;

      const step = e.shiftKey ? 0.02 : 0.005;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { x: Math.max(0.01, (selectedLayer.x ?? 0.5) - step) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { x: Math.min(0.99, (selectedLayer.x ?? 0.5) + step) });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { y: Math.max(0.01, (selectedLayer.y ?? 0.5) - step) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateLayer(selectedLayer.id, { y: Math.min(0.99, (selectedLayer.y ?? 0.5) + step) });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onRemoveLayer) {
          e.preventDefault();
          onRemoveLayer(selectedLayer.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, onUpdateLayer, onRemoveLayer]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center overflow-hidden relative select-none bg-background p-3"
      style={{
        backgroundImage:
          'radial-gradient(circle, color-mix(in srgb, var(--foreground) 10%, transparent) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Hidden Audio element */}
      {audioUrl && (
        <audio ref={audioElementRef as any} src={audioUrl} preload="auto" />
      )}

      <div className="flex flex-col items-center gap-2 transition-all duration-70">
        {/* Top Canvas Studio Info Bar */}
        <div
          className="flex items-center justify-between px-1 text-[11px] font-mono text-muted-foreground select-none shrink-0"
          style={{ width: displayW }}
        >
          {/* Left indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold uppercase tracking-wider text-foreground text-[10px]">
              {isPlaying ? 'Playing' : selectedLayer ? `Editing #${selectedLayer.id}` : 'Studio Canvas'}
            </span>
          </div>

          {/* Right chips */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="bg-card border border-border px-1.5 py-0.5 rounded-md text-foreground font-mono shadow-2xs">
              {isPortrait ? '9:16 REEL' : '16:9 VIDEO'}
            </span>
            <span className="bg-card border border-border px-1.5 py-0.5 rounded-md text-muted-foreground font-mono shadow-2xs">
              {Math.round(scale * 100)}% ZOOM
            </span>
          </div>
        </div>

        {/* ── Video Canvas & Interactive Gizmo Container ────────────── */}
        <div
          className="canvas-container relative rounded-xl overflow-hidden shadow-2xl border border-border group bg-black flex items-center justify-center shrink-0"
          style={{ width: displayW, height: displayH }}
          onMouseDown={handleCanvasMouseDown}
          onDoubleClick={(e) => {
            if (e.target === canvasRef.current) {
              onTogglePlay();
            }
          }}
          title={isPlaying ? 'Click Space to Pause' : 'Click layer to select, drag to reposition, or double-click text to edit'}
        >
          {/* Main 2D Render Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* ── Interactive Transform Gizmo for Selected Layer ──────── */}
          {selectedLayer && !isPlaying && (
            <TransformGizmo
              layer={selectedLayer}
              displayW={displayW}
              displayH={displayH}
              baseW={baseW}
              baseH={baseH}
              scale={scale}
              onUpdateLayer={onUpdateLayer}
              onDuplicateLayer={onDuplicateLayer}
              onRemoveLayer={onRemoveLayer}
              onSelectLayer={onSelectLayer}
            />
          )}


        </div>
      </div>

      {/* Canvas resolution indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 font-mono select-none pointer-events-none whitespace-nowrap">
        {isPortrait ? '1080 × 1920 (9:16 Reel)' : '1920 × 1080 (16:9 Full HD)'} · {fps} FPS
      </div>
    </div>
  );
};
