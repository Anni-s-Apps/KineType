import React, { useState } from 'react';
import {
  Plus,
  X,
  FileAudio,
  FileVideo,
  FileText,
  LayoutTemplate,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { SAMPLE_RECIPES } from '../../recipe/samples';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (recipe: Recipe) => void;
  onOpenAudioUpload: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onOpenAudioUpload,
}) => {
  if (!isOpen) return null;

  const handleStartBlank = (aspect: '16:9' | '9:16') => {
    const blankRecipe: Recipe = {
      version: 1,
      settings: {
        aspect,
        fps: 30,
        duration: 15.0,
        title: 'Untitled Project',
      },
      scene: {
        bg: '#09090b',
        accent: '#27272a',
        vignette: 0.3,
        grid: false,
      },
      assets: [],
      camera: [{ start: 0, end: 15.0, x: 0.5, y: 0.5, zoom: 1.0 }],
      layers: [
        {
          id: 'title',
          type: 'text',
          text: 'Add Your Headline Here',
          start: 0.5,
          end: 5.0,
          x: 0.5,
          y: 0.5,
          size: 64,
          weight: 700,
          color: '#ffffff',
          align: 'center',
          in: 'fadeUp',
          out: 'fadeOut',
          z: 1,
        },
      ],
    };
    onCreateProject(blankRecipe);
    onClose();
  };

  const handleApplyTemplate = (key: string) => {
    const tpl = SAMPLE_RECIPES[key] || SAMPLE_RECIPES.developerIntro;
    onCreateProject(tpl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-card-foreground">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Create New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Choose how you would like to start your motion graphics video:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Blank 16:9 */}
            <button
              onClick={() => handleStartBlank('16:9')}
              className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 text-left transition-all space-y-2 flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-foreground group-hover:text-primary">
                <LayoutTemplate className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Blank 16:9 (Landscape)</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">YouTube & Presentations (1920x1080)</p>
              </div>
            </button>

            {/* Blank 9:16 */}
            <button
              onClick={() => handleStartBlank('9:16')}
              className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 text-left transition-all space-y-2 flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-foreground group-hover:text-primary">
                <LayoutTemplate className="w-4 h-4 rotate-90" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Blank 9:16 (Vertical)</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Shorts, Reels & TikTok (1080x1920)</p>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Quick Start from Voiceover Audio or Video
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenAudioUpload();
              }}
              className="w-full p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-background flex items-center justify-center text-primary">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Import Voiceover (Audio or Video)</div>
                  <div className="text-[11px] text-muted-foreground">Auto-extract audio track & sync timeline</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Or Start from Sample Recipe
            </span>
            <button
              onClick={() => handleApplyTemplate('developerIntro')}
              className="w-full p-3 rounded-lg border border-border bg-background hover:bg-muted text-left transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="text-xs font-medium text-foreground">Developer Journey (Motion Graphics Demo)</div>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">18s · 16:9</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
