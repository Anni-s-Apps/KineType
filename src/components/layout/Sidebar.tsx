import React, { useState } from 'react';
import {
  FileVideo,
  Music,
  Layers,
  Sliders,
  Sparkles,
  Tv,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { AssetsPanel } from '../panels/AssetsPanel';
import { LayersPanel } from '../panels/LayersPanel';
import { PromptBuilderPanel } from '../panels/PromptBuilderPanel';
import { TemplatesPanel } from '../panels/TemplatesPanel';

interface SidebarProps {
  recipe: Recipe;
  assetsMap: Map<string, HTMLImageElement>;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: any) => void;
  onDuplicateLayer: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onAddLayer: (layer: any) => void;
  onImportAsset: (assetId: string, fileOrUrl: File | string) => void;
  onAddAssetSlot: (asset: any) => void;
  onRemoveAssetSlot: (assetId: string) => void;
  onApplyRecipe: (recipe: Recipe) => void;
  onOpenAudioUpload: () => void;
  onOpenNewProject: () => void;
  audioFile: File | null;
  audioUrl: string | null;
}

type TabKey = 'assets' | 'layers' | 'prompt-builder' | 'templates';

export const Sidebar: React.FC<SidebarProps> = ({
  recipe,
  assetsMap,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onRemoveLayer,
  onAddLayer,
  onImportAsset,
  onAddAssetSlot,
  onRemoveAssetSlot,
  onApplyRecipe,
  onOpenAudioUpload,
  onOpenNewProject,
  audioFile,
  audioUrl,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey | null>('assets');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const assets = recipe.assets || [];
  const layers = recipe.layers || [];
  const importedCount = assets.filter((a) => assetsMap.has(a.id)).length;

  const handleTabClick = (tab: TabKey) => {
    if (activeTab === tab && isExpanded) {
      setIsExpanded(false);
    } else {
      setActiveTab(tab);
      setIsExpanded(true);
    }
  };

  return (
    <aside className="flex h-full min-h-0 bg-card border-r border-border shrink-0 select-none z-20 text-card-foreground">
      {/* ── Leftmost Icon Tool Strip (w-12) ────────────────────────── */}
      <div className="w-12 h-full flex flex-col items-center py-2.5 bg-card border-r border-border shrink-0 gap-1.5">
        {/* New Project */}
        <button
          onClick={onOpenNewProject}
          className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Audio / Video Import */}
        <button
          onClick={onOpenAudioUpload}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            audioUrl
              ? 'bg-secondary text-foreground font-semibold'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title={audioFile ? `Audio: ${audioFile.name}` : 'Import Audio or Video'}
        >
          <Music className="w-4 h-4" />
          {audioUrl && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </button>

        <div className="w-6 h-px bg-border my-1" />

        {/* Assets Tab */}
        <button
          onClick={() => handleTabClick('assets')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            isExpanded && activeTab === 'assets'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Asset Slots"
        >
          <ImageIcon className="w-4 h-4" />
          {assets.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-full bg-muted text-[8px] font-mono border border-border">
              {importedCount}/{assets.length}
            </span>
          )}
        </button>

        {/* Layers Tab */}
        <button
          onClick={() => handleTabClick('layers')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            isExpanded && activeTab === 'layers'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Layers"
        >
          <Sliders className="w-4 h-4" />
          {layers.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-full bg-muted text-[8px] font-mono border border-border">
              {layers.length}
            </span>
          )}
        </button>

        {/* Prompt Builder Tab */}
        <button
          onClick={() => handleTabClick('prompt-builder')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isExpanded && activeTab === 'prompt-builder'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Prompt Builder & SRT Chunker"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Templates Tab */}
        <button
          onClick={() => handleTabClick('templates')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isExpanded && activeTab === 'templates'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Templates"
        >
          <Tv className="w-4 h-4" />
        </button>

        {/* Bottom Collapse Toggle */}
        <div className="mt-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Expandable Content Area (w-76) ────────────────────────── */}
      {isExpanded && activeTab && (
        <div className="w-76 h-full flex flex-col bg-card overflow-hidden transition-all duration-100">
          {activeTab === 'assets' && (
            <AssetsPanel
              recipe={recipe}
              assetsMap={assetsMap}
              onImportAsset={onImportAsset}
              onAddAssetSlot={onAddAssetSlot}
              onRemoveAssetSlot={onRemoveAssetSlot}
            />
          )}

          {activeTab === 'layers' && (
            <LayersPanel
              recipe={recipe}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              onUpdateLayer={onUpdateLayer}
              onDuplicateLayer={onDuplicateLayer}
              onRemoveLayer={onRemoveLayer}
              onAddLayer={onAddLayer}
            />
          )}

          {activeTab === 'prompt-builder' && (
            <PromptBuilderPanel
              recipe={recipe}
              onApplyMergedRecipe={onApplyRecipe}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesPanel
              currentRecipe={recipe}
              onApplyTemplate={onApplyRecipe}
            />
          )}
        </div>
      )}
    </aside>
  );
};
