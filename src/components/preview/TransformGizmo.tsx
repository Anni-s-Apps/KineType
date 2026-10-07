import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  Move,
  Maximize2,
  AlignCenter,
  AlignVerticalSpaceAround,
  Copy,
  Trash2,
  Sparkles,
  Type,
  Image as ImageIcon,
  Square,
  CreditCard,
  X,
  Check,
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
  onSelectLayer,
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
    // Estimate width from character count and font size
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
        // Translation in normalized coords (0..1)
        let newX = start.layerX + deltaX / displayW;
        let newY = start.layerY + deltaY / displayH;

        // Smart guides snapping to Center (0.5)
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

        // Clamp to screen bounds with padding
        newX = Math.max(0.02, Math.min(0.98, newX));
        newY = Math.max(0.02, Math.min(0.98, newY));

        onUpdateLayer(layer.id, {
          x: Math.round(newX * 1000) / 1000,
          y: Math.round(newY * 1000) / 1000,
        });
      } else if (dragMode === 'rotate') {
        // Calculate angle from layer center to current mouse
        const angleRad = Math.atan2(
          e.clientY - start.centerScreenY,
          e.clientX - start.centerScreenX
        );
        let angleDeg = Math.round(angleRad * (180 / Math.PI) + 90);

        // Normalize to 0..360
        if (angleDeg < 0) angleDeg += 360;
        if (angleDeg >= 360) angleDeg -= 360;

        // Snapping: Snap to 0, 45, 90, 135, 180, 225, 270, 315 within 4 degrees
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
        // Uniform Proportional Scale
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
        // Horizontal width resizing
        const mult = dragMode === 'resize-e' ? 1 : -1;
        const widthDeltaDisplay = deltaX * 2 * mult;
        const widthDeltaCanvas = widthDeltaDisplay / scale;

        if (layer.type === 'shape' || layer.type === 'image' || layer.type === 'card') {
          const currentW = (start.layerW || unscaledW) + widthDeltaCanvas;
          const newW = Math.max(20, Math.round(currentW));
          onUpdateLayer(layer.id, { w: newW } as any);
        } else if (layer.type === 'text') {
          // Scale font size proportionally
          const scaleFactor = Math.max(0.2, (start.boxW + widthDeltaDisplay) / start.boxW);
          const newSize = Math.max(12, Math.round(((start.layerSize || 52) * scaleFactor)));
          onUpdateLayer(layer.id, { size: newSize } as any);
        }
      } else if (dragMode === 'resize-s' || dragMode === 'resize-n') {
        // Vertical height resizing
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
          className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 pointer-events-none z-40 shadow-sm animate-pulse"
          style={{ left: `${displayW * 0.5}px` }}
        >
          <span className="absolute top-2 -left-6 px-1 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold">
            X: 50%
          </span>
        </div>
      )}
      {showGuideY && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-red-500/80 pointer-events-none z-40 shadow-sm animate-pulse"
          style={{ top: `${displayH * 0.5}px` }}
        >
          <span className="absolute left-2 -top-5 px-1 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold">
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
          className={`absolute inset-0 border-2 rounded-sm cursor-move transition-colors ${
            dragMode === 'move'
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-primary/90 hover:border-primary hover:bg-primary/5 shadow-md'
          }`}
          title="Drag to reposition layer (Double-click to edit)"
        >
          {/* Subtle diagonal stripe pattern when hovering/dragging */}
          <div className="w-full h-full opacity-20 pointer-events-none" />
        </div>

        {/* ── Rotation Knob & Stem (Top Center) ────────────────────── */}
        <div className="absolute left-1/2 -top-7 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
          {/* Rotation Handle Knob */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'rotate')}
            className="w-5 h-5 rounded-full bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-transform hover:scale-125 group"
            title="Drag around center to rotate"
          >
            <RotateCw className="w-3 h-3 group-hover:rotate-45 transition-transform" />
          </div>
          {/* Stem Line connecting to bounding box top */}
          <div className="w-0.5 h-2 bg-primary" />
        </div>

        {/* Floating Rotation Angle Tooltip Badge while rotating */}
        {dragMode === 'rotate' && (
          <div
            className="absolute left-1/2 -top-14 -translate-x-1/2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-mono text-[11px] font-bold shadow-xl whitespace-nowrap z-50 animate-in zoom-in-95"
            style={{ transform: `rotate(${-layerRotation}deg)` }}
          >
            {layerRotation}°
          </div>
        )}

        {/* ── 4 Corner Resize Handles ──────────────────────────────── */}
        {/* Top-Left (NW) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-nw')}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-xs bg-background border-2 border-primary shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
          title="Scale layer"
        />
        {/* Top-Right (NE) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-ne')}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-xs bg-background border-2 border-primary shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
          title="Scale layer"
        />
        {/* Bottom-Right (SE) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-se')}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-xs bg-background border-2 border-primary shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
          title="Scale layer"
        />
        {/* Bottom-Left (SW) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-sw')}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 rounded-xs bg-background border-2 border-primary shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
          title="Scale layer"
        />

        {/* ── 4 Edge Resize Handles ────────────────────────────────── */}
        {/* Top (N) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-n')}
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 rounded-xs bg-background border border-primary shadow-2xs cursor-ns-resize hover:scale-110 transition-transform"
          title="Resize height"
        />
        {/* Bottom (S) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-s')}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 rounded-xs bg-background border border-primary shadow-2xs cursor-ns-resize hover:scale-110 transition-transform"
          title="Resize height"
        />
        {/* Left (W) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-w')}
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-xs bg-background border border-primary shadow-2xs cursor-ew-resize hover:scale-110 transition-transform"
          title="Resize width"
        />
        {/* Right (E) */}
        <div
          onMouseDown={(e) => handleStartDrag(e, 'resize-e')}
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-xs bg-background border border-primary shadow-2xs cursor-ew-resize hover:scale-110 transition-transform"
          title="Resize width"
        />

        {/* ── Inline Text Editor Overlay on Double-Click ────────────── */}
        {isEditingTextInline && layer.type === 'text' && (
          <div
            className="absolute inset-0 z-50 bg-background/95 border-2 border-primary rounded p-1 shadow-2xl flex flex-col justify-between"
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
              className="w-full h-full resize-none text-xs bg-transparent text-foreground outline-none p-1 font-medium"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-border">
              <button
                onClick={() => setIsEditingTextInline(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={handleSaveInlineText}
                className="p-1 rounded bg-primary text-primary-foreground"
                title="Save Text (Enter)"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Quick Action Toolbar over Selected Layer ────────── */}
      <div
        className="absolute z-40 pointer-events-auto select-none transition-all duration-75"
        style={{
          left: `${posX}px`,
          top: `${Math.max(20, posY - boxH / 2 - 42)}px`,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md px-2 py-1 rounded-lg border border-border shadow-xl text-xs text-card-foreground">
          {/* Layer ID Badge */}
          <span className="font-mono text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 rounded bg-muted/60">
            #{layer.id}
          </span>

          <div className="h-3.5 w-px bg-border mx-0.5" />

          {/* Quick Align Center X */}
          <button
            onClick={() => onUpdateLayer(layer.id, { x: 0.5 })}
            className="h-6 px-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Align Center Horizontally"
          >
            <AlignCenter className="w-3 h-3" />
            <span className="text-[10px] hidden sm:inline">Center X</span>
          </button>

          {/* Quick Align Center Y */}
          <button
            onClick={() => onUpdateLayer(layer.id, { y: 0.5 })}
            className="h-6 px-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Align Center Vertically"
          >
            <AlignVerticalSpaceAround className="w-3 h-3" />
            <span className="text-[10px] hidden sm:inline">Center Y</span>
          </button>

          {/* Reset Rotation if rotated */}
          {(layer.rotation ?? 0) !== 0 && (
            <button
              onClick={() => onUpdateLayer(layer.id, { rotation: 0 })}
              className="h-6 px-1.5 rounded hover:bg-muted text-amber-500 hover:text-amber-400 font-mono text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
              title="Reset Rotation to 0°"
            >
              <RotateCw className="w-2.5 h-2.5" />
              {layer.rotation}°
            </button>
          )}

          {/* Scale Badge / Reset if scaled */}
          {(layer.scale ?? 1) !== 1 && (
            <button
              onClick={() => onUpdateLayer(layer.id, { scale: 1 })}
              className="h-6 px-1.5 rounded hover:bg-muted text-primary font-mono text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
              title="Reset Scale to 100%"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              {Math.round((layer.scale ?? 1) * 100)}%
            </button>
          )}

          <div className="h-3.5 w-px bg-border mx-0.5" />

          {/* Duplicate Layer */}
          {onDuplicateLayer && (
            <button
              onClick={() => onDuplicateLayer(layer.id)}
              className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Duplicate Layer"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}

          {/* Delete Layer */}
          {onRemoveLayer && (
            <button
              onClick={() => onRemoveLayer(layer.id)}
              className="h-6 w-6 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
              title="Delete Layer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
