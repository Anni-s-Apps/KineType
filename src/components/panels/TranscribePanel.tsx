import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Key,
  ExternalLink,
  FileText,
  Volume2,
  VolumeX,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  transcribeWithGroq,
  transcribeWithOpenAI,
  transcribeWithBrowserSpeech,
  TranscriptionResult,
  TranscriptCue,
  formatSrtTime,
} from '../../services/transcription';
import { CustomSelect } from '../ui/CustomSelect';

interface TranscribePanelProps {
  audioFile: File | null;
  audioUrl: string | null;
  audioBlob: Blob | null;
  onOpenAudioUpload: () => void;
  onSendToPromptBuilder: (srtText: string) => void;
  audioDuration?: number;
}

type TranscribeEngine = 'groq' | 'openai' | 'browser';

export const TranscribePanel: React.FC<TranscribePanelProps> = ({
  audioFile,
  audioUrl,
  audioBlob,
  onOpenAudioUpload,
  onSendToPromptBuilder,
  audioDuration = 15,
}) => {
  const [engine, setEngine] = useState<TranscribeEngine>('groq');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('recipecut_groq_key') || '';
  });
  const [showKey, setShowKey] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'srt' | 'cues'>('srt');

  // Mini Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Load saved keys based on engine
  useEffect(() => {
    if (engine === 'groq') {
      setApiKey(localStorage.getItem('recipecut_groq_key') || '');
    } else if (engine === 'openai') {
      setApiKey(localStorage.getItem('recipecut_openai_key') || '');
    }
  }, [engine]);

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    if (engine === 'groq') {
      localStorage.setItem('recipecut_groq_key', newKey.trim());
    } else if (engine === 'openai') {
      localStorage.setItem('recipecut_openai_key', newKey.trim());
    }
  };

  const handleToggleAudio = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingAudio) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPreviewRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleStartTranscribe = async () => {
    setErrorMsg(null);

    if (!audioUrl && !audioBlob && !audioFile) {
      setErrorMsg('No audio loaded. Please import an audio or video file first.');
      return;
    }

    if ((engine === 'groq' || engine === 'openai') && !apiKey.trim()) {
      setErrorMsg(`Please enter your ${engine === 'groq' ? 'Groq' : 'OpenAI'} API key below.`);
      return;
    }

    try {
      setIsTranscribing(true);
      setProgressMsg('Preparing audio file & model...');

      let targetBlob: Blob | File | null = audioBlob || audioFile;

      // If we only have audioUrl, fetch blob
      if (!targetBlob && audioUrl) {
        setProgressMsg('Fetching audio buffer...');
        const response = await fetch(audioUrl);
        targetBlob = await response.blob();
      }

      if (!targetBlob && engine !== 'browser') {
        throw new Error('Could not access audio data.');
      }

      let res: TranscriptionResult;

      if (engine === 'groq') {
        setProgressMsg('Transcribing with Groq Whisper-large-v3 (~2 seconds)...');
        res = await transcribeWithGroq(targetBlob!, apiKey);
      } else if (engine === 'openai') {
        setProgressMsg('Transcribing with OpenAI Whisper-1...');
        res = await transcribeWithOpenAI(targetBlob!, apiKey);
      } else {
        setProgressMsg('Listening with Browser Speech Recognition...');
        res = await transcribeWithBrowserSpeech(audioUrl!, audioDuration);
      }

      setResult(res);
      setProgressMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transcription failed. Please check your API key.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopySrt = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.srtContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSrt = () => {
    if (!result) return;
    const blob = new Blob([result.srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover_transcript.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-y-auto p-4 space-y-4 text-card-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none">
      {/* ── Hidden Audio Player for Preview ───────────────────────── */}
      {audioUrl && (
        <audio
          ref={audioPreviewRef}
          src={audioUrl}
          onEnded={() => setIsPlayingAudio(false)}
          onPause={() => setIsPlayingAudio(false)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="pb-2 border-b border-border">
        <h2 className="font-bold text-xs text-foreground flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-primary" />
          AI Audio Transcriber
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Extract word-level timed SRT from imported voiceover / video.
        </p>
      </div>

      {/* ── 1. Loaded Audio Source Card ─────────────────────────────── */}
      <div className="p-3 rounded-xl border border-border bg-background space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {audioUrl ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">
                {audioFile ? audioFile.name : audioUrl ? 'Imported Voiceover Audio' : 'No Audio Loaded'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {audioUrl ? 'Ready for AI transcription' : 'Upload MP3, WAV, or Video'}
              </span>
            </div>
          </div>

          {audioUrl && (
            <button
              onClick={handleToggleAudio}
              className="h-7 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-xs flex items-center gap-1 transition-colors shrink-0"
            >
              {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
            </button>
          )}
        </div>

        <button
          onClick={onOpenAudioUpload}
          className="w-full h-8 rounded-lg bg-secondary/70 hover:bg-secondary border border-border text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{audioUrl ? 'Change Audio / Extract from Video' : 'Import Audio or Video File'}</span>
        </button>
      </div>

      {/* ── 2. Transcription Engine & API Key Setup ─────────────────── */}
      <div className="space-y-2.5 pt-1 border-t border-border">
        <div>
          <label className="text-[11px] font-semibold text-foreground block mb-1">
            Transcription Engine
          </label>
          <CustomSelect
            value={engine}
            onChange={(val) => setEngine(val as TranscribeEngine)}
            options={[
              {
                value: 'groq',
                label: 'Groq Whisper-large-v3 (Free & ~2s Instant)',
              },
              {
                value: 'openai',
                label: 'OpenAI Whisper-1',
              },
              {
                value: 'browser',
                label: 'In-Browser Speech API (Offline)',
              },
            ]}
          />
        </div>

        {/* API Key Input for Groq / OpenAI */}
        {engine !== 'browser' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Key className="w-3 h-3 text-primary" />
                {engine === 'groq' ? 'Groq API Key (Free)' : 'OpenAI API Key'}
              </label>

              {engine === 'groq' && (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                >
                  Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder={engine === 'groq' ? 'gsk_...' : 'sk-...'}
                className="w-full h-8 bg-background border border-border rounded-lg pl-2.5 pr-8 text-xs font-mono text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Primary Transcribe Trigger Button */}
        <button
          onClick={handleStartTranscribe}
          disabled={isTranscribing || !audioUrl}
          className="w-full h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Sparkles className={`w-4 h-4 ${isTranscribing ? 'animate-spin' : ''}`} />
          <span>
            {isTranscribing
              ? progressMsg || 'Transcribing Audio...'
              : '⚡ Transcribe Audio into Timed SRT'}
          </span>
        </button>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ── 3. Generated SRT & Cue Output ───────────────────────────── */}
      {result && (
        <div className="space-y-3 pt-2 border-t border-border animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-foreground">
                Timed Transcript ({result.cues.length} Cues)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
              {result.engine}
            </span>
          </div>

          {/* Tab Switcher (SRT / Cues) */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('srt')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'srt'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Timed SRT Code
            </button>
            <button
              onClick={() => setActiveTab('cues')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'cues'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cues List ({result.cues.length})
            </button>
          </div>

          {/* SRT Code View */}
          {activeTab === 'srt' ? (
            <textarea
              readOnly
              rows={8}
              value={result.srtContent}
              className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground outline-none resize-none shadow-2xs leading-relaxed select-text [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {result.cues.map((cue) => (
                <div
                  key={cue.id}
                  className="p-2.5 rounded-xl border border-border bg-background space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-primary">
                      #{cue.id}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                      {cue.startTime.toFixed(1)}s → {cue.endTime.toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium leading-snug">
                    {cue.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons: Send to Prompt Builder / Download / Copy */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onSendToPromptBuilder(result.srtContent)}
              className="w-full h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Send Transcript to Prompt Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySrt}
                className="flex-1 h-8 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SRT!' : 'Copy SRT'}</span>
              </button>

              <button
                onClick={handleDownloadSrt}
                className="flex-1 h-8 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .srt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
