import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Upload,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Type,
  Music,
  Loader2,
  Film,
  Zap,
  Check,
  Sliders,
} from 'lucide-react';
import defaultSongData from '../../data/defaultSong.json';
import hindiSongData from '../../data/kaashTuYahinHoti.json';
import { transcribeWithGroq } from '../../services/transcription';
import {
  MOTION_STYLES,
  renderMotionStyle,
  C,
  TimedWord,
  TimedLine,
} from './styles';
import {
  GRAPHIC_OPTIONS,
  renderGraphicsOverlay,
} from './graphics';
import { StudioSidebar } from './sidebar/StudioSidebar';
import { fixVideoBlobDuration } from '../../utils/videoDurationFixer';
import { exportStudioVideoToMp4 } from '../../services/studioExport';
import { renderStudioFrame, roundRect } from './renderStudioFrame';

export type MotionStyle = string;

// ─── Default aligned lines ───────────────────────────────────────────────────
const initialLines: TimedLine[] = ((defaultSongData as any).lines || []).map((l: any) => ({
  i: l.i,
  text: l.text,
  start: l.start,
  end: l.end,
  words: (l.words || []).map((w: any) => ({
    word: w.word || w.w || '',
    start: w.start,
    end: w.end,
  })),
}));

export const ShortsStudio: React.FC = () => {
  // State
  const [songTitle, setSongTitle] = useState<string>(defaultSongData.title);
  const [audioUrl, setAudioUrl] = useState<string>(defaultSongData.audioUrl);
  const [words, setWords] = useState<TimedWord[]>(defaultSongData.words as TimedWord[]);
  const [lines, setLines] = useState<TimedLine[]>(initialLines);
  const [duration, setDuration] = useState<number>(defaultSongData.duration);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('hook');
  const [fontSize, setFontSize] = useState<number>(110);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [activeTab, setActiveTab] = useState<'graphics' | 'styles' | 'audio' | 'canvas'>('graphics');
  const [graphicFilter, setGraphicFilter] = useState<'all' | 'nature' | 'cinematic' | 'retro'>('all');
  const [activeGraphics, setActiveGraphics] = useState<string[]>([
    'floral',
    'tree',
    'petals',
    'botanicalFern',
    'butterfly',
    'corners',
    'waveform',
    'particles',
    'stars',
  ]);

  const toggleGraphic = (id: string) => {
    setActiveGraphics(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const [groqKey, setGroqKey] = useState<string>(
    localStorage.getItem('recipecut_groq_key') || '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'
  );
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportCurrentTime, setExportCurrentTime] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportEta, setExportEta] = useState<number>(0);
  const [exportFps, setExportFps] = useState<30 | 60>(30);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const exportCancelRef = useRef<(() => void) | null>(null);

  // Sync audio play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(p => !p);

  const handleSeek = (time: number) => {
    const t = Math.max(0, Math.min(time, duration));
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  // Keyboard shortcut (Space = Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onAudioTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const onAudioLoadedMetadata = () => {
    if (audioRef.current?.duration) setDuration(audioRef.current.duration);
  };

  // Upload custom audio file
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Run Groq Whisper Transcription
  const handleRunTranscription = async () => {
    if (!uploadedFile) {
      alert('Please upload an audio file first!');
      return;
    }
    if (!groqKey.trim()) {
      alert('Please enter your Groq API Key');
      return;
    }
    try {
      setIsTranscribing(true);
      setTranscribeStatus('Sending to Groq Whisper...');
      localStorage.setItem('recipecut_groq_key', groqKey.trim());
      const res = await transcribeWithGroq(uploadedFile, groqKey, msg => setTranscribeStatus(msg));
      const newWords: TimedWord[] = [];
      const newLines: TimedLine[] = [];
      res.cues.forEach((cue, ci) => {
        const lineWords = cue.text.split(/\s+/).filter(Boolean);
        const dur = cue.endTime - cue.startTime;
        const wdur = lineWords.length > 0 ? dur / lineWords.length : 0.4;
        const timedLineWords: TimedWord[] = lineWords.map((w, wi) => {
          const tw = {
            word: w,
            start: cue.startTime + wi * wdur,
            end: cue.startTime + (wi + 1) * wdur,
          };
          newWords.push(tw);
          return tw;
        });
        newLines.push({
          i: ci,
          text: cue.text,
          start: cue.startTime,
          end: cue.endTime,
          words: timedLineWords,
        });
      });
      setWords(newWords);
      setLines(newLines);
      if (res.duration) setDuration(res.duration);
      setTranscribeStatus('Done ✓');
    } catch (err: any) {
      console.error(err);
      alert(`Transcription error: ${err.message || err}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleLoadDemoSong = (songKey: 'better' | 'kaash' = 'better') => {
    const data = songKey === 'kaash' ? (hindiSongData as any) : (defaultSongData as any);
    setSongTitle(data.title);
    setAudioUrl(data.audioUrl);
    setWords(data.words as TimedWord[]);
    const parsedLines: TimedLine[] = (data.lines || []).map((l: any) => ({
      i: l.i,
      text: l.text,
      start: l.start,
      end: l.end,
      words: (l.words || []).map((w: any) => ({
        word: w.word || w.w || '',
        start: w.start,
        end: w.end,
      })),
    }));
    setLines(parsedLines);
    setDuration(data.duration);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  // ── CORE CANVAS RENDERER (DELEGATED TO CENTRALIZED DETERMINISTIC RENDERER) ───
  const renderFrame = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext('2d');
      if (!c) return;

      const isLandscape = orientation === 'landscape';
      const W = isLandscape ? 1920 : 1080;
      const H = isLandscape ? 1080 : 1920;
      canvas.width = W;
      canvas.height = H;

      renderStudioFrame({
        c,
        W,
        H,
        t,
        isLandscape,
        songTitle,
        lines,
        words,
        motionStyle,
        fontSize,
        uppercase,
        activeGraphics,
        isPlaying,
      });
    },
    [songTitle, lines, words, motionStyle, fontSize, uppercase, orientation, activeGraphics, isPlaying]
  );

  // Animation Loop (60fps requestAnimationFrame)
  useEffect(() => {
    const loop = () => {
      let t = currentTime;
      if (audioRef.current && isPlaying) {
        t = audioRef.current.currentTime;
        setCurrentTime(t);
      }
      renderFrame(t);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime, renderFrame]);

  // Export to MP4 (Deterministic 60 FPS Motion-as-Code Engine + Full Metadata)
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!audioUrl) {
      console.error('❌ [Export Video] Audio URL is missing!');
      return;
    }

    const effectiveDuration =
      audio?.duration && !isNaN(audio.duration) && audio.duration > 0
        ? audio.duration
        : duration;

    console.log('🎬 [Export Video] Initializing 60 FPS deterministic video export...', {
      songTitle,
      orientation,
      resolution: orientation === 'portrait' ? '1080×1920' : '1920×1080',
      duration: effectiveDuration,
      motionStyle,
      activeGraphics,
    });

    const abortController = new AbortController();
    let isCancelled = false;

    exportCancelRef.current = () => {
      console.warn('🛑 [Export Video] Export cancelled by user.');
      isCancelled = true;
      abortController.abort();
      setIsExporting(false);
      setExportProgress(0);
      setExportCurrentTime(0);
      setExportEta(0);
      setExportStatus('');
    };

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportCurrentTime(0);
      setExportEta(0);
      setExportStatus('Initializing 60 FPS broadcast export engine...');
      setIsPlaying(false);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      // ── PRIMARY ENGINE: WebCodecs Deterministic Offline Rendering ──────
      if (typeof VideoEncoder !== 'undefined') {
        console.log(`🚀 [Export Video] Running WebCodecs ${exportFps} FPS deterministic engine...`);
        const mp4Blob = await exportStudioVideoToMp4({
          audioUrl,
          songTitle,
          orientation,
          duration: effectiveDuration,
          motionStyle,
          fontSize,
          uppercase,
          activeGraphics,
          lines,
          words,
          fps: exportFps,
          signal: abortController.signal,
          onProgress: p => {
            if (isCancelled) return;
            setExportProgress(p.percent);
            setExportCurrentTime(p.currentTime);
            setExportEta(p.etaSeconds);
            setExportStatus(p.status);
          },
        });

        if (isCancelled) return;

        console.log(`✅ [Export Video] ${exportFps} FPS MP4 export successful! File size: ${(mp4Blob.size / (1024 * 1024)).toFixed(2)} MB`);
        const url = URL.createObjectURL(mp4Blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = songTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
        a.download = `${cleanName || 'kinetic_video'}_${orientation}_${exportFps}fps.mp4`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setExportProgress(0);
        setExportCurrentTime(0);
        setExportEta(0);
        setExportStatus('');
        return;
      }

      // ── FALLBACK ENGINE: MediaRecorder + Binary Duration Fixer ─────────────
      console.warn('⚠️ [Export Video] VideoEncoder not supported, falling back to MediaRecorder stream capture...');
      if (!canvas || !audio) return;

      const stream = canvas.captureStream(60);
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (!audioSourceRef.current) audioSourceRef.current = audioCtx.createMediaElementSource(audio);
      const src = audioSourceRef.current;
      if (!mediaDestRef.current) mediaDestRef.current = audioCtx.createMediaStreamDestination();
      const dest = mediaDestRef.current;
      try { src.disconnect(); } catch (e) {}
      src.connect(dest);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const rec = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 18_000_000,
      });

      const chunks: Blob[] = [];
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const finishFallback = async () => {
        if (isCancelled) return;
        const rawBlob = new Blob(chunks, { type: mimeType });
        const fixedBlob = await fixVideoBlobDuration(rawBlob, effectiveDuration);
        const url = URL.createObjectURL(fixedBlob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = songTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
        a.download = `${cleanName || 'kinetic_video'}_${orientation}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setExportProgress(0);
        setExportCurrentTime(0);
        audio.currentTime = 0;
        audio.pause();
      };

      rec.onstop = finishFallback;
      rec.start(250);
      audio.currentTime = 0;
      await audio.play();

      const tick = setInterval(() => {
        if (isCancelled) {
          clearInterval(tick);
          return;
        }
        setExportCurrentTime(audio.currentTime);
        const pct = Math.min(100, Math.round((audio.currentTime / effectiveDuration) * 100));
        setExportProgress(pct);

        if (audio.currentTime >= effectiveDuration - 0.15 || audio.ended) {
          clearInterval(tick);
          try { if (rec.state !== 'inactive') rec.stop(); } catch (e) {}
          audio.pause();
        }
      }, 250);
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        console.log('Export cancelled safely.');
      } else {
        console.error('❌ [Export Video Error]:', err);
      }
      setIsExporting(false);
      setExportProgress(0);
      setExportCurrentTime(0);
      setExportEta(0);
      setExportStatus('');
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  };

  const fmt2 = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ background: '#f4edd8', fontFamily: '"IBM Plex Mono", monospace', color: '#1a1209' }}
    >
      {/* ── TOP BAR (UPGRADED EDITORIAL) ────────────────────────────────────── */}
      <div
        className="h-14 border-b flex items-center justify-between px-6 shrink-0 z-10 select-none"
        style={{ borderColor: 'rgba(28,21,13,0.12)', background: '#eee5d5' }}
      >
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
            style={{ background: '#d95d39' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#1c150d]">
                Kinetic Typography Studio
              </h1>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold"
                style={{
                  background: 'rgba(217,93,57,0.12)',
                  color: '#d95d39',
                  borderColor: 'rgba(217,93,57,0.3)',
                }}
              >
                {orientation === 'portrait' ? '1080×1920 (9:16)' : '1920×1080 (16:9)'}
              </span>
            </div>
            <p className="text-[10px] text-[#7a6e60]">
              Word-synced typography · Warm textured paper
            </p>
          </div>
        </div>

        {/* Format / Aspect Ratio Segmented Control */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border"
          style={{ background: '#e3d7c3', borderColor: 'rgba(28,21,13,0.12)' }}
        >
          <button
            onClick={() => setOrientation('portrait')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              orientation === 'portrait'
                ? 'bg-white text-[#d95d39] shadow-xs font-bold'
                : 'text-[#5a4e40] hover:text-[#1c150d]'
            }`}
          >
            9:16 Portrait
          </button>
          <button
            onClick={() => setOrientation('landscape')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              orientation === 'landscape'
                ? 'bg-white text-[#d95d39] shadow-xs font-bold'
                : 'text-[#5a4e40] hover:text-[#1c150d]'
            }`}
          >
            16:9 Landscape
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Song Switcher Segment */}
          <div
            className="flex items-center p-0.5 rounded-xl border text-xs font-semibold"
            style={{ background: '#e3d7c3', borderColor: 'rgba(28,21,13,0.12)' }}
          >
            <button
              onClick={() => handleLoadDemoSong('better')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                audioUrl.includes('better_on_my_own')
                  ? 'bg-white text-[#d95d39] shadow-xs font-bold'
                  : 'text-[#5a4e40] hover:text-[#1c150d]'
              }`}
              title="Demo 1: Better on My Own (English Pop)"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Demo 1</span>
            </button>
            <button
              onClick={() => handleLoadDemoSong('kaash')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                audioUrl.includes('kaash_tu_yahin_hoti')
                  ? 'bg-white text-[#d95d39] shadow-xs font-bold'
                  : 'text-[#5a4e40] hover:text-[#1c150d]'
              }`}
              title="Demo 2: Kaash Tu Yahin Hoti (Hindi Acoustic 🇮🇳)"
            >
              <span className="text-[12px] leading-none">🇮🇳</span>
              <span>Demo 2</span>
            </button>
          </div>

          {/* Framerate Selection Segment */}
          <div
            className="flex items-center p-0.5 rounded-xl border text-[11px] font-mono font-bold"
            style={{ background: '#e3d7c3', borderColor: 'rgba(28,21,13,0.12)' }}
          >
            <button
              onClick={() => setExportFps(30)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                exportFps === 30
                  ? 'bg-white text-[#d95d39] shadow-xs'
                  : 'text-[#6e6152] hover:text-[#1c150d]'
              }`}
              title="30 FPS: Standard Shorts/Reels framerate (Fast & silky smooth)"
            >
              30 FPS
            </button>
            <button
              onClick={() => setExportFps(60)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                exportFps === 60
                  ? 'bg-white text-[#d95d39] shadow-xs'
                  : 'text-[#6e6152] hover:text-[#1c150d]'
              }`}
              title="60 FPS: Ultra-high framerate broadcast quality"
            >
              60 FPS
            </button>
          </div>

          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs hover:opacity-95"
            style={{ background: '#d95d39' }}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>Export {orientation === 'portrait' ? '9:16' : '16:9'} MP4 ({exportFps}fps)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── EXPORT PROGRESS MODAL (SPACIOUS & BEAUTIFIED) ────────────────── */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-6 select-none">
          <div
            className="w-full rounded-2xl border p-7 space-y-5 shadow-2xl"
            style={{
              maxWidth: '560px',
              background: '#fcfaf5',
              borderColor: 'rgba(28,21,13,0.16)',
              boxShadow: '0 32px 70px rgba(0,0,0,0.35)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ background: '#d95d39' }}
                >
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1c150d] tracking-tight">
                    Rendering & Exporting Video
                  </h3>
                  <p className="text-xs text-[#7a6e60] mt-0.5">
                    {orientation === 'portrait' ? '9:16 Portrait · 1080×1920' : '16:9 Landscape · 1920×1080'} · 60fps Silent
                  </p>
                </div>
              </div>

              {/* Big Crisp Percentage */}
              <div className="flex flex-col items-end">
                <span className="text-2xl font-mono font-extrabold text-[#d95d39] leading-none">
                  {exportProgress}%
                </span>
                <span className="text-[10px] font-mono text-[#7a6e60] mt-1 uppercase tracking-wider">
                  ENCODING
                </span>
              </div>
            </div>

            {/* Elevated Progress Bar */}
            <div
              className="w-full h-4 rounded-full overflow-hidden border p-0.5 shadow-inner"
              style={{ background: '#ebe2d0', borderColor: 'rgba(28,21,13,0.14)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${exportProgress}%`,
                  background: 'linear-gradient(90deg, #d95d39 0%, #ea7a58 100%)',
                  boxShadow: '0 1px 4px rgba(217,93,57,0.3)',
                }}
              />
            </div>

            {/* Status & Time (Clean single-line without wrapping) */}
            <div className="flex items-center justify-between text-xs font-mono text-[#6e6152] pt-0.5">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#d95d39] shrink-0" />
                <span className="truncate">
                  {exportStatus ||
                    (exportProgress >= 98
                      ? 'Finalizing 60 FPS MP4 video file...'
                      : 'Rendering 60 FPS deterministic video frames...')}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
                {exportEta > 0 && exportProgress < 98 && (
                  <span className="text-[11px] text-[#8c7f70] font-mono">
                    ETA: {exportEta}s
                  </span>
                )}
                <span className="font-semibold text-[#1c150d]">
                  {exportCurrentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Cancel Action Footer */}
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(28,21,13,0.10)' }}>
              <span className="text-[11px] text-[#8c7f70]">
                Audio is muted during render to prevent background playback.
              </span>
              <button
                onClick={() => {
                  if (exportCancelRef.current) exportCancelRef.current();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition hover:bg-black/5 cursor-pointer text-[#6b5e50] shadow-xs shrink-0 ml-3"
                style={{ borderColor: 'rgba(28,21,13,0.18)', background: '#f5eee0' }}
              >
                Cancel Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN AUDIO ────────────────────────────────────────────────────── */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={onAudioTimeUpdate}
        onLoadedMetadata={onAudioLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        muted={isMuted}
      />

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* ── LEFT EDITORIAL SIDEBAR (EXTRACTED) ────────────────────────── */}
        <StudioSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          graphicFilter={graphicFilter}
          setGraphicFilter={setGraphicFilter}
          activeGraphics={activeGraphics}
          toggleGraphic={toggleGraphic}
          setActiveGraphics={setActiveGraphics}
          motionStyle={motionStyle}
          setMotionStyle={setMotionStyle}
          orientation={orientation}
          setOrientation={setOrientation}
          fontSize={fontSize}
          setFontSize={setFontSize}
          uppercase={uppercase}
          setUppercase={setUppercase}
          uploadedFile={uploadedFile}
          handleAudioUpload={handleAudioUpload}
          groqKey={groqKey}
          setGroqKey={setGroqKey}
          handleRunTranscription={handleRunTranscription}
          isTranscribing={isTranscribing}
          transcribeStatus={transcribeStatus}
          songTitle={songTitle}
          audioUrl={audioUrl}
          onLoadDemoSong={handleLoadDemoSong}
          wordsCount={words.length}
          linesCount={lines.length}
          duration={duration}
        />

        {/* ── CENTER: VIDEO PREVIEW + CONTROLS ─────────────────────────────── */}
        <div
          className="flex-1 flex flex-col items-center justify-between p-6 overflow-hidden"
          style={{ background: '#e8dcc8' }}
        >
          {/* Canvas Container — dynamically adapts to 9:16 or 16:9 */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden">
            <div
              className="relative rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300"
              style={{
                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                maxHeight: orientation === 'portrait' ? '74vh' : '55vh',
                maxWidth:
                  orientation === 'portrait'
                    ? 'min(calc(74vh * 9 / 16), 46vw)'
                    : 'min(calc(55vh * 16 / 9), 70vw)',
                width: '100%',
                borderColor: 'rgba(26,18,9,0.25)',
                boxShadow: '0 24px 60px rgba(26,18,9,0.22)',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
                onClick={togglePlay}
              />
            </div>
          </div>

          {/* External Playback Controls */}
          <div
            className="w-full max-w-xl rounded-2xl p-4 shadow-xl mt-4 shrink-0 flex flex-col gap-3 border"
            style={{ background: '#ede4cc', borderColor: 'rgba(26,18,9,0.18)' }}
          >
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={e => handleSeek(Number(e.target.value))}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: '#c94f00', background: 'rgba(26,18,9,0.15)' }}
            />
            <div className="flex items-center justify-between text-xs" style={{ color: '#7a6e5f' }}>
              <span className="font-mono w-16">{fmt2(currentTime)}</span>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => handleSeek(currentTime - 5)}
                  className="p-2 rounded-full hover:opacity-70 transition-opacity"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ background: '#c94f00', boxShadow: '0 4px 16px rgba(201,79,0,0.35)' }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:opacity-70 transition-opacity"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" style={{ color: '#c94f00' }} />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <span className="font-mono w-16 text-right">{fmt2(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
