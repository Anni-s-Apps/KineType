import React from 'react';
import {
  Type,
  Image as ImageIcon,
  Square,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react';
import { Recipe, RecipeLayer } from '../../types/recipe';

interface LayersPanelProps {
  recipe: Recipe;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
  onDuplicateLayer: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onAddLayer: (layer: RecipeLayer) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  recipe,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onRemoveLayer,
  onAddLayer,
}) => {
  const layers = recipe.layers || [];

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-amber-500" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Square className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getLayerLabel = (layer: RecipeLayer) => {
    if (layer.type === 'text') return (layer as any).text?.slice(0, 24) || 'Text Layer';
    if (layer.type === 'image') return `Image [${(layer as any).asset}]`;
    if (layer.type === 'shape') return `Shape (${(layer as any).kind})`;
    if (layer.type === 'card') return (layer as any).title || 'Code / Card';
    return (layer as any)?.id || 'Layer';
  };

  const handleAddNewText = () => {
    const newLayer: RecipeLayer = {
      id: `text_${Date.now().toString().slice(-4)}`,
      type: 'text',
      text: 'New Motion Text',
      start: 0,
      end: 4.0,
      x: 0.5,
      y: 0.5,
      size: 54,
      weight: 700,
      color: '#FFFFFF',
      align: 'center',
      in: 'fadeUp',
      out: 'fadeOut',
      z: (layers.length || 0) + 1,
    };
    onAddLayer(newLayer);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card border-r border-border overflow-hidden text-card-foreground">
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xs text-foreground">Scene Layers</h2>
          <p className="text-[11px] text-muted-foreground">{layers.length} active elements</p>
        </div>
        <button
          onClick={handleAddNewText}
          className="h-7 px-2.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Text
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {layers.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">No layers in recipe.</div>
        ) : (
          [...layers].reverse().map((layer) => {
            const isSelected = selectedLayerId === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-primary bg-secondary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                {/* Layer Icon & Title */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1 rounded bg-muted/60 border border-border">
                    {getLayerIcon(layer.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">#{layer.id}</span>
                      <span className="truncate">{getLayerLabel(layer)}</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {layer.start.toFixed(1)}s → {layer.end.toFixed(1)}s
                    </div>
                  </div>
                </div>

                {/* Layer Controls */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateLayer(layer.id, { hidden: !layer.hidden })}
                    className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title={layer.hidden ? 'Show Layer' : 'Hide Layer'}
                  >
                    {layer.hidden ? <EyeOff className="w-3.5 h-3.5 text-destructive" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onDuplicateLayer(layer.id)}
                    className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title="Duplicate Layer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveLayer(layer.id)}
                    className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
