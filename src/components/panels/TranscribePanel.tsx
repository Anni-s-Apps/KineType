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
  FileAudio,
  Radio,
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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live debug activity logs
  const [logs, setLogs] = useState<Array<{ id: number; time: string; msg: string; type: 'info' | 'error' | 'success' }>>([]);
  const [showLogs, setShowLogs] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Result state
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'srt' | 'cues'>('srt');

  // Mini Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev.slice(-20), { id: Date.now() + Math.random(), time, msg, type }]);
  };

  // Timer while transcribing
  useEffect(() => {
    let interval: any;
    if (isTranscribing) {
      setElapsedSeconds(0);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTranscribing]);

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

  const handleCancelTranscribe = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('Transcription cancelled by user.', 'error');
    }
    setIsTranscribing(false);
  };

  const handleStartTranscribe = async () => {
    setErrorMsg(null);
    setLogs([]);
    setShowLogs(true);

    if (!audioUrl && !audioBlob && !audioFile) {
      const err = 'Please import an audio or video file first.';
      setErrorMsg(err);
      addLog(err, 'error');
      return;
    }

    if ((engine === 'groq' || engine === 'openai') && !apiKey.trim()) {
      const err = `Please enter your ${engine === 'groq' ? 'Groq' : 'OpenAI'} API key.`;
      setErrorMsg(err);
      addLog(err, 'error');
      return;
    }

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    // 30 second safety timeout
    const timeoutId = setTimeout(() => {
      abortCtrl.abort();
      addLog('Timeout: Server took longer than 30s to respond.', 'error');
    }, 30000);

    try {
      setIsTranscribing(true);
      addLog(`Initializing ${engine === 'groq' ? 'Groq Whisper-large-v3' : engine === 'openai' ? 'OpenAI Whisper-1' : 'WebSpeech'}...`);
      setProgressMsg('Preparing audio file...');

      let targetBlob: Blob | File | null = audioBlob || audioFile;

      if (!targetBlob && audioUrl) {
        addLog('Fetching audio blob from URL...');
        const response = await fetch(audioUrl);
        targetBlob = await response.blob();
      }

      if (!targetBlob && engine !== 'browser') {
        throw new Error('Could not access audio stream.');
      }

      let res: TranscriptionResult;

      if (engine === 'groq') {
        res = await transcribeWithGroq(
          targetBlob!,
          apiKey,
          (msg) => {
            setProgressMsg(msg);
            addLog(msg);
          },
          abortCtrl.signal
        );
      } else if (engine === 'openai') {
        res = await transcribeWithOpenAI(
          targetBlob!,
          apiKey,
          (msg) => {
            setProgressMsg(msg);
            addLog(msg);
          },
          abortCtrl.signal
        );
      } else {
        addLog('Starting browser speech recognition...');
        res = await transcribeWithBrowserSpeech(audioUrl!, audioDuration);
      }

      clearTimeout(timeoutId);
      setResult(res);
      addLog(`Done! Generated ${res.cues.length} cues in ${elapsedSeconds}s.`, 'success');
      setProgressMsg('');
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const msg = isAbort ? 'Request timed out or cancelled.' : err.message || 'Transcription failed.';
      setErrorMsg(msg);
      addLog(msg, 'error');
    } finally {
      setIsTranscribing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopySrt = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.srtContent);
    setCopied(true);
    addLog('Copied SRT to clipboard!', 'success');
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
    addLog('Downloaded voiceover_transcript.srt', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-y-auto p-4 space-y-4 text-card-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none">
      {/* ── Hidden Audio Element for Playback ───────────────────────── */}
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
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-bold text-xs text-foreground tracking-tight">
            AI Audio Transcriber
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Extract word-level timed SRT from imported voiceover / video.
        </p>
      </div>

      {/* ── 1. Loaded Audio Source Card ─────────────────────────────── */}
      <div className="p-3 rounded-xl border border-border bg-background/50 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                audioUrl
                  ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {audioUrl ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground block truncate">
                {audioFile ? audioFile.name : audioUrl ? 'Voiceover Audio' : 'No Audio Loaded'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono block">
                {audioUrl ? 'Ready to transcribe' : 'MP3, WAV, or Video'}
              </span>
            </div>
          </div>

          {audioUrl && (
            <button
              onClick={handleToggleAudio}
              className={`h-7 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                isPlayingAudio
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Listen</span>
                </>
              )}
            </button>
          )}
        </div>

        <button
          onClick={onOpenAudioUpload}
          className="w-full h-8 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{audioUrl ? 'Change Audio / Extract' : 'Import Audio or Video'}</span>
        </button>
      </div>

      {/* ── 2. Transcription Engine & API Key Setup ─────────────────── */}
      <div className="space-y-3 pt-1 border-t border-border">
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
                label: 'Groq Whisper-large (Free & Fast)',
              },
              {
                value: 'openai',
                label: 'OpenAI Whisper-1',
              },
              {
                value: 'browser',
                label: 'Browser WebSpeech (Offline)',
              },
            ]}
          />
        </div>

        {/* API Key Input for Groq / OpenAI */}
        {engine !== 'browser' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
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
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
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
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Primary Transcribe Trigger Button with Live Elapsed Seconds */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartTranscribe}
            disabled={isTranscribing || !audioUrl}
            className={`flex-1 h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
              !audioUrl
                ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isTranscribing ? 'animate-spin' : ''}`} />
            <span className="truncate">
              {isTranscribing
                ? `${progressMsg || 'Transcribing'} (${elapsedSeconds}s)...`
                : !audioUrl
                ? 'Upload Audio to Transcribe'
                : 'Transcribe to Timed SRT'}
            </span>
          </button>

          {isTranscribing && (
            <button
              onClick={handleCancelTranscribe}
              className="h-9 px-3 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 font-semibold text-xs transition-colors shrink-0"
              title="Cancel transcription"
            >
              Cancel
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight text-[11px] font-medium">{errorMsg}</span>
          </div>
        )}

        {/* ── Live Activity & API Log Console Box ─────────────────────── */}
        {logs.length > 0 && (
          <div className="rounded-xl border border-border bg-background/80 overflow-hidden shadow-2xs animate-in fade-in">
            <div className="px-3 py-1.5 bg-muted/50 border-b border-border flex items-center justify-between">
              <div
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isTranscribing ? 'bg-amber-500 animate-pulse' : errorMsg ? 'bg-destructive' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-mono font-bold text-foreground">
                  Activity Logs ({logs.length})
                </span>
                {isTranscribing && (
                  <span className="text-[9px] font-mono text-primary font-bold">
                    {elapsedSeconds}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const logText = logs.map((l) => `[${l.time}] ${l.msg}`).join('\n');
                    navigator.clipboard.writeText(logText);
                    addLog('Copied all logs to clipboard!', 'success');
                  }}
                  className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  title="Copy full logs text to clipboard"
                >
                  <Copy className="w-2.5 h-2.5" />
                  Copy Logs
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showLogs ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {showLogs && (
              <div className="p-2.5 font-mono text-[10px] leading-relaxed max-h-36 overflow-y-auto space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black/20">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-1.5 ${
                      log.type === 'error'
                        ? 'text-red-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <span className="opacity-50 select-none text-[9px]">[{log.time}]</span>
                    <span className="break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Generated SRT & Cue Output ───────────────────────────── */}
      {result && (
        <div className="space-y-3 pt-2 border-t border-border animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <h3 className="text-xs font-bold text-foreground">
                Transcript ({result.cues.length} Cues)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border capitalize">
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
              rows={7}
              value={result.srtContent}
              className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground outline-none resize-none shadow-2xs leading-relaxed select-text [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {result.cues.map((cue) => (
                <div
                  key={cue.id}
                  className="p-2.5 rounded-xl border border-border bg-background/60 space-y-1 shadow-2xs"
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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Send to Prompt Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySrt}
                className="flex-1 h-8 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SRT'}</span>
              </button>

              <button
                onClick={handleDownloadSrt}
                className="flex-1 h-8 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

