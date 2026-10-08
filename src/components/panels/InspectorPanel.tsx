import React from 'react';
import {
  Sliders,
  Clock,
  Move,
  Sparkles,
  Palette,
  Type,
  Code2,
  Maximize2,
  Sun,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Recipe, RecipeLayer, AnimationPreset, ShapeKind } from '../../types/recipe';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';

interface InspectorPanelProps {
  recipe: Recipe;
  selectedLayerId: string | null;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
}

const ENTRANCE_OPTIONS: SelectOption[] = [
  { value: 'fadeUp', label: 'Fade Up (Smooth upward entrance)' },
  { value: 'fadeDown', label: 'Fade Down (Downward entrance)' },
  { value: 'scaleIn', label: 'Scale In (Zoom pop in)' },
  { value: 'popIn', label: 'Pop In (Spring pop)' },
  { value: 'bounceIn', label: 'Bounce In (Bouncy entrance)' },
  { value: 'blurIn', label: 'Blur In (Defocus to crisp)' },
  { value: 'slideL', label: 'Slide Left' },
  { value: 'slideR', label: 'Slide Right' },
  { value: 'typeOn', label: 'Type On (Typewriter effect)' },
  { value: 'wordIn', label: 'Word In (Word by word)' },
  { value: 'charFade', label: 'Char Fade (Character glow)' },
  { value: 'zoomRotateIn', label: 'Zoom Rotate In' },
  { value: 'none', label: 'None (Instant cut)' },
];

const EXIT_OPTIONS: SelectOption[] = [
  { value: 'fadeOut', label: 'Fade Out (Smooth opacity fade)' },
  { value: 'scaleOut', label: 'Scale Out (Shrink fade out)' },
  { value: 'fadeDownOut', label: 'Fade Down Out' },
  { value: 'slideOutL', label: 'Slide Out Left' },
  { value: 'slideOutR', label: 'Slide Out Right' },
  { value: 'none', label: 'None (Instant cut)' },
];

