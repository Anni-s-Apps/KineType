import React from 'react';
import {
  Sliders,
  Clock,
  Move,
  Sparkles,
  Palette,
  Type,
  Layers as LayersIcon,
  Code2,
} from 'lucide-react';
import { Recipe, RecipeLayer, AnimationPreset, ShapeKind } from '../../types/recipe';

interface InspectorPanelProps {
  recipe: Recipe;
  selectedLayerId: string | null;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
}

const ENTRANCE_PRESETS: AnimationPreset[] = [
  'fadeUp',
  'fadeDown',
  'scaleIn',
  'popIn',
  'bounceIn',
  'blurIn',
  'slideL',
  'slideR',
  'typeOn',
  'wordIn',
  'charFade',
  'zoomRotateIn',
  'none',
];

const EXIT_PRESETS: AnimationPreset[] = [
  'fadeOut',
  'scaleOut',
  'fadeDownOut',
  'slideOutL',
  'slideOutR',
  'none',
];

const SHAPE_KINDS: ShapeKind[] = [
  'rect',
  'pill',
  'circle',
  'ring',
  'line',
  'arrow',
  'check',
  'cross',
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  recipe,
  selectedLayerId,
  onUpdateLayer,
}) => {
  const layer = recipe.layers?.find((l) => l.id === selectedLayerId);

  if (!layer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-card border-l border-border">
        <Sliders className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs">Select a layer to inspect properties.</p>
      </div>
    );
  }

  const handleNumChange = (field: keyof RecipeLayer, val: string) => {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onUpdateLayer(layer.id, { [field]: parsed });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card border-l border-border overflow-y-auto p-4 space-y-4 text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div>
          <span className="font-mono text-[10px] font-semibold text-foreground uppercase bg-secondary px-1.5 py-0.5 rounded border border-border">
            {layer.type}
          </span>
          <h2 className="font-semibold text-xs text-foreground mt-1">
            Layer #{layer.id}
          </h2>
        </div>
      </div>

      {/* 1. Timing */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          Timing
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Start (s)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={layer.start}
              onChange={(e) => handleNumChange('start', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">End (s)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={layer.end}
              onChange={(e) => handleNumChange('end', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Position & Transform */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-muted-foreground" />
          Position (0.0 - 1.0)
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">X Position</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={layer.x}
              onChange={(e) => handleNumChange('x', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Y Position</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={layer.y}
              onChange={(e) => handleNumChange('y', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Scale</label>
            <input
              type="number"
              step="0.1"
              value={layer.scale ?? 1}
              onChange={(e) => handleNumChange('scale', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-1.5 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Opacity</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={layer.opacity ?? 1}
              onChange={(e) => handleNumChange('opacity', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-1.5 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Rotate (°)</label>
            <input
              type="number"
              step="1"
              value={layer.rotation ?? 0}
              onChange={(e) => handleNumChange('rotation', e.target.value)}
              className="w-full bg-background border border-input rounded-md px-1.5 py-1 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Animation Presets */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          Animations
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Entrance</label>
            <select
              value={layer.in || 'fadeUp'}
              onChange={(e) => onUpdateLayer(layer.id, { in: e.target.value as AnimationPreset })}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground outline-none"
            >
              {ENTRANCE_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Exit</label>
            <select
              value={layer.out || 'fadeOut'}
              onChange={(e) => onUpdateLayer(layer.id, { out: e.target.value as AnimationPreset })}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground outline-none"
            >
              {EXIT_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Type Specific Controls */}
      {layer.type === 'text' && (
        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-muted-foreground" />
            Typography
          </h3>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Text Content</label>
            <textarea
              rows={3}
              value={(layer as any).text}
              onChange={(e) => onUpdateLayer(layer.id, { text: e.target.value } as any)}
              className="w-full bg-background border border-input rounded-md p-2 text-xs text-foreground outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Size</label>
              <input
                type="number"
                value={(layer as any).size || 52}
                onChange={(e) => onUpdateLayer(layer.id, { size: parseFloat(e.target.value) } as any)}
                className="w-full bg-background border border-input rounded-md px-1.5 py-1 text-xs font-mono text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Color</label>
              <input
                type="color"
                value={(layer as any).color || '#ffffff'}
                onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value } as any)}
                className="w-full h-7 bg-background border border-input rounded-md cursor-pointer p-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Align</label>
              <select
                value={(layer as any).align || 'center'}
                onChange={(e) => onUpdateLayer(layer.id, { align: e.target.value } as any)}
                className="w-full bg-background border border-input rounded-md px-1.5 py-1 text-xs text-foreground outline-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {layer.type === 'shape' && (
        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            Shape Options
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Kind</label>
              <select
                value={(layer as any).kind || 'rect'}
                onChange={(e) => onUpdateLayer(layer.id, { kind: e.target.value as ShapeKind } as any)}
                className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground outline-none"
              >
                {SHAPE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Color</label>
              <input
                type="color"
                value={(layer as any).color || '#35D6C0'}
                onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value } as any)}
                className="w-full h-7 bg-background border border-input rounded-md cursor-pointer p-0.5"
              />
            </div>
          </div>
        </div>
      )}

      {layer.type === 'card' && (
        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
            Code / Card
          </h3>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Title</label>
            <input
              type="text"
              value={(layer as any).title || ''}
              onChange={(e) => onUpdateLayer(layer.id, { title: e.target.value } as any)}
              className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Code / Text</label>
            <textarea
              rows={4}
              value={(layer as any).code || ''}
              onChange={(e) => onUpdateLayer(layer.id, { code: e.target.value } as any)}
              className="w-full bg-background border border-input rounded-md p-2 font-mono text-xs text-foreground outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
