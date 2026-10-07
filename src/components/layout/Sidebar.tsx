import React, { useState, useRef, useEffect } from 'react';
import {
  FileVideo,
  Music,
  Mic,
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
import { TranscribePanel } from '../panels/TranscribePanel';

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
  audioBlob?: Blob | null;
  activeSrtText?: string;
  onSrtTextChange?: (text: string) => void;
}

type TabKey = 'transcribe' | 'assets' | 'layers' | 'prompt-builder' | 'templates';

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
  audioBlob,
  activeSrtText,
  onSrtTextChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey | null>('assets');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(270);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(270);

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

  // Resizable sidebar width handlers (min: 220px, max: 420px)
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(220, Math.min(420, resizeStartWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <aside className="flex h-full min-h-0 bg-card border-r border-border shrink-0 select-none z-20 text-card-foreground relative">
      {/* ── Leftmost Icon Tool Strip (w-12) ────────────────────────── */}
      <div className="w-12 h-full flex flex-col items-center py-3 bg-card border-r border-border shrink-0 gap-2.5">
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
              ? 'bg-secondary text-foreground font-semibold border border-border'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title={audioFile ? `Audio: ${audioFile.name}` : 'Import Audio or Video'}
        >
          <Music className="w-4 h-4" />
          {audioUrl && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-card" />
          )}
        </button>

        {/* AI Audio Transcriber Tab */}
        <button
          onClick={() => handleTabClick('transcribe')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            isExpanded && activeTab === 'transcribe'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="AI Audio Transcriber (Whisper / Timed SRT)"
        >
          <Mic className="w-4 h-4" />
          {audioUrl && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </button>

        <div className="w-6 h-px bg-border my-0.5" />

        {/* Assets Tab */}
        <button
          onClick={() => handleTabClick('assets')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            isExpanded && activeTab === 'assets'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Asset Slots"
        >
          <ImageIcon className="w-4 h-4" />
          {assets.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-mono font-bold flex items-center justify-center shadow-xs ring-1 ring-card ${
                isExpanded && activeTab === 'assets'
                  ? 'bg-card text-foreground border border-border'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              {importedCount}/{assets.length}
            </span>
          )}
        </button>

        {/* Layers Tab */}
        <button
          onClick={() => handleTabClick('layers')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors relative ${
            isExpanded && activeTab === 'layers'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Layers"
        >
          <Sliders className="w-4 h-4" />
          {layers.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-mono font-bold flex items-center justify-center shadow-xs ring-1 ring-card ${
                isExpanded && activeTab === 'layers'
                  ? 'bg-card text-foreground border border-border'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              {layers.length}
            </span>
          )}
        </button>

        {/* Prompt Builder Tab */}
        <button
          onClick={() => handleTabClick('prompt-builder')}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            isExpanded && activeTab === 'prompt-builder'
              ? 'bg-primary text-primary-foreground shadow-xs'
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
              ? 'bg-primary text-primary-foreground shadow-xs'
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

      {/* ── Expandable & Resizable Content Area ────────────────────── */}
      {isExpanded && activeTab && (
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="h-full flex flex-col bg-card overflow-hidden transition-none relative"
        >
          {activeTab === 'transcribe' && (
            <TranscribePanel
              audioFile={audioFile}
              audioUrl={audioUrl}
              audioBlob={audioBlob || null}
              onOpenAudioUpload={onOpenAudioUpload}
              onSendToPromptBuilder={(srt) => {
                if (onSrtTextChange) onSrtTextChange(srt);
                setActiveTab('prompt-builder');
                setIsExpanded(true);
              }}
              audioDuration={recipe.settings?.duration || 15}
            />
          )}

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
              srtText={activeSrtText}
              onSrtTextChange={onSrtTextChange}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesPanel
              currentRecipe={recipe}
              onApplyTemplate={onApplyRecipe}
            />
          )}

          {/* ── Right Vertical Resize Handle ───────────────────────── */}
          <div
            onMouseDown={handleResizeMouseDown}
            className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-colors z-30 ${
              isResizing ? 'bg-primary' : 'bg-transparent hover:bg-primary/60'
            }`}
            title="Drag left/right to resize sidebar panel (220px - 420px)"
          />
        </div>
      )}
    </aside>
  );
};
