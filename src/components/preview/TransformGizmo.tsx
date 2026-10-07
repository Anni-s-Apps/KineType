import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  AlignCenter,
  AlignVerticalSpaceAround,
  AlignLeft,
  AlignRight,
  Copy,
  Trash2,
  Maximize2,
  Minus,
  Plus,
  X,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { RecipeLayer, TextLayer, ImageLayer, ShapeLayer, CardLayer } from '../../types/recipe';
import { resolveSize } from '../../render/renderer';

interface TransformGizmoProps {
  layer: RecipeLayer;
  displayW: number;
  displayH: number;
  baseW: number;
  baseH: number;
  scale: number;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
  onDuplicateLayer?: (layerId: string) => void;
  onRemoveLayer?: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
}

type DragMode =
  | 'move'
  | 'resize-nw'
  | 'resize-ne'
  | 'resize-se'
  | 'resize-sw'
  | 'resize-n'
  | 'resize-s'
  | 'resize-e'
  | 'resize-w'
  | 'rotate';

export const TransformGizmo: React.FC<TransformGizmoProps> = ({
  layer,
  displayW,
  displayH,
  baseW,
  baseH,
  scale,
  onUpdateLayer,
  onDuplicateLayer,
  onRemoveLayer,
}) => {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [isEditingTextInline, setIsEditingTextInline] = useState(false);
  const [inlineTextVal, setInlineTextVal] = useState('');
  const [activeRotation, setActiveRotation] = useState<number | null>(null);
  const [showGuideX, setShowGuideX] = useState(false);
  const [showGuideY, setShowGuideY] = useState(false);

  const startStateRef = useRef<{
    clientX: number;
    clientY: number;
    layerX: number;
    layerY: number;
    layerScale: number;
    layerRot: number;
    layerW?: number;
    layerH?: number;
    layerSize?: number;
    boxW: number;
    boxH: number;
    centerScreenX: number;
    centerScreenY: number;
  }>({
    clientX: 0,
    clientY: 0,
    layerX: 0.5,
    layerY: 0.5,
    layerScale: 1,
    layerRot: 0,
    boxW: 100,
    boxH: 100,
    centerScreenX: 0,
    centerScreenY: 0,
  });

  const shortSide = Math.min(baseW, baseH);

  // ── Calculate Layer Bounding Box in Canvas Pixels ──────────────────────────
  let unscaledW = 160;
  let unscaledH = 100;

  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const fontSize = resolveSize(textLayer.size || 52, shortSide, 48);
    const lines = (textLayer.text || '').split('\n');
    const maxLineLen = Math.max(1, ...lines.map((l) => l.length));
    unscaledW = Math.max(80, maxLineLen * fontSize * 0.58 + 24);
    unscaledH = Math.max(40, lines.length * fontSize * 1.3 + 16);
  } else if (layer.type === 'image') {
    const imgLayer = layer as ImageLayer;
    unscaledW = resolveSize(imgLayer.w || 320, shortSide, 280);
    unscaledH = resolveSize(imgLayer.h, shortSide, unscaledW * 1.2);
  } else if (layer.type === 'shape') {
    const shapeLayer = layer as ShapeLayer;
    unscaledW = resolveSize(shapeLayer.w || 120, shortSide, 100);
    unscaledH = resolveSize(shapeLayer.h || 60, shortSide, 50);
  } else if (layer.type === 'card') {
    const cardLayer = layer as CardLayer;
    unscaledW = resolveSize(cardLayer.w || 400, shortSide, 360);
    unscaledH = resolveSize(cardLayer.h || 220, shortSide, 200);
  }

  const layerScale = layer.scale ?? 1;
  const layerRotation = activeRotation !== null ? activeRotation : (layer.rotation ?? 0);

  // Box dimensions in screen display pixels
  const boxW = Math.max(28, unscaledW * layerScale * scale);
  const boxH = Math.max(24, unscaledH * layerScale * scale);

  // Box center position in screen display pixels
  const posX = (layer.x ?? 0.5) * displayW;
  const posY = (layer.y ?? 0.5) * displayH;

  // Toolbar vertical position: place above rotation handle, or flip below if near top
  const isNearTop = posY - boxH / 2 < 70;
  const toolbarTop = isNearTop ? posY + boxH / 2 + 20 : posY - boxH / 2 - 62;

  // ── Handle Mouse Down for Dragging / Resizing / Rotating ──────────────────
  const handleStartDrag = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.closest('.canvas-container')?.getBoundingClientRect();
    const centerScreenX = rect ? rect.left + posX : posX;
    const centerScreenY = rect ? rect.top + posY : posY;

    startStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      layerX: layer.x ?? 0.5,
      layerY: layer.y ?? 0.5,
      layerScale: layer.scale ?? 1,
      layerRot: layer.rotation ?? 0,
      layerW: (layer as any).w,
      layerH: (layer as any).h,
      layerSize: (layer as any).size,
      boxW,
      boxH,
      centerScreenX,
      centerScreenY,
    };

    setDragMode(mode);
    if (mode === 'rotate') {
      setActiveRotation(layer.rotation ?? 0);
    }
  };

  // ── Global Drag Listeners (MouseMove & MouseUp) ───────────────────────────
  useEffect(() => {
    if (!dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = startStateRef.current;
      const deltaX = e.clientX - start.clientX;
      const deltaY = e.clientY - start.clientY;

      if (dragMode === 'move') {
        let newX = start.layerX + deltaX / displayW;
        let newY = start.layerY + deltaY / displayH;

        const snapThresholdX = 0.015;
        const snapThresholdY = 0.015;

        if (Math.abs(newX - 0.5) < snapThresholdX) {
          newX = 0.5;
          setShowGuideX(true);
        } else {
          setShowGuideX(false);
        }

        if (Math.abs(newY - 0.5) < snapThresholdY) {
          newY = 0.5;
          setShowGuideY(true);
        } else {
          setShowGuideY(false);
        }

        newX = Math.max(0.01, Math.min(0.99, newX));
        newY = Math.max(0.01, Math.min(0.99, newY));

        onUpdateLayer(layer.id, {
          x: Math.round(newX * 1000) / 1000,
          y: Math.round(newY * 1000) / 1000,
        });
      } else if (dragMode === 'rotate') {
        const angleRad = Math.atan2(
          e.clientY - start.centerScreenY,
          e.clientX - start.centerScreenX
        );
        let angleDeg = Math.round(angleRad * (180 / Math.PI) + 90);

        if (angleDeg < 0) angleDeg += 360;
        if (angleDeg >= 360) angleDeg -= 360;

        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const snap of snapAngles) {
          if (Math.abs(angleDeg - snap) <= 4) {
            angleDeg = snap === 360 ? 0 : snap;
            break;
          }
        }

        setActiveRotation(angleDeg);
        onUpdateLayer(layer.id, { rotation: angleDeg });
      } else if (
        dragMode === 'resize-nw' ||
        dragMode === 'resize-ne' ||
        dragMode === 'resize-se' ||
        dragMode === 'resize-sw'
      ) {
        let scaleFactor = 1;
        const currentDist = Math.hypot(
          e.clientX - start.centerScreenX,
          e.clientY - start.centerScreenY
        );
        const startDist = Math.hypot(
          start.clientX - start.centerScreenX,
          start.clientY - start.centerScreenY
        );

        if (startDist > 0) {
          scaleFactor = currentDist / startDist;
        }

        let newScale = Math.max(0.1, Math.min(5.0, start.layerScale * scaleFactor));
        newScale = Math.round(newScale * 100) / 100;

        onUpdateLayer(layer.id, { scale: newScale });
      } else if (dragMode === 'resize-e' || dragMode === 'resize-w') {
        const mult = dragMode === 'resize-e' ? 1 : -1;
        const widthDeltaDisplay = deltaX * 2 * mult;
        const widthDeltaCanvas = widthDeltaDisplay / scale;

        if (layer.type === 'shape' || layer.type === 'image' || layer.type === 'card') {
          const currentW = (start.layerW || unscaledW) + widthDeltaCanvas;
          const newW = Math.max(20, Math.round(currentW));
          onUpdateLayer(layer.id, { w: newW } as any);
        } else if (layer.type === 'text') {
          const scaleFactor = Math.max(0.2, (start.boxW + widthDeltaDisplay) / start.boxW);
          const newSize = Math.max(12, Math.round((start.layerSize || 52) * scaleFactor));
          onUpdateLayer(layer.id, { size: newSize } as any);
        }
      } else if (dragMode === 'resize-s' || dragMode === 'resize-n') {
        const mult = dragMode === 'resize-s' ? 1 : -1;
        const heightDeltaDisplay = deltaY * 2 * mult;
        const heightDeltaCanvas = heightDeltaDisplay / scale;

        if (layer.type === 'shape' || layer.type === 'image' || layer.type === 'card') {
          const currentH = (start.layerH || unscaledH) + heightDeltaCanvas;
          const newH = Math.max(20, Math.round(currentH));
          onUpdateLayer(layer.id, { h: newH } as any);
        }
      }
    };

    const handleMouseUp = () => {
      setDragMode(null);
      setActiveRotation(null);
      setShowGuideX(false);
      setShowGuideY(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, displayW, displayH, scale, onUpdateLayer, layer.id, layer.type, unscaledW, unscaledH]);

  // ── Handle Double Click for Inline Text Editing ───────────────────────────
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (layer.type === 'text') {
      setInlineTextVal((layer as TextLayer).text || '');
      setIsEditingTextInline(true);
    }
  };

  const handleSaveInlineText = () => {
    setIsEditingTextInline(false);
    onUpdateLayer(layer.id, { text: inlineTextVal } as any);
  };

  return (
    <>
      {/* ── Smart Center Alignment Guide Lines ─────────────────────── */}
      {showGuideX && (
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-40 shadow-sm"
          style={{ left: `${displayW * 0.5}px` }}
        >
          <span className="absolute top-2 -left-6 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-mono font-bold shadow-xs">
            X: 50%
          </span>
        </div>
      )}
      {showGuideY && (
        <div
          className="absolute left-0 right-0 h-px bg-red-500 pointer-events-none z-40 shadow-sm"
          style={{ top: `${displayH * 0.5}px` }}
        >
          <span className="absolute left-2 -top-5 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-mono font-bold shadow-xs">
            Y: 50%
          </span>
        </div>
      )}

      {/* ── Main Transform Gizmo Box ───────────────────────────────── */}
      <div
        className="absolute z-30 pointer-events-auto select-none"
        style={{
          left: `${posX}px`,
          top: `${posY}px`,
          width: `${boxW}px`,
          height: `${boxH}px`,
          transform: `translate(-50%, -50%) rotate(${layerRotation}deg)`,
          transformOrigin: 'center center',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Bounding Box Border */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'move')}
          className={`absolute inset-0 border border-primary rounded-[2px] cursor-move transition-colors ${
            dragMode === 'move' ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'
          }`}
          title="Drag to move (Double-click text to edit)"
        />

        {/* ── Rotation Handle & Stem (Top Center) ──────────────────── */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
          {/* Knob */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'rotate')}
            className="w-4 h-4 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:scale-125 transition-transform"
            title="Drag around center to rotate layer"
          >
            <RotateCw className="w-2.5 h-2.5" />
          </div>
          {/* Stem connecting to box */}
          <div className="w-px h-2 bg-primary" />
        </div>

        {/* Rotation Angle Badge while rotating */}
        {dragMode === 'rotate' && (
          <div
            className="absolute left-1/2 -top-12 -translate-x-1/2 px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono text-[10px] font-bold shadow-lg whitespace-nowrap z-50 animate-in zoom-in-95"
            style={{ transform: `rotate(${-layerRotation}deg)` }}
          >
            {layerRotation}°
          </div>
        )}

        {/* ── 4 Corner Handles (NW, NE, SE, SW) ────────────────────── */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-nw')}
          className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-[1px] bg-background border border-primary shadow-2xs cursor-nwse-resize hover:scale-125 transition-transform"
          title="Scale"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-ne')}
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-[1px] bg-background border border-primary shadow-2xs cursor-nesw-resize hover:scale-125 transition-transform"
          title="Scale"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-se')}
          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-[1px] bg-background border border-primary shadow-2xs cursor-nwse-resize hover:scale-125 transition-transform"
          title="Scale"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-sw')}
          className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-[1px] bg-background border border-primary shadow-2xs cursor-nesw-resize hover:scale-125 transition-transform"
          title="Scale"
        />

        {/* ── 4 Edge Handles (N, S, E, W) ──────────────────────────── */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-n')}
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full bg-background border border-primary shadow-2xs cursor-ns-resize hover:scale-110"
          title="Resize height"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-s')}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full bg-background border border-primary shadow-2xs cursor-ns-resize hover:scale-110"
          title="Resize height"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-w')}
          className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-background border border-primary shadow-2xs cursor-ew-resize hover:scale-110"
          title="Resize width"
        />
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-e')}
          className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-background border border-primary shadow-2xs cursor-ew-resize hover:scale-110"
          title="Resize width"
        />

        {/* ── Inline Text Editor Overlay on Double-Click ────────────── */}
        {isEditingTextInline && layer.type === 'text' && (
          <div
            className="absolute inset-0 z-50 bg-background border border-primary rounded p-1.5 shadow-2xl flex flex-col justify-between"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={inlineTextVal}
              onChange={(e) => setInlineTextVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveInlineText();
                }
              }}
              className="w-full h-full resize-none text-xs bg-transparent text-foreground outline-none font-medium"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-border">
              <button
                onClick={() => setIsEditingTextInline(false)}
                className="px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground text-[10px]"
                title="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInlineText}
                className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium"
                title="Save Text (Enter)"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Real-Editor Action Toolbar ─────────────────────── */}
      <div
        className="absolute z-40 pointer-events-auto select-none transition-all duration-75"
        style={{
          left: `${posX}px`,
          top: `${Math.max(10, toolbarTop)}px`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-card text-card-foreground px-2.5 py-1.5 rounded-xl border border-border shadow-2xl text-xs font-medium whitespace-nowrap">
          {/* Layer ID Badge */}
          <span className="font-mono text-[10px] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
            #{layer.id}
          </span>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Alignment Controls */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => onUpdateLayer(layer.id, { x: 0.5 })}
              className="h-6 px-2 rounded-md hover:bg-card text-foreground flex items-center gap-1 transition-colors text-[11px] font-medium"
              title="Align Center Horizontally (50%)"
            >
              <AlignCenter className="w-3.5 h-3.5 text-primary" />
              <span>Center X</span>
            </button>

            <button
              onClick={() => onUpdateLayer(layer.id, { y: 0.5 })}
              className="h-6 px-2 rounded-md hover:bg-card text-foreground flex items-center gap-1 transition-colors text-[11px] font-medium"
              title="Align Center Vertically (50%)"
            >
              <AlignVerticalSpaceAround className="w-3.5 h-3.5 text-primary" />
              <span>Center Y</span>
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Rotation Controls: Quick Rotate -15°, +15°, and 90° Turn */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => {
                const currentRot = layer.rotation || 0;
                let newRot = (currentRot - 15 + 360) % 360;
                onUpdateLayer(layer.id, { rotation: newRot });
              }}
              className="h-6 w-6 rounded-md hover:bg-card text-foreground flex items-center justify-center transition-colors"
              title="Rotate Left 15°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Rotation Angle Chip / Reset */}
            <button
              onClick={() => onUpdateLayer(layer.id, { rotation: 0 })}
              className={`h-6 px-1.5 rounded-md font-mono text-[10px] font-bold flex items-center gap-1 transition-colors ${
                (layer.rotation || 0) !== 0
                  ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                  : 'text-muted-foreground hover:bg-card'
              }`}
              title="Click to reset rotation to 0°"
            >
              <RotateCw className="w-3 h-3" />
              <span>{layer.rotation || 0}°</span>
            </button>

            <button
              onClick={() => {
                const currentRot = layer.rotation || 0;
                let newRot = (currentRot + 15) % 360;
                onUpdateLayer(layer.id, { rotation: newRot });
              }}
              className="h-6 w-6 rounded-md hover:bg-card text-foreground flex items-center justify-center transition-colors"
              title="Rotate Right 15°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                const currentRot = layer.rotation || 0;
                let newRot = (currentRot + 90) % 360;
                onUpdateLayer(layer.id, { rotation: newRot });
              }}
              className="h-6 px-1.5 rounded-md hover:bg-card text-foreground text-[10px] font-semibold transition-colors"
              title="Rotate 90°"
            >
              +90°
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Scale Stepper Controls */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => {
                const cur = layer.scale ?? 1;
                const newScale = Math.max(0.2, Math.round((cur - 0.1) * 10) / 10);
                onUpdateLayer(layer.id, { scale: newScale });
              }}
              className="h-6 w-6 rounded-md hover:bg-card text-foreground flex items-center justify-center transition-colors"
              title="Scale Down (-10%)"
            >
              <Minus className="w-3 h-3" />
            </button>

            <button
              onClick={() => onUpdateLayer(layer.id, { scale: 1 })}
              className={`h-6 px-1.5 rounded-md font-mono text-[10px] font-bold flex items-center gap-1 transition-colors ${
                (layer.scale ?? 1) !== 1
                  ? 'bg-primary/15 text-primary hover:bg-primary/25'
                  : 'text-muted-foreground hover:bg-card'
              }`}
              title="Click to reset scale to 100%"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{Math.round((layer.scale ?? 1) * 100)}%</span>
            </button>

            <button
              onClick={() => {
                const cur = layer.scale ?? 1;
                const newScale = Math.min(3.0, Math.round((cur + 0.1) * 10) / 10);
                onUpdateLayer(layer.id, { scale: newScale });
              }}
              className="h-6 w-6 rounded-md hover:bg-card text-foreground flex items-center justify-center transition-colors"
              title="Scale Up (+10%)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Duplicate & Delete Action Buttons */}
          {onDuplicateLayer && (
            <button
              onClick={() => onDuplicateLayer(layer.id)}
              className="h-7 w-7 rounded-lg hover:bg-muted text-foreground flex items-center justify-center transition-colors"
              title="Duplicate Layer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {onRemoveLayer && (
            <button
              onClick={() => onRemoveLayer(layer.id)}
              className="h-7 w-7 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
              title="Delete Layer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
