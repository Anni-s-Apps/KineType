import React, { useRef, useState } from 'react';
import {
  RotateCcw,
  RotateCw,
  Download,
  FolderOpen,
  Save,
  Volume2,
  VolumeX,
  Eye,
  Sun,
  Moon,
  Plus,
  Edit2,
  Check,
  Film,
} from 'lucide-react';
import { Recipe } from '../../types/recipe';

interface TopBarProps {
  recipe: Recipe;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onOpenExportModal: () => void;
  onOpenNewProjectModal: () => void;
  showSafeAreas: boolean;
  onToggleSafeAreas: () => void;
  audioFile: File | null;
  audioUrl: string | null;
  onAudioUpload: (file: File | null) => void;
  onOpenMediaUploadModal: () => void;
  onUpdateAspect: (aspect: '16:9' | '9:16') => void;
  onUpdateTitle: (title: string) => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  recipe,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onOpenRecipe,
  onOpenExportModal,
  onOpenNewProjectModal,
  showSafeAreas,
  onToggleSafeAreas,
  audioFile,
  audioUrl,
  onOpenMediaUploadModal,
  onUpdateAspect,
  onUpdateTitle,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(recipe.settings?.title || 'Untitled Project');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onOpenRecipe(parsed);
      } catch {
        alert('Invalid recipe JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
  };

  return (
    <header className="h-10 shrink-0 border-b border-border bg-card px-3 flex items-center justify-between select-none z-30 text-card-foreground">
      {/* Left: Brand, Project Title & Actions */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-foreground">
            RecipeCut
          </span>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Project Actions: New, Open, Save */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewProjectModal}
            className="h-6 px-2 rounded-md hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 transition-colors"
            title="New Project"
          >
            <Plus className="w-3 h-3" />
            New
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-6 px-2 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Open Recipe JSON"
          >
            <FolderOpen className="w-3 h-3" />
            Open
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={onSave}
            className="h-6 px-2 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Save Recipe JSON (Ctrl+S)"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Project Name (Editable) */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="h-6 px-1.5 text-xs font-medium bg-background border border-primary rounded outline-none text-foreground"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-0.5 hover:bg-muted rounded text-primary"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="h-6 px-1.5 hover:bg-muted rounded text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors group"
            >
              <span className="truncate max-w-[150px]">{recipe.settings?.title || 'Untitled Project'}</span>
              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Format Chip, Safe Area, Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Format Chip (16:9 / 9:16 · 1080p · 30fps) */}
        <div className="flex items-center bg-muted/60 px-2 py-0.5 rounded text-xs text-foreground font-mono gap-1 border border-border">
          <button
            onClick={() => onUpdateAspect(recipe.settings?.aspect === '16:9' ? '9:16' : '16:9')}
            className="hover:underline font-semibold"
            title="Toggle Aspect Ratio"
          >
            {recipe.settings?.aspect || '16:9'}
          </button>
          <span className="text-muted-foreground">·</span>
          <span>1080p</span>
          <span className="text-muted-foreground">·</span>
          <span>{recipe.settings?.fps || 30}fps</span>
        </div>

        {/* Safe Area Guide Toggle */}
        <button
          onClick={onToggleSafeAreas}
          className={`h-6 px-2 rounded text-xs font-medium border transition-colors flex items-center gap-1 ${
            showSafeAreas
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Toggle 2% Safe Area Guidelines"
        >
          <Eye className="w-3 h-3" />
          Safe Area
        </button>

        {/* Voiceover Audio / Video Import */}
        <button
          onClick={onOpenMediaUploadModal}
          className={`h-6 px-2 rounded text-xs font-medium border transition-colors flex items-center gap-1 ${
            audioUrl
              ? 'bg-secondary text-foreground border-border font-semibold'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title={audioFile ? `Voiceover: ${audioFile.name}` : audioUrl ? 'Voiceover Ready' : 'Add Audio or Video'}
        >
          {audioUrl ? <Volume2 className="w-3 h-3 text-emerald-500" /> : <VolumeX className="w-3 h-3" />}
          <span className="truncate max-w-[110px]">
            {audioFile ? audioFile.name : audioUrl ? 'Audio Ready' : 'Voiceover'}
          </span>
        </button>
      </div>

      {/* Right: Theme Toggle & Export */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors border border-border"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="h-6.5 px-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-3 h-3" />
          Export MP4
        </button>
      </div>
    </header>
  );
};
