import React, { useState, useRef } from 'react';
import {
  Volume2,
  Video,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  FileAudio,
  FileVideo,
  Download,
  Music,
} from 'lucide-react';
import { processMediaAudio, ProcessedAudioResult } from '../../services/audio-extractor';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioReady: (result: ProcessedAudioResult) => void;
  currentAudioName?: string | null;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onAudioReady,
  currentAudioName,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [lastResult, setLastResult] = useState<ProcessedAudioResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setLastResult(null);
    try {
      const result = await processMediaAudio(file, (msg) => setStatusMsg(msg));
      setLastResult(result);
      setIsProcessing(false);
      onAudioReady(result);
    } catch (err: any) {
      alert(`Error processing media: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownloadExtractedAudio = () => {
    if (!lastResult) return;
    const a = document.createElement('a');
    a.href = lastResult.audioUrl;
    a.download = `${lastResult.fileName.replace(/\.[^/.]+$/, '')}_extracted.wav`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-card-foreground">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Import Voiceover (Audio or Video)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Drop an <strong>audio file</strong> (MP3, WAV, M4A) or a <strong>video file</strong> (MP4, MOV, WebM). Video audio tracks are automatically extracted in-browser.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col items-center text-center space-y-1">
              <FileAudio className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Direct Audio</span>
              <span className="text-[10px] text-muted-foreground">.mp3, .wav, .m4a, .aac</span>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col items-center text-center space-y-1">
              <FileVideo className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-foreground">Extract from Video</span>
              <span className="text-[10px] text-muted-foreground">.mp4, .mov, .webm</span>
            </div>
          </div>

          {/* Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-7 rounded-lg border-2 border-dashed cursor-pointer text-center space-y-2.5 transition-all ${
              isProcessing
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.mp3,.wav,.m4a,.aac,.ogg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />

            {isProcessing ? (
              <div className="space-y-1.5">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                <p className="text-xs font-semibold text-foreground">{statusMsg || 'Processing...'}</p>
                <p className="text-[11px] text-muted-foreground">Decoding audio in browser...</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-foreground">
                  Click to select or drop Audio / Video file here
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Processes 100% locally on your computer.
                </p>
              </div>
            )}
          </div>

          {/* Result Banner */}
          {lastResult && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4" />
                {lastResult.isExtractedFromVideo
                  ? `Extracted from video: ${lastResult.fileName}`
                  : `Loaded: ${lastResult.fileName}`}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                Duration: {lastResult.duration}s · {lastResult.sampleRate}Hz
              </div>
              {lastResult.isExtractedFromVideo && (
                <button
                  onClick={handleDownloadExtractedAudio}
                  className="text-xs font-medium hover:underline flex items-center gap-1 mt-1 text-foreground"
                >
                  <Download className="w-3 h-3" />
                  Download extracted WAV
                </button>
              )}
            </div>
          )}

          {currentAudioName && !lastResult && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
              <Music className="w-3.5 h-3.5 text-primary" />
              Active: <span className="text-foreground">{currentAudioName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
          >
            {lastResult ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