const ALIGN_OPTIONS: SelectOption[] = [
  { value: 'left', label: 'Left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { value: 'center', label: 'Center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
  { value: 'right', label: 'Right', icon: <AlignRight className="w-3.5 h-3.5" /> },
];

const SHAPE_OPTIONS: SelectOption[] = [
  { value: 'rect', label: 'Rounded Rectangle' },
  { value: 'pill', label: 'Pill / Capsule' },
  { value: 'circle', label: 'Filled Circle' },
  { value: 'ring', label: 'Stroked Ring' },
  { value: 'line', label: 'Straight Line' },
  { value: 'arrow', label: 'Directional Arrow' },
  { value: 'check', label: 'Checkmark Icon' },
  { value: 'cross', label: 'Cross (X) Icon' },
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  recipe,
  selectedLayerId,
  onUpdateLayer,
}) => {
  const layer = recipe.layers?.find((l) => l.id === selectedLayerId);

  if (!layer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-card h-full">
        <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mb-2 text-muted-foreground">
          <Sliders className="w-5 h-5 opacity-60" />
        </div>
        <p className="text-xs font-medium text-foreground">No Layer Selected</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
          Click any element on the canvas or timeline to inspect and edit its properties.
        </p>
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
    <div className="flex-1 flex flex-col h-full bg-card overflow-y-auto p-4 space-y-4 text-card-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* ── Layer Title Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shadow-2xs">
            {layer.type}
          </span>
          <h2 className="font-bold text-xs text-foreground truncate max-w-[170px]">
            #{layer.id}
          </h2>
        </div>
      </div>

      {/* ── 1. Timing Section ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            Timing
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            {((layer.end || 0) - (layer.start || 0)).toFixed(1)}s duration
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Start (s)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={layer.start}
              onChange={(e) => handleNumChange('start', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              End (s)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={layer.end}
              onChange={(e) => handleNumChange('end', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Position & Transform Section ────────────────────────── */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-muted-foreground" />
          Position & Transform
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              X Position (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={layer.x}
              onChange={(e) => handleNumChange('x', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Y Position (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={layer.y}
              onChange={(e) => handleNumChange('y', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Scale
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={layer.scale ?? 1}
              onChange={(e) => handleNumChange('scale', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Opacity
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={layer.opacity ?? 1}
              onChange={(e) => handleNumChange('opacity', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Rotate (°)
            </label>
            <input
              type="number"
              step="5"
              value={layer.rotation ?? 0}
              onChange={(e) => handleNumChange('rotation', e.target.value)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Animation Presets (Custom Select Dropdowns) ──────────── */}
      <div className="space-y-2 pt-1 border-t border-border">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 pt-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          Motion Animations
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Entrance
            </label>
            <CustomSelect
              value={layer.in || 'fadeUp'}
              onChange={(val) => onUpdateLayer(layer.id, { in: val as AnimationPreset })}
              options={ENTRANCE_OPTIONS}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Exit
            </label>
            <CustomSelect
              value={layer.out || 'fadeOut'}
              onChange={(val) => onUpdateLayer(layer.id, { out: val as AnimationPreset })}
              options={EXIT_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Type Specific Controls ──────────────────────────────── */}
      {layer.type === 'text' && (
        <div className="space-y-2.5 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-muted-foreground" />
            Typography
          </h3>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Text Content
            </label>
            <textarea
              rows={3}
              value={(layer as any).text || ''}
              onChange={(e) => onUpdateLayer(layer.id, { text: e.target.value } as any)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs resize-none font-medium leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Size (px)
              </label>
              <input
                type="number"
                value={(layer as any).size || 52}
                onChange={(e) => onUpdateLayer(layer.id, { size: parseFloat(e.target.value) } as any)}
                className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5 h-8 bg-background border border-border rounded-lg px-2 shadow-2xs">
                <input
                  type="color"
                  value={(layer as any).color || '#ffffff'}
                  onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value } as any)}
                  className="w-4 h-4 rounded-full border border-border cursor-pointer p-0 bg-transparent shrink-0"
                />
                <span className="font-mono text-[10px] text-muted-foreground uppercase truncate">
                  {((layer as any).color || '#ffffff').slice(0, 7)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs">
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Text Alignment
            </label>
            <div className="grid grid-cols-3 gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
              {(['left', 'center', 'right'] as const).map((alignVal) => {
                const isSelected = ((layer as any).align || 'center') === alignVal;
                return (
                  <button
                    key={alignVal}
                    type="button"
                    onClick={() => onUpdateLayer(layer.id, { align: alignVal } as any)}
                    className={`h-7 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer capitalize ${
                      isSelected
                        ? 'bg-card text-foreground font-semibold shadow-xs border border-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {alignVal === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                    {alignVal === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                    {alignVal === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    <span>{alignVal}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {layer.type === 'shape' && (
        <div className="space-y-2.5 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            Shape Options
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Shape Kind
              </label>
              <CustomSelect
                value={(layer as any).kind || 'rect'}
                onChange={(val) => onUpdateLayer(layer.id, { kind: val as ShapeKind } as any)}
                options={SHAPE_OPTIONS}
              />
            </div>

            <div className="w-28 shrink-0">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Fill Color
              </label>
              <div className="flex items-center gap-1.5 h-8 bg-background border border-border rounded-lg px-2 shadow-2xs">
                <input
                  type="color"
                  value={(layer as any).color || '#35D6C0'}
                  onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value } as any)}
                  className="w-4 h-4 rounded-full border border-border cursor-pointer p-0 bg-transparent shrink-0"
                />
                <span className="font-mono text-[10px] text-muted-foreground uppercase truncate">
                  {((layer as any).color || '#35D6C0').slice(0, 7)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {layer.type === 'card' && (
        <div className="space-y-2.5 border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
            Code / Card
          </h3>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Title
            </label>
            <input
              type="text"
              value={(layer as any).title || ''}
              onChange={(e) => onUpdateLayer(layer.id, { title: e.target.value } as any)}
              className="w-full h-8 bg-background border border-border rounded-lg px-2.5 text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Code Snippet / Content
            </label>
            <textarea
              rows={4}
              value={(layer as any).code || ''}
              onChange={(e) => onUpdateLayer(layer.id, { code: e.target.value } as any)}
              className="w-full bg-background border border-border rounded-lg p-2.5 font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
