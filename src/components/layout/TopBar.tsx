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
import { ThemeSelector } from './ThemeSelector';

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
    <header className="h-11 shrink-0 border-b border-border bg-card px-3 flex items-center justify-between gap-3 select-none z-40 text-card-foreground relative overflow-visible">
      {/* Left: Brand, Project Title & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wide text-foreground hidden sm:inline">
            RecipeCut
          </span>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Project Actions: New, Open, Save */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenNewProjectModal}
            className="h-7 px-2.5 rounded-md hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            title="New Project"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2.5 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            title="Open Recipe JSON"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open</span>
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
            className="h-7 px-2.5 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            title="Save Recipe JSON (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Project Name (Editable) */}
        <div className="flex items-center shrink-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="h-7 px-2 text-xs font-medium bg-background border border-primary rounded-md outline-none text-foreground w-36"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-md text-primary shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="h-7 px-2 hover:bg-muted rounded-md text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors group shrink-0 whitespace-nowrap"
            >
              <span className="truncate max-w-[130px] sm:max-w-[180px]">{recipe.settings?.title || 'Untitled Project'}</span>
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Format Chip, Safe Area, Undo/Redo */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Format Chip (16:9 / 9:16 · 1080p · 30fps) */}
        <div className="h-7 flex items-center bg-muted/60 px-2.5 rounded-md text-xs text-foreground font-mono gap-1.5 border border-border shrink-0 whitespace-nowrap">
          <button
            onClick={() => onUpdateAspect(recipe.settings?.aspect === '16:9' ? '9:16' : '16:9')}
            className="hover:underline font-bold text-primary"
            title="Click to toggle Aspect Ratio"
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
          className={`h-7 px-2.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            showSafeAreas
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Toggle 2% Safe Area Guidelines"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Safe Area</span>
        </button>

        {/* Voiceover Audio / Video Import */}
        <button
          onClick={onOpenMediaUploadModal}
          className={`h-7 px-2.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            audioUrl
              ? 'bg-secondary text-foreground border-border font-semibold'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title={audioFile ? `Voiceover: ${audioFile.name}` : audioUrl ? 'Voiceover Ready' : 'Add Audio or Video'}
        >
          {audioUrl ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="truncate max-w-[100px] sm:max-w-[130px]">
            {audioFile ? audioFile.name : audioUrl ? 'Audio Ready' : 'Voiceover'}
          </span>
        </button>
      </div>

      {/* Right: Theme Selector & Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Multi-Theme Selector (3 Light, 2 Dark) */}
        <ThemeSelector />

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="h-7 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MP4</span>
        </button>
      </div>
    </header>
  );
};
