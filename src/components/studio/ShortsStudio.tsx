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
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('askew');
  const [fontSize, setFontSize] = useState<number>(72);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [activeTab, setActiveTab] = useState<'graphics' | 'styles' | 'audio' | 'canvas'>('graphics');
  const [graphicFilter, setGraphicFilter] = useState<'all' | 'nature' | 'cinematic' | 'retro'>('all');
  const [activeGraphics, setActiveGraphics] = useState<string[]>([
    'tree',
    'floral',
    'petals',
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

  const handleLoadDemoSong = () => {
    setSongTitle(defaultSongData.title);
    setAudioUrl(defaultSongData.audioUrl);
    setWords(defaultSongData.words as TimedWord[]);
    setLines(initialLines);
    setDuration(defaultSongData.duration);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // ── CORE CANVAS RENDERER ───────────────────────────────────────────────────
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

      // 1. Warm Paper Canvas Background
      c.fillStyle = C.paper;
      c.fillRect(0, 0, W, H);

      // Warm subtle vignette
      const vig = c.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.7, 'rgba(40,25,8,0.05)');
      vig.addColorStop(1, 'rgba(40,25,8,0.18)');
      c.fillStyle = vig;
      c.fillRect(0, 0, W, H);

      // 1.5 Graphic Overlays (Corners, Waveform, Particles, Stars, Vinyl, Now Playing)
      renderGraphicsOverlay(activeGraphics, {
        c,
        W,
        H,
        t,
        isLandscape,
        songTitle,
        C,
        isPlaying,
      });

      // Active timing and text formatting
      const curLine =
        lines.find(l => t >= l.start && t < l.end) ||
        lines.find(l => l.start <= t && l.end >= t - 0.5);
      const activeWord = words.find(w => t >= w.start && t < w.end);
      const fmt = (s: string) => (uppercase ? s.toUpperCase() : s);

      // 2. Center Kinetic Zone
      c.save();
      c.translate(W * 0.5, H * 0.44);

      if (!curLine) {
        // Musical rest symbol during pauses
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const breathY = Math.sin(t * 1.4) * 16;
        c.font = `italic 400 48px "Cormorant Garamond", serif`;
        c.fillStyle = 'rgba(26,18,9,0.35)';
        c.fillText('♩', 0, breathY);
      } else {
        // Dispatch to modular motion style!
        renderMotionStyle(motionStyle, {
          c,
          W,
          H,
          t,
          curLine,
          activeWord,
          lines,
          words,
          fontSize,
          uppercase,
          isLandscape,
          C,
          fmt,
          roundRect,
        });
      }
      c.restore();

      // 3. Bottom Caption Band (clean current lyrics subtitle)
      if (curLine) {
        const banY = H - (isLandscape ? 130 : 250);
        const banH = isLandscape ? 90 : 140;

        // Subtle gradient scrim
        const banGrad = c.createLinearGradient(0, banY - 40, 0, H);
        banGrad.addColorStop(0, 'rgba(244,237,216,0)');
        banGrad.addColorStop(0.25, 'rgba(244,237,216,0.92)');
        banGrad.addColorStop(1, 'rgba(244,237,216,1)');
        c.fillStyle = banGrad;
        c.fillRect(0, banY - 40, W, H - (banY - 40));

        // Draw words with spoken/active coloring
        const baseCapSz = isLandscape ? 32 : 40;
        c.font = `700 ${baseCapSz}px "Archivo", sans-serif`;
        c.textBaseline = 'middle';
        const lw = curLine.words;
        const sp = c.measureText(' ').width;
        const totalW2 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + sp, -sp);
        const capMaxW = W - 140;
        const capSz = totalW2 > capMaxW ? baseCapSz * (capMaxW / totalW2) : baseCapSz;
        c.font = `700 ${capSz}px "Archivo", sans-serif`;
        const spScaled = c.measureText(' ').width;
        const totalW3 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + spScaled, -spScaled);
        let bx = W * 0.5 - totalW3 * 0.5;
        const capY = banY + banH * 0.45;

        lw.forEach(w => {
          const isCur = !!(
            activeWord &&
            activeWord.word === w.word &&
            Math.abs(activeWord.start - w.start) < 0.14
          );
          const spoken = t >= w.start;
          const tw2 = c.measureText(fmt(w.word)).width;
          c.textAlign = 'left';
          c.fillStyle = isCur ? C.signal : spoken ? C.ink : C.ash;
          c.fillText(fmt(w.word), bx, capY);
          bx += tw2 + spScaled;
        });
        c.textAlign = 'left';
      }
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

  // Export to MP4 / WebM (Silent mode + Rich Console Debugging)
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) {
      console.error('❌ [Export Video] Canvas or Audio ref is null!');
      return;
    }

    console.log('🎬 [Export Video] Initializing video export...', {
      songTitle,
      orientation,
      resolution: orientation === 'portrait' ? '1080×1920' : '1920×1080',
      duration,
      motionStyle,
      activeGraphics,
    });

    try {
      setIsExporting(true);
      setExportProgress(0);
      setIsPlaying(false);

      // 60fps canvas stream
      const stream = canvas.captureStream(60);

      // Web Audio setup (reuse context & source node to prevent InvalidStateError)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      if (!audioSourceRef.current) {
        audioSourceRef.current = audioCtx.createMediaElementSource(audio);
      }
      const src = audioSourceRef.current;

      if (!mediaDestRef.current) {
        mediaDestRef.current = audioCtx.createMediaStreamDestination();
      }
      const dest = mediaDestRef.current;

      // Disconnect previous connections safely
      try {
        src.disconnect();
      } catch (e) {
        // Safe to ignore if not connected
      }

      // Route audio ONLY to recorder destination stream — NOT to audioCtx.destination!
      // This keeps user speakers completely SILENT so music doesn't blast or auto-play!
      src.connect(dest);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      console.log('🎬 [Export Video] Selected container mimeType:', mimeType);

      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const rec = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 16_000_000, // 16 Mbps high-fidelity
      });

      const chunks: Blob[] = [];
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log(`📦 [Export Video] Captured chunk #${chunks.length} (${(e.data.size / 1024).toFixed(1)} KB)`);
        }
      };

      let isCancelled = false;

      const finishExport = () => {
        if (isCancelled) return;
        console.log(`🏁 [Export Video] Recording complete. Assembling ${chunks.length} chunks into final video...`);
        const blob = new Blob(chunks, { type: mimeType });
        console.log(`✅ [Export Video] Export finished! File size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = songTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
        a.download = `${cleanName || 'kinetic_video'}_${orientation}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setExportProgress(0);
        audio.currentTime = 0;
        audio.pause();
      };

      rec.onstop = finishExport;

      exportCancelRef.current = () => {
        console.warn('🛑 [Export Video] Export cancelled by user.');
        isCancelled = true;
        try {
          if (rec.state !== 'inactive') rec.stop();
        } catch (e) {}
        audio.pause();
        audio.currentTime = 0;
        setIsExporting(false);
        setExportProgress(0);
      };

      rec.start(250);
      audio.currentTime = 0;
      await audio.play();

      console.log('▶️ [Export Video] Rendering underway in silent mode (no speaker output)...');

      const tick = setInterval(() => {
        if (isCancelled) {
          clearInterval(tick);
          return;
        }

        const pct = Math.min(100, Math.round((audio.currentTime / duration) * 100));
        setExportProgress(pct);

        console.log(
          `⏱️ [Export Video] Progress: ${pct}% (${audio.currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`
        );

        if (audio.currentTime >= duration - 0.15 || audio.ended) {
          clearInterval(tick);
          console.log('⏹️ [Export Video] Reached track end. Stopping recorder...');
          try {
            if (rec.state !== 'inactive') rec.stop();
          } catch (e) {}
          audio.pause();
        }
      }, 250);
    } catch (err) {
      console.error('❌ [Export Video Error]:', err);
      setIsExporting(false);
      setExportProgress(0);
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
          <button
            onClick={handleLoadDemoSong}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            style={{
              background: '#fdfbf7',
              borderColor: 'rgba(28,21,13,0.16)',
              color: '#1c150d',
            }}
          >
            <Music className="w-3.5 h-3.5" style={{ color: '#d95d39' }} />
            <span>Load Demo Track</span>
          </button>

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
                <span>Export {orientation === 'portrait' ? '9:16' : '16:9'} MP4</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── EXPORT PROGRESS MODAL ────────────────────────────────────────── */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{
              background: '#fcf9f2',
              borderColor: 'rgba(28,21,13,0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ background: '#d95d39' }}
                >
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1c150d]">
                    Rendering & Exporting Video
                  </h3>
                  <p className="text-[11px] text-[#7a6e60]">
                    {orientation === 'portrait' ? '9:16 Portrait (1080×1920)' : '16:9 Landscape (1920×1080)'} · 60fps
                  </p>
                </div>
              </div>
              <span className="text-xl font-mono font-extrabold text-[#d95d39]">
                {exportProgress}%
              </span>
            </div>

            {/* Progress Track & Fill */}
            <div
              className="w-full h-3.5 rounded-full overflow-hidden border p-0.5"
              style={{ background: '#eee5d5', borderColor: 'rgba(28,21,13,0.14)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${exportProgress}%`,
                  background: 'linear-gradient(90deg, #d95d39, #ea7a58)',
                }}
              />
            </div>

            {/* Status Line */}
            <div className="flex items-center justify-between text-xs font-mono text-[#7a6e60]">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d95d39]" />
                {exportProgress >= 98
                  ? 'Assembling MP4 file & downloading...'
                  : 'Recording frames & audio in silent mode...'}
              </span>
              <span>
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>

            {/* Cancel Action */}
            <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'rgba(28,21,13,0.08)' }}>
              <button
                onClick={() => {
                  if (exportCancelRef.current) exportCancelRef.current();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition hover:bg-black/5 cursor-pointer text-[#7a6e60]"
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
