import React, { useState, useEffect } from 'react';
import { useProjectState } from './store/useProjectStore';
import { useTheme } from './hooks/useTheme';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { CanvasPlayer } from './components/preview/CanvasPlayer';
import { Timeline } from './components/timeline/Timeline';
import { ExportModal } from './components/modals/ExportModal';
import { MediaUploadModal } from './components/modals/MediaUploadModal';
import { NewProjectModal } from './components/modals/NewProjectModal';

export const App: React.FC = () => {
  const store = useProjectState();
  useTheme();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMediaUploadModalOpen, setIsMediaUploadModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeSrtText, setActiveSrtText] = useState<string>('');

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          store.saveProject();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        store.togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        store.seekTo(store.currentTime - 1 / (store.recipe.settings?.fps || 30));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        store.seekTo(store.currentTime + 1 / (store.recipe.settings?.fps || 30));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        store.saveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans select-none">
      {/* ── 1. Slim Top Navigation Bar ──────────────────────────────── */}
      <TopBar
        recipe={store.recipe}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        onUndo={store.undo}
        onRedo={store.redo}
        onSave={store.saveProject}
        onOpenRecipe={(rec) => store.setRecipe(rec)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        showSafeAreas={store.showSafeAreas}
        onToggleSafeAreas={() => store.setShowSafeAreas(!store.showSafeAreas)}
        audioFile={store.audioFile}
        audioUrl={store.audioUrl}
        onAudioUpload={store.setAudioFile}
        onOpenMediaUploadModal={() => setIsMediaUploadModalOpen(true)}
        onUpdateAspect={(aspect) =>
          store.setRecipe({
            ...store.recipe,
            settings: { ...store.recipe.settings, aspect },
          })
        }
        onUpdateTitle={(title) =>
          store.setRecipe({
            ...store.recipe,
            settings: { ...store.recipe.settings, title },
          })
        }
      />

      {/* ── 2. Main Studio Workspace Layout ─────────────────────────── */}
      <div className="flex flex-1 flex-row min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Full Height: Icon Strip + Expandable Panel) */}
        <Sidebar
          recipe={store.recipe}
          assetsMap={store.assetsMap}
          selectedLayerId={store.selectedLayerId}
          onSelectLayer={store.setSelectedLayerId}
          onUpdateLayer={store.updateLayer}
          onDuplicateLayer={store.duplicateLayer}
          onRemoveLayer={store.removeLayer}
          onAddLayer={store.addLayer}
          onImportAsset={store.importAsset}
          onAddAssetSlot={(asset) =>
            store.setRecipe({
              ...store.recipe,
              assets: [...(store.recipe.assets || []), asset],
            })
          }
          onRemoveAssetSlot={(assetId) =>
            store.setRecipe({
              ...store.recipe,
              assets: (store.recipe.assets || []).filter((a) => a.id !== assetId),
            })
          }
          onApplyRecipe={(rec) => store.setRecipe(rec)}
          onOpenAudioUpload={() => setIsMediaUploadModalOpen(true)}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          audioFile={store.audioFile}
          audioUrl={store.audioUrl}
          audioBlob={store.audioBlob}
          activeSrtText={activeSrtText}
          onSrtTextChange={setActiveSrtText}
        />

        {/* Center Workspace (Canvas Top + Timeline Bottom) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          <CanvasPlayer
            recipe={store.recipe}
            assets={store.assetsMap}
            currentTime={store.currentTime}
            isPlaying={store.isPlaying}
            onTogglePlay={store.togglePlay}
            onSeek={store.seekTo}
            previewQuality={store.previewQuality}
            onChangeQuality={store.setPreviewQuality}
            showSafeAreas={store.showSafeAreas}
            audioUrl={store.audioUrl}
            audioElementRef={store.audioElementRef}
            selectedLayerId={store.selectedLayerId}
            onSelectLayer={store.setSelectedLayerId}
            onUpdateLayer={store.updateLayer}
            onDuplicateLayer={store.duplicateLayer}
            onRemoveLayer={store.removeLayer}
          />

          <Timeline
            recipe={store.recipe}
            currentTime={store.currentTime}
            onSeek={store.seekTo}
            isPlaying={store.isPlaying}
            onTogglePlay={store.togglePlay}
            selectedLayerId={store.selectedLayerId}
            onSelectLayer={store.setSelectedLayerId}
            onUpdateLayer={store.updateLayer}
            onDuplicateLayer={store.duplicateLayer}
            onRemoveLayer={store.removeLayer}
            onAddLayer={store.addLayer}
            audioFile={store.audioFile}
            audioUrl={store.audioUrl}
          />
        </div>

        {/* Right Panel (Full Height: Inspector + Code JSON tabs) */}
        <RightPanel
          recipe={store.recipe}
          recipeJsonText={store.recipeJsonText}
          onChangeJsonText={store.setRecipeJsonText}
          validation={store.validation}
          onApplyJson={store.applyJsonCode}
          selectedLayerId={store.selectedLayerId}
          onUpdateLayer={store.updateLayer}
        />
      </div>

      {/* ── 3. Modals ───────────────────────────────────────────────── */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        recipe={store.recipe}
        assetsMap={store.assetsMap}
        audioBlob={store.audioBlob}
      />

      <MediaUploadModal
        isOpen={isMediaUploadModalOpen}
        onClose={() => setIsMediaUploadModalOpen(false)}
        onAudioReady={(res) => store.setProcessedAudio(res)}
        currentAudioName={store.audioFile?.name}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(rec) => store.setRecipe(rec)}
        onOpenAudioUpload={() => setIsMediaUploadModalOpen(true)}
      />
    </div>
  );
};
