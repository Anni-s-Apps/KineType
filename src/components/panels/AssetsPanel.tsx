import React, { useRef, useState } from 'react';
import { Copy, Check, Upload, Image as ImageIcon, Plus, Trash2, Sparkles } from 'lucide-react';
import { Recipe, RecipeAsset } from '../../types/recipe';

interface AssetsPanelProps {
  recipe: Recipe;
  assetsMap: Map<string, HTMLImageElement>;
  onImportAsset: (assetId: string, fileOrUrl: File | string) => void;
  onAddAssetSlot: (asset: RecipeAsset) => void;
  onRemoveAssetSlot: (assetId: string) => void;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({
  recipe,
  assetsMap,
  onImportAsset,
  onAddAssetSlot,
  onRemoveAssetSlot,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const assets = recipe.assets || [];
  const importedCount = assets.filter((a) => assetsMap.has(a.id)).length;

  const handleCopy = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileDrop = (assetId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImportAsset(assetId, file);
    }
  };

  const handleFileSelect = (assetId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportAsset(assetId, file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card border-r border-border overflow-hidden text-card-foreground">
      {/* Header & Stepper */}
      <div className="p-3.5 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            Asset Slots
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
            {importedCount} / {assets.length} imported
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Copy image prompts for Midjourney / Recraft, then drop image into slot.
        </p>
      </div>

      {/* Assets Slot List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {assets.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-lg bg-muted/20">
            <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No assets in recipe.</p>
          </div>
        ) : (
          assets.map((asset) => {
            const isImported = assetsMap.has(asset.id);
            const imgElement = assetsMap.get(asset.id);

            return (
              <div
                key={asset.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(asset.id, e)}
                className={`p-3 rounded-lg border transition-all ${
                  isImported
                    ? 'border-border bg-muted/30'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                      #{asset.id}
                    </span>
                    {asset.aspect && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                        {asset.aspect}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(asset.id, asset.prompt)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline transition-colors"
                    title="Copy prompt for AI generator"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt Text Box */}
                <div className="bg-muted/40 p-2 rounded-md border border-border text-xs text-muted-foreground font-sans leading-relaxed mb-2.5">
                  {asset.prompt}
                </div>

                {/* Slot Dropzone / Image Preview */}
                <div className="flex items-center gap-2.5">
                  {isImported && imgElement ? (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-background border border-border shrink-0">
                      <img
                        src={imgElement.src}
                        alt={asset.id}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => {
                        fileInputRefs.current[asset.id] = el;
                      }}
                      onChange={(e) => handleFileSelect(asset.id, e)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRefs.current[asset.id]?.click()}
                      className={`w-full py-1.5 px-2.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                        isImported
                          ? 'border-border hover:bg-muted text-foreground bg-background'
                          : 'border-dashed border-primary/40 bg-secondary/30 hover:bg-secondary/60 text-primary'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      {isImported ? 'Replace Image' : 'Import Image'}
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveAssetSlot(asset.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                    title="Delete Asset Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Slot Footer */}
      <div className="p-3 border-t border-border bg-card">
        <button
          onClick={() =>
            onAddAssetSlot({
              id: `asset_${Date.now().toString().slice(-4)}`,
              prompt: 'A sleek motion-graphic icon with glowing edges. Transparent background.',
              aspect: '1:1',
              transparent: true,
            })
          }
          className="w-full py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Asset Slot
        </button>
      </div>
    </div>
  );
};
