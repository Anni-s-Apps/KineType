import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square as StopIcon,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Camera,
  Layers,
  Music,
  Copy,
  Trash2,
  Plus,
  Type,
  Square,
  Image as ImageIcon,
  CreditCard,
  Grid,
} from 'lucide-react';
import { Recipe, RecipeLayer } from '../../types/recipe';

interface TimelineProps {
  recipe: Recipe;
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
  onDuplicateLayer: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onAddLayer: (layer: RecipeLayer) => void;
  audioFile: File | null;
  audioUrl: string | null;
}

export const Timeline: React.FC<TimelineProps> = ({
  recipe,
  currentTime,
  onSeek,
  isPlaying,
  onTogglePlay,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onRemoveLayer,
  onAddLayer,
  audioFile,
  audioUrl,
}) => {
  const [timelineHeight, setTimelineHeight] = useState<number>(240);
  const [pxPerSec, setPxPerSec] = useState<number>(65); // Zoom level: pixels per second
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(240);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const duration = Math.max(1, recipe.settings?.duration || 10);
  const fps = recipe.settings?.fps || 30;
  const layers = recipe.layers || [];
  const timelineContentWidth = Math.max(900, duration * pxPerSec);

  // Playhead dragging state
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Layer trim / move dragging state
  const [dragState, setDragState] = useState<{
    layerId: string;
    mode: 'move' | 'trim-start' | 'trim-end';
    initialMouseX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  // Resizable timeline height handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHeight(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = timelineHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingHeight) return;
      const deltaY = resizeStartYRef.current - e.clientY;
      const newHeight = Math.max(180, Math.min(480, resizeStartHeightRef.current + deltaY));
      setTimelineHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizingHeight) {
        setIsResizingHeight(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingHeight]);

  // Handle seeking
  const handleSeekTime = useCallback(
    (time: number) => {
      let t = Math.max(0, Math.min(duration, time));
      if (snapToGrid) {
        t = Math.round(t * 10) / 10;
      }
      onSeek(t);
    },
    [duration, onSeek, snapToGrid]
  );

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 140; // 140px header offset
    if (clickX < 0) return;
    const time = clickX / pxPerSec;
    handleSeekTime(time);
  };

  // Playhead mouse listeners
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollContainerRef.current) return;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 140;
      const time = Math.max(0, Math.min(duration, relativeX / pxPerSec));
      onSeek(time);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, pxPerSec, duration, onSeek]);

  // Layer drag move / trim listeners
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragState.initialMouseX;
      const deltaTime = deltaPx / pxPerSec;

      if (dragState.mode === 'move') {
        const span = dragState.initialEnd - dragState.initialStart;
        let newStart = Math.max(0, dragState.initialStart + deltaTime);
        let newEnd = newStart + span;
        if (newEnd > duration) {
          newEnd = duration;
          newStart = Math.max(0, newEnd - span);
        }
        if (snapToGrid) {
          newStart = Math.round(newStart * 10) / 10;
          newEnd = Math.round(newEnd * 10) / 10;
        }
        onUpdateLayer(dragState.layerId, {
          start: Number(newStart.toFixed(2)),
          end: Number(newEnd.toFixed(2)),
        });
      } else if (dragState.mode === 'trim-start') {
        let newStart = Math.max(0, Math.min(dragState.initialEnd - 0.2, dragState.initialStart + deltaTime));
        if (snapToGrid) newStart = Math.round(newStart * 10) / 10;
        onUpdateLayer(dragState.layerId, {
          start: Number(newStart.toFixed(2)),
        });
      } else if (dragState.mode === 'trim-end') {
        let newEnd = Math.max(dragState.initialStart + 0.2, Math.min(duration, dragState.initialEnd + deltaTime));
        if (snapToGrid) newEnd = Math.round(newEnd * 10) / 10;
        onUpdateLayer(dragState.layerId, {
          end: Number(newEnd.toFixed(2)),
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pxPerSec, duration, snapToGrid, onUpdateLayer]);

  // Generate waveform bars for visual audio track
  const waveformBars = useMemo(() => {
    const count = Math.ceil(duration * 8);
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = i * 0.4;
      const wave = Math.sin(x) * 0.4 + Math.cos(x * 2.1) * 0.35 + 0.5;
      const height = Math.max(15, Math.min(90, Math.round(wave * 80 + 10)));
      bars.push(height);
    }
    return bars;
  }, [duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;
  };

  const stepFrame = (deltaFrames: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaFrames / fps));
    onSeek(newTime);
  };

  const getLayerColor = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary';
    }
    switch (type) {
      case 'text':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300 hover:border-blue-500';
      case 'image':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:border-emerald-500';
      case 'shape':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:border-amber-500';
      case 'card':
        return 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300 hover:border-purple-500';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-3 h-3 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3 h-3 shrink-0" />;
      case 'shape':
        return <Square className="w-3 h-3 shrink-0" />;
      case 'card':
        return <CreditCard className="w-3 h-3 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ height: `${timelineHeight}px` }}
      className="bg-card border-t border-border flex flex-col select-none relative overflow-hidden text-card-foreground shrink-0 z-10"
    >
      {/* ── Top Resize Handle Bar ──────────────────────────────────── */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="h-1.5 w-full bg-border/40 hover:bg-primary cursor-row-resize transition-colors shrink-0 z-30"
        title="Drag up/down to resize timeline"
      />

      {/* ── Timeline Control Toolbar ───────────────────────────────── */}
      <div className="h-9 px-3 bg-card border-b border-border flex items-center justify-between text-xs shrink-0">
        {/* Left: Playhead Controls & Time Counter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title="Stop / Reset to Start"
          >
            <StopIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title="Step Back 1 Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="h-7 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 font-medium transition-colors shadow-xs"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => stepFrame(1)}
            className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title="Step Forward 1 Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="font-mono text-xs font-medium ml-2 px-2 py-0.5 rounded bg-muted/60 border border-border">
            <span className="text-foreground">{formatTime(currentTime)}</span>
            <span className="text-muted-foreground"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Center: Selected Layer Actions */}
        <div className="flex items-center gap-1.5">
          {selectedLayerId && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded border border-border text-[11px]">
              <span className="text-muted-foreground font-mono">#{selectedLayerId}</span>
              <div className="h-3 w-px bg-border mx-1" />
              <button
                onClick={() => onDuplicateLayer(selectedLayerId)}
                className="hover:text-foreground text-muted-foreground flex items-center gap-1"
                title="Duplicate"
              >
                <Copy className="w-3 h-3" />
                Duplicate
              </button>
              <div className="h-3 w-px bg-border mx-1" />
              <button
                onClick={() => onRemoveLayer(selectedLayerId)}
                className="hover:text-destructive text-muted-foreground flex items-center gap-1"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}

          <button
            onClick={() =>
              onAddLayer({
                id: `text_${Date.now().toString().slice(-4)}`,
                type: 'text',
                text: 'New Text',
                start: currentTime,
                end: Math.min(duration, currentTime + 3.0),
                x: 0.5,
                y: 0.5,
                size: 52,
                weight: 700,
                color: '#FFFFFF',
                align: 'center',
                in: 'fadeUp',
                out: 'fadeOut',
                z: layers.length + 1,
              })
            }
            className="h-6.5 px-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 border border-border"
          >
            <Plus className="w-3 h-3" /> Add Layer
          </button>
        </div>

        {/* Right: Snap to Grid & Zoom Slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`h-6.5 px-2 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
              snapToGrid
                ? 'bg-secondary text-foreground border-border'
                : 'text-muted-foreground border-transparent hover:bg-muted'
            }`}
            title="Toggle Snap to 0.1s Grid"
          >
            <Grid className="w-3 h-3" />
            Snap
          </button>

          <div className="flex items-center gap-1.5">
            <ZoomOut className="w-3 h-3 text-muted-foreground" />
            <input
              type="range"
              min={30}
              max={160}
              value={pxPerSec}
              onChange={(e) => setPxPerSec(parseInt(e.target.value))}
              className="w-20 h-1 bg-muted rounded appearance-none cursor-pointer accent-primary"
            />
            <ZoomIn className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
              {Math.round((pxPerSec / 65) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Multi-Track Scroll Viewport ───────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-background flex"
      >
        {/* Left Fixed Track Headers Column (w-36 / 140px) */}
        <div className="w-36 shrink-0 bg-card border-r border-border flex flex-col z-20 sticky left-0 shadow-xs">
          {/* Header ruler label */}
          <div className="h-6 border-b border-border bg-muted/40 px-2 flex items-center text-[10px] font-mono text-muted-foreground uppercase font-semibold">
            Track / Layers
          </div>

          {/* Audio Track Header */}
          <div className="h-8 border-b border-border px-2 flex items-center justify-between text-xs bg-muted/10">
            <div className="flex items-center gap-1.5 truncate">
              <Music className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-medium text-foreground truncate">
                {audioFile ? audioFile.name : audioUrl ? 'Voiceover' : 'Audio Track'}
              </span>
            </div>
          </div>

          {/* Camera Track Header */}
          <div className="h-7 border-b border-border px-2 flex items-center justify-between text-xs bg-muted/10">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-purple-500" />
              <span className="text-[11px] font-medium text-foreground">Camera</span>
            </div>
          </div>

          {/* Layer Track Headers */}
          <div className="py-1 space-y-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`h-7 px-2 flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors truncate ${
                  selectedLayerId === layer.id ? 'bg-secondary font-semibold text-foreground' : 'hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                {getLayerIcon(layer.type)}
                <span className="truncate">#{layer.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Workspace Area */}
        <div
          className="relative min-h-full"
          style={{ width: `${timelineContentWidth + 160}px` }}
        >
          {/* 1. Precise Time Ruler with Sub-second ticks */}
          <div
            onClick={handleRulerClick}
            className="h-6 border-b border-border bg-muted/30 relative cursor-pointer"
          >
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, s) => {
              const left = s * pxPerSec;
              return (
                <div key={s} className="absolute top-0 bottom-0" style={{ left: `${left}px` }}>
                  <div className="h-2 w-px bg-border/80" />
                  <span className="text-[9px] font-mono text-muted-foreground ml-1 -mt-0.5 select-none block">
                    {s}s
                  </span>
                  {/* Half-second sub-tick */}
                  {s < duration && (
                    <div
                      className="absolute top-0 h-1 w-px bg-border/40"
                      style={{ left: `${pxPerSec * 0.5}px` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. Audio Waveform Track */}
          <div
            onClick={handleRulerClick}
            className="h-8 border-b border-border/80 bg-muted/10 relative flex items-center px-1 overflow-hidden cursor-pointer"
          >
            <div className="flex items-center gap-0.5 h-full py-1 w-full opacity-70">
              {waveformBars.map((height, i) => {
                const barTime = (i / waveformBars.length) * duration;
                const isPast = barTime <= currentTime;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-xs transition-colors ${
                      isPast ? 'bg-emerald-500' : 'bg-emerald-500/30'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* 3. Camera Keyframes Track */}
          <div
            onClick={handleRulerClick}
            className="h-7 border-b border-border/60 bg-muted/5 relative flex items-center cursor-pointer"
          >
            {(recipe.camera || []).map((cam, idx) => {
              const left = cam.start * pxPerSec;
              const width = Math.max(20, (cam.end - cam.start) * pxPerSec);
              return (
                <div
                  key={idx}
                  className="absolute h-5 rounded bg-purple-500/15 border border-purple-500/40 text-[9px] font-mono text-purple-600 dark:text-purple-300 px-1.5 flex items-center gap-1"
                  style={{ left: `${left}px`, width: `${width}px` }}
                >
                  <span className="w-1.5 h-1.5 rotate-45 bg-purple-500 inline-block" />
                  <span>{cam.zoom}x</span>
                </div>
              );
            })}
          </div>

          {/* 4. Layer Tracks Blocks */}
          <div className="py-1 space-y-1">
            {layers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              const left = layer.start * pxPerSec;
              const width = Math.max(24, (layer.end - layer.start) * pxPerSec);
              const colorClasses = getLayerColor(layer.type, isSelected);

              return (
                <div key={layer.id} className="h-7 relative flex items-center">
                  {/* Layer Block Box */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLayer(layer.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectLayer(layer.id);
                      setDragState({
                        layerId: layer.id,
                        mode: 'move',
                        initialMouseX: e.clientX,
                        initialStart: layer.start,
                        initialEnd: layer.end,
                      });
                    }}
                    className={`absolute h-6 rounded-md border text-[11px] font-medium flex items-center justify-between px-2 cursor-grab active:cursor-grabbing transition-all select-none ${colorClasses}`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                    }}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                          layerId: layer.id,
                          mode: 'trim-start',
                          initialMouseX: e.clientX,
                          initialStart: layer.start,
                          initialEnd: layer.end,
                        });
                      }}
                      className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/30 rounded-l"
                    />

                    {/* Content Preview */}
                    <div className="flex items-center gap-1.5 truncate">
                      {getLayerIcon(layer.type)}
                      <span className="truncate">
                        {layer.type === 'text'
                          ? (layer as any).text.replace(/\n/g, ' ') || layer.id
                          : layer.id}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono opacity-60 shrink-0 ml-1">
                      {(layer.end - layer.start).toFixed(1)}s
                    </span>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                          layerId: layer.id,
                          mode: 'trim-end',
                          initialMouseX: e.clientX,
                          initialStart: layer.start,
                          initialEnd: layer.end,
                        });
                      }}
                      className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/30 rounded-r"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Smooth Red Playhead Line & Pin */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingPlayhead(true);
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 cursor-ew-resize group pointer-events-auto"
            style={{ left: `${currentTime * pxPerSec}px` }}
          >
            {/* Playhead Pin Handle */}
            <div className="w-3 h-3 bg-red-500 -ml-[5px] -top-1 absolute rotate-45 shadow-md shadow-red-500/40 rounded-xs group-hover:scale-125 transition-transform" />
            <div className="w-px h-full bg-red-500 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
