import React, { useState, useRef } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Volume2,
  Square,
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { exportRecipeToMp4, ExportProgress } from '../../services/export';
import { AssetMap } from '../../render/renderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  assetsMap: AssetMap;
  audioBlob: Blob | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  recipe,
  assetsMap,
  audioBlob,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const duration = recipe.settings?.duration || 10;
  const fps = recipe.settings?.fps || 30;
  const isPortrait = recipe.settings?.aspect === '9:16';
  const resolution = isPortrait ? '1080 x 1920 (9:16)' : '1920 x 1080 (16:9)';

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setDownloadUrl(null);
    abortControllerRef.current = new AbortController();

    try {
      const blob = await exportRecipeToMp4({
        recipe,
        assets: assetsMap,
        audioBlob,
        onProgress: (p) => setProgress(p),
        signal: abortControllerRef.current.signal,
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsExporting(false);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        setErrorMsg(err.message || 'Failed to export video');
      }
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${recipe.settings?.title || 'recipecut_video'}.mp4`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-card-foreground">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Export MP4 Video</h2>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-muted/30 p-3.5 rounded-lg border border-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Resolution</span>
              <span className="font-semibold text-foreground font-mono">{resolution}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Duration</span>
              <span className="font-semibold text-foreground font-mono">
                {duration.toFixed(1)}s ({Math.ceil(duration * fps)} frames)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Framerate</span>
              <span className="font-semibold text-foreground font-mono">{fps} FPS</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Audio</span>
              <span className="font-semibold text-foreground font-mono flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                {audioBlob ? 'Voiceover Synced' : 'No Audio'}
              </span>
            </div>
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="space-y-2.5 bg-muted/30 p-3.5 rounded-lg border border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  {progress.status}
                </span>
                <span className="font-mono font-bold text-primary">{progress.percent}%</span>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Frame {progress.currentFrame} / {progress.totalFrames}</span>
                <span>ETA: ~{progress.etaSeconds}s</span>
              </div>
            </div>
          )}

          {/* Download */}
          {downloadUrl && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-2.5">
              <div className="flex items-center gap-2 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Video rendered successfully!
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download MP4 File
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          {isExporting ? (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium"
              >
                Close
              </button>
              {!downloadUrl && (
                <button
                  onClick={handleStartExport}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Start Export
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
