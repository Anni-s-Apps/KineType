import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
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
    const clickX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 144; // 144px (w-36) header offset
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
      const relativeX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 144;
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

  // Smart Page Auto-Scroll during playback (Rock-solid, Zero Shake / Zero Vibration)
  useEffect(() => {
    if (!isPlaying || isDraggingPlayhead) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const playheadPx = currentTime * pxPerSec + 144; // 144px (w-36) header offset
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    // Advance viewport only when playhead reaches the right edge of screen
    if (playheadPx > scrollLeft + clientWidth - 50) {
      container.scrollLeft = playheadPx - 160;
    } else if (playheadPx < scrollLeft + 144) {
      container.scrollLeft = Math.max(0, playheadPx - 160);
    }
  }, [currentTime, isPlaying, pxPerSec, isDraggingPlayhead]);

  // Auto-scroll to selected layer when clicked
  useEffect(() => {
    if (!selectedLayerId || isPlaying) return;
    const targetLayer = layers.find((l) => l.id === selectedLayerId);
    if (!targetLayer) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const layerLeftPx = targetLayer.start * pxPerSec + 144;
    const layerRightPx = targetLayer.end * pxPerSec + 144;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (layerLeftPx < scrollLeft + 144 || layerRightPx > scrollLeft + clientWidth) {
      container.scrollTo({
        left: Math.max(0, layerLeftPx - 180),
        behavior: 'smooth',
      });
    }
  }, [selectedLayerId]);

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

  const totalTimelineWidth = Math.max(1600, (duration + 10) * pxPerSec);
  const totalRulerSeconds = Math.ceil(totalTimelineWidth / pxPerSec);

  // Generate waveform bars for visual audio track spanning full timeline width
  const waveformBars = useMemo(() => {
    const totalPx = Math.max(1600, duration * pxPerSec);
    const barSpacing = 5; // 3px bar + 2px gap
    const count = Math.ceil(totalPx / barSpacing);
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = i * 0.35;
      const wave = Math.sin(x) * 0.35 + Math.cos(x * 1.7) * 0.3 + 0.45;
      const height = Math.max(20, Math.min(85, Math.round(wave * 65 + 20)));
      bars.push(height);
    }
    return bars;
  }, [duration, pxPerSec]);

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
      <div className="h-10 px-3 bg-card border-b border-border flex items-center justify-between gap-3 text-xs shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Left: Playhead Controls & Time Counter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSeek(0)}
            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title="Stop / Reset to Start"
          >
            <StopIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title="Step Back 1 Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="h-7 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 font-medium transition-colors shadow-xs shrink-0 whitespace-nowrap"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => stepFrame(1)}
            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title="Step Forward 1 Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="h-7 px-2.5 rounded-md bg-muted/60 border border-border flex items-center font-mono text-xs font-medium ml-1 shrink-0 whitespace-nowrap">
            <span className="text-foreground">{formatTime(currentTime)}</span>
            <span className="text-muted-foreground">&nbsp;/ {formatTime(duration)}</span>
          </div>
        </div>

        {/* Center: Selected Layer Actions & Add Layer */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedLayerId && (
            <div className="h-7 px-2 rounded-md bg-secondary border border-border flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap">
              <span className="text-muted-foreground font-mono">#{selectedLayerId}</span>
              <div className="h-3.5 w-px bg-border mx-0.5" />
              <button
                onClick={() => onDuplicateLayer(selectedLayerId)}
                className="h-5 px-1.5 rounded hover:bg-background/80 hover:text-foreground text-muted-foreground flex items-center gap-1 transition-colors"
                title="Duplicate Layer"
              >
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>
              <div className="h-3.5 w-px bg-border mx-0.5" />
              <button
                onClick={() => onRemoveLayer(selectedLayerId)}
                className="h-5 px-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center gap-1 transition-colors"
                title="Delete Layer"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Delete</span>
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
            className="h-7 px-2.5 rounded-md bg-secondary/70 hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 border border-border transition-colors shrink-0 whitespace-nowrap shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Layer</span>
          </button>
        </div>

        {/* Right: Snap to Grid & Zoom Slider */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`h-7 px-2.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              snapToGrid
                ? 'bg-secondary text-foreground border-border font-semibold shadow-2xs'
                : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
            title="Toggle Snap to 0.1s Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          <div className="h-7 px-2 rounded-md bg-muted/40 border border-border flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <ZoomOut className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={30}
              max={160}
              value={pxPerSec}
              onChange={(e) => setPxPerSec(parseInt(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-muted rounded appearance-none cursor-pointer accent-primary"
            />
            <ZoomIn className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground w-7 text-right shrink-0">
              {Math.round((pxPerSec / 65) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Multi-Track Scroll Viewport ───────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-background select-none transform-gpu"
      >
        <div
          className="relative flex flex-col min-h-full"
          style={{ width: `${totalTimelineWidth + 144}px` }}
        >
          {/* Top Sticky Ruler Row (Track/Layers Label + Time Ruler Ticks) */}
          <div className="h-7 border-b border-border bg-card flex sticky top-0 z-40 shadow-xs shrink-0">
            {/* Left Header Cell (Sticky Left & Sticky Top) */}
            <div className="w-36 shrink-0 bg-card border-r border-border h-full px-2.5 flex items-center text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider sticky left-0 z-50">
              Track / Layers
            </div>
            {/* Right Ruler Ticks */}
            <div
              onClick={handleRulerClick}
              className="relative flex-1 h-full cursor-pointer bg-card"
            >
              {Array.from({ length: totalRulerSeconds + 1 }).map((_, s) => {
                const left = s * pxPerSec;
                const isPastProjectEnd = s > duration;
                return (
                  <div key={s} className="absolute top-0 bottom-0" style={{ left: `${left}px` }}>
                    <div className={`h-2.5 w-px ${isPastProjectEnd ? 'bg-border/30' : 'bg-border/80'}`} />
                    <span className={`text-[9px] font-mono ml-1.5 -mt-0.5 select-none block ${isPastProjectEnd ? 'text-muted-foreground/35' : 'text-muted-foreground'}`}>
                      {s}s
                    </span>
                    <div
                      className="absolute top-0 h-1.5 w-px bg-border/40"
                      style={{ left: `${pxPerSec * 0.5}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 1: Audio Track */}
          <div className="h-8 border-b border-border/40 flex items-center shrink-0 bg-muted/5 hover:bg-muted/10 transition-colors">
            <div className="w-36 shrink-0 bg-card border-r border-border h-full px-2.5 flex items-center justify-between text-xs sticky left-0 z-20 shadow-2xs">
              <div className="flex items-center gap-1.5 truncate">
                <Music className={`w-3.5 h-3.5 ${audioFile || audioUrl ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                <span className={`text-[11px] font-medium truncate ${audioFile || audioUrl ? 'text-foreground font-semibold' : 'text-muted-foreground/70'}`}>
                  {audioFile ? audioFile.name : audioUrl ? 'Voiceover' : 'Audio Track'}
                </span>
              </div>
            </div>
            <div
              onClick={handleRulerClick}
              className="relative flex-1 h-full flex items-center cursor-pointer overflow-hidden"
            >
              {audioFile || audioUrl ? (
                <div
                  className="flex items-center gap-[2px] h-full py-1.5 px-2 bg-emerald-500/10 border-y border-emerald-500/20"
                  style={{ width: `${Math.max(totalTimelineWidth, duration * pxPerSec)}px` }}
                >
                  {waveformBars.map((height, i) => {
                    const barTime = (i / waveformBars.length) * duration;
                    const isPast = barTime <= currentTime;
                    return (
                      <div
                        key={i}
                        className={`w-[3px] rounded-full shrink-0 transition-colors ${
                          isPast ? 'bg-emerald-500' : 'bg-emerald-500/40'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 text-[10px] font-mono text-muted-foreground/40 italic select-none">
                  <Music className="w-3 h-3 opacity-40" />
                  <span>No audio track loaded (click to seek)</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Camera Track */}
          <div className="h-8 border-b border-border/40 flex items-center shrink-0 bg-muted/5 hover:bg-muted/10 transition-colors">
            <div className="w-36 shrink-0 bg-card border-r border-border h-full px-2.5 flex items-center justify-between text-xs sticky left-0 z-20 shadow-2xs">
              <div className="flex items-center gap-1.5 truncate">
                <Camera className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[11px] font-medium text-foreground">Camera Keyframes</span>
              </div>
            </div>
            <div
              onClick={handleRulerClick}
              className="relative flex-1 h-full flex items-center cursor-pointer"
            >
              {(recipe.camera || []).map((cam, idx) => {
                const left = cam.start * pxPerSec;
                const width = Math.max(28, (cam.end - cam.start) * pxPerSec - 4);
                return (
                  <div
                    key={idx}
                    className="absolute h-5.5 rounded-md bg-purple-500/15 border border-purple-500/35 text-[10px] font-mono text-purple-700 dark:text-purple-300 px-2 flex items-center justify-between shadow-2xs hover:bg-purple-500/25 transition-colors"
                    style={{ left: `${left + 2}px`, width: `${width}px` }}
                    title={`Camera Zoom: ${cam.zoom}x (${cam.start}s - ${cam.end}s)`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rotate-45 bg-purple-500 shadow-xs inline-block shrink-0" />
                      <span className="font-semibold">{cam.zoom}x</span>
                    </div>
                    <span className="text-[8px] opacity-60 ml-1 shrink-0">
                      {(cam.end - cam.start).toFixed(1)}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer Rows */}
          {layers.map((layer) => {
            const isSelected = selectedLayerId === layer.id;
            const left = layer.start * pxPerSec;
            const width = Math.max(24, (layer.end - layer.start) * pxPerSec);
            const colorClasses = getLayerColor(layer.type, isSelected);

            return (
              <div
                key={layer.id}
                className={`h-8 border-b border-border/40 flex items-center shrink-0 transition-colors ${
                  isSelected ? 'bg-primary/5' : 'hover:bg-muted/10'
                }`}
              >
                {/* Left Track Header Cell */}
                <div
                  onClick={() => onSelectLayer(layer.id)}
                  className={`w-36 shrink-0 border-r border-border h-full px-2.5 flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors truncate sticky left-0 z-20 shadow-2xs ${
                    isSelected ? 'bg-secondary font-semibold text-foreground' : 'bg-card hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {getLayerIcon(layer.type)}
                  <span className="truncate">#{layer.id}</span>
                </div>

                {/* Right Lane with Draggable Block */}
                <div className="relative flex-1 h-full flex items-center">
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
              </div>
            );
          })}

          {/* Full-Height Modern DAW Precision Red Playhead Line & Floating Pin */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingPlayhead(true);
            }}
            className="absolute top-0 bottom-0 z-[60] cursor-ew-resize group pointer-events-auto flex flex-col items-center"
            style={{ left: `${currentTime * pxPerSec + 144}px`, width: '1px' }}
          >
            {/* Precision DAW Marker Pin Head - Elevated STICKY TOP */}
            <div className="sticky top-0 z-[70] flex flex-col items-center select-none -mt-0.5 group-hover:scale-110 active:scale-95 transition-transform">
              {/* Sleek Top Marker Head with Precision Center Notch */}
              <div className="w-3.5 h-3.5 bg-gradient-to-b from-rose-500 via-red-500 to-red-600 rounded-t-sm shadow-md shadow-red-500/50 border border-rose-300/40 flex items-center justify-center">
                <div className="w-0.5 h-2 bg-white/90 rounded-full" />
              </div>
              {/* Downward Precision Pointer Arrow */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-red-600 -mt-[1px] drop-shadow-xs" />
            </div>

            {/* Glowing Precision Laser Needle Line */}
            <div className="w-[1.5px] flex-1 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
