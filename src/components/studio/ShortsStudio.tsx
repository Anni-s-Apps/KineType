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

  // Export to MP4 / WebM
  const handleExportVideo = async () => {
    const canvas = canvasRef.current,
      audio = audioRef.current;
    if (!canvas || !audio) return;
    try {
      setIsExporting(true);
      setExportProgress(0);
      setIsPlaying(false);
      const stream = canvas.captureStream(60);
      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      src.connect(audioCtx.destination);
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : 'video/webm;codecs=vp9';
      const rec = new MediaRecorder(
        new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]),
        { mimeType, videoBitsPerSecond: 14_000_000 }
      );
      const chunks: Blob[] = [];
      rec.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songTitle.replace(/[^\w]/g, '_')}_${orientation}.${
          mimeType.includes('mp4') ? 'mp4' : 'webm'
        }`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(0);
      };
      rec.start(200);
      audio.currentTime = 0;
      audio.play();
      const tick = setInterval(() => {
        setExportProgress(Math.round((audio.currentTime / duration) * 100));
        if (audio.currentTime >= duration - 0.2) {
          clearInterval(tick);
          rec.stop();
          audio.pause();
        }
      }, 250);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const fmt2 = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ background: '#f4edd8', fontFamily: '"IBM Plex Mono", monospace', color: '#1a1209' }}
    >
      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div
        className="h-13 border-b flex items-center justify-between px-6 shrink-0 z-10"
        style={{ borderColor: 'rgba(26,18,9,0.18)', background: '#ede4cc' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{ background: '#c94f00', borderColor: 'rgba(201,79,0,0.4)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: '#1a1209' }}>
              Kinetic Shorts Studio
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold"
                style={{
                  background: 'rgba(201,79,0,0.12)',
                  color: '#c94f00',
                  borderColor: 'rgba(201,79,0,0.3)',
                }}
              >
                {orientation === 'portrait' ? '1080×1920 (9:16)' : '1920×1080 (16:9)'}
              </span>
            </h1>
            <p className="text-[10px]" style={{ color: '#7a6e5f' }}>
              pdoom motion styles · warm paper
            </p>
          </div>
        </div>

        {/* ── PORTRAIT / LANDSCAPE FORMAT TOGGLE IN TOP BAR ── */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border"
          style={{ background: '#e0d4bc', borderColor: 'rgba(26,18,9,0.18)' }}
        >
          <button
            onClick={() => setOrientation('portrait')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              orientation === 'portrait' ? 'shadow-sm text-white' : 'hover:opacity-75'
            }`}
            style={{
              background: orientation === 'portrait' ? '#c94f00' : 'transparent',
              color: orientation === 'portrait' ? '#ffffff' : '#1a1209',
            }}
          >
            📱 9:16 Portrait
          </button>
          <button
            onClick={() => setOrientation('landscape')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              orientation === 'landscape' ? 'shadow-sm text-white' : 'hover:opacity-75'
            }`}
            style={{
              background: orientation === 'landscape' ? '#c94f00' : 'transparent',
              color: orientation === 'landscape' ? '#ffffff' : '#1a1209',
            }}
          >
            🖥️ 16:9 Landscape
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadDemoSong}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5"
            style={{ background: '#e8dcc8', borderColor: 'rgba(26,18,9,0.22)', color: '#1a1209' }}
          >
            <Music className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />
            Load "Better on My Own"
          </button>
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: '#c94f00', boxShadow: '0 4px 14px rgba(201,79,0,0.3)' }}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rendering ({exportProgress}%)...
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                Export {orientation === 'portrait' ? '9:16' : '16:9'} Video
              </>
            )}
          </button>
        </div>
      </div>

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
        {/* ── LEFT MULTI-PANEL NAVIGATION RAIL (PC DESKTOP) ────────────────── */}
        <div
          className="w-18 border-r flex flex-col items-center py-4 gap-3 shrink-0 select-none z-10"
          style={{ borderColor: 'rgba(26,18,9,0.14)', background: '#e6dcbf', width: '72px' }}
        >
          <button
            onClick={() => setActiveTab('graphics')}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
              activeTab === 'graphics' ? 'shadow-md scale-105' : 'hover:opacity-80'
            }`}
            style={{
              background: activeTab === 'graphics' ? '#c94f00' : 'rgba(26,18,9,0.06)',
              color: activeTab === 'graphics' ? '#ffffff' : '#574c3d',
            }}
            title="Decorations & Graphics"
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Elements</span>
            {activeGraphics.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2"
                style={{
                  background: activeTab === 'graphics' ? '#1a1209' : '#c94f00',
                  color: '#ffffff',
                  borderColor: '#e6dcbf',
                }}
              >
                {activeGraphics.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('styles')}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'styles' ? 'shadow-md scale-105' : 'hover:opacity-80'
            }`}
            style={{
              background: activeTab === 'styles' ? '#c94f00' : 'rgba(26,18,9,0.06)',
              color: activeTab === 'styles' ? '#ffffff' : '#574c3d',
            }}
            title="Motion Typography Styles"
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Styles</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'audio' ? 'shadow-md scale-105' : 'hover:opacity-80'
            }`}
            style={{
              background: activeTab === 'audio' ? '#c94f00' : 'rgba(26,18,9,0.06)',
              color: activeTab === 'audio' ? '#ffffff' : '#574c3d',
            }}
            title="Audio & Synced Lyrics"
          >
            <Music className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('canvas')}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'canvas' ? 'shadow-md scale-105' : 'hover:opacity-80'
            }`}
            style={{
              background: activeTab === 'canvas' ? '#c94f00' : 'rgba(26,18,9,0.06)',
              color: activeTab === 'canvas' ? '#ffffff' : '#574c3d',
            }}
            title="Canvas & Format"
          >
            <Sliders className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Format</span>
          </button>
        </div>

        {/* ── EXPANDED DRAWER PANEL (PC DESKTOP) ───────────────────────────── */}
        <div
          className="border-r overflow-y-auto p-5 shrink-0 [scrollbar-width:thin]"
          style={{
            borderColor: 'rgba(26,18,9,0.14)',
            background: '#ede4cc',
            width: '390px',
          }}
        >
          {/* TAB 1: GRAPHICS & DECORATIVE ELEMENTS */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'rgba(26,18,9,0.12)' }}>
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: '#1a1209' }}>
                    Decorations & Elements
                  </h2>
                  <p className="text-[11px]" style={{ color: '#7a6e5f' }}>
                    Click any item to add or remove from video player
                  </p>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(201,79,0,0.14)', color: '#c94f00' }}
                >
                  {activeGraphics.length} on canvas
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveGraphics(['tree', 'floral', 'petals'])}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition hover:opacity-80 cursor-pointer"
                  style={{ background: 'rgba(214,115,96,0.15)', borderColor: 'rgba(214,115,96,0.3)', color: '#1a1209' }}
                >
                  🌿 Nature Preset
                </button>
                <button
                  onClick={() => setActiveGraphics(['corners', 'particles', 'stars'])}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition hover:opacity-80 cursor-pointer"
                  style={{ background: 'rgba(26,18,9,0.06)', borderColor: 'rgba(26,18,9,0.15)', color: '#1a1209' }}
                >
                  🎬 Cinema Preset
                </button>
                <button
                  onClick={() => setActiveGraphics([])}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition hover:opacity-80 cursor-pointer ml-auto"
                  style={{ background: 'transparent', borderColor: 'rgba(26,18,9,0.18)', color: '#7a6e5f' }}
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 p-1 rounded-xl border text-xs" style={{ background: 'rgba(26,18,9,0.04)', borderColor: 'rgba(26,18,9,0.1)' }}>
                {[
                  { id: 'all', label: 'All Elements' },
                  { id: 'nature', label: '🌿 Nature' },
                  { id: 'cinematic', label: '🎬 Cinema' },
                  { id: 'retro', label: '🎵 Retro' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGraphicFilter(cat.id as any)}
                    className="flex-1 py-1 rounded-lg text-center font-medium transition cursor-pointer"
                    style={{
                      background: graphicFilter === cat.id ? '#fbf8f0' : 'transparent',
                      color: graphicFilter === cat.id ? '#c94f00' : '#7a6e5f',
                      boxShadow: graphicFilter === cat.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 2-Column Visual Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {GRAPHIC_OPTIONS.filter(g =>
                  graphicFilter === 'all'
                    ? true
                    : graphicFilter === 'retro'
                    ? g.category === 'retro' || g.category === 'audio'
                    : g.category === graphicFilter
                ).map(g => {
                  const isActive = activeGraphics.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGraphic(g.id)}
                      className="group flex flex-col justify-between p-3 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden"
                      style={{
                        background: isActive ? '#fcf9f2' : 'rgba(247,242,230,0.5)',
                        borderColor: isActive ? '#c94f00' : 'rgba(26,18,9,0.14)',
                        boxShadow: isActive ? '0 4px 14px rgba(201,79,0,0.15)' : 'none',
                      }}
                    >
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition group-hover:scale-110"
                          style={{ background: g.previewBg }}
                        >
                          {g.icon}
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition"
                          style={{
                            background: isActive ? '#c94f00' : 'rgba(26,18,9,0.08)',
                            color: isActive ? '#ffffff' : '#7a6e5f',
                          }}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3 h-3" /> Added
                            </>
                          ) : (
                            '+ Add'
                          )}
                        </span>
                      </div>

                      {/* Content */}
                      <div>
                        <div
                          className="text-xs font-bold leading-tight"
                          style={{ color: isActive ? '#c94f00' : '#1a1209' }}
                        >
                          {g.label}
                        </div>
                        <div
                          className="text-[10px] line-clamp-2 mt-1 leading-normal"
                          style={{ color: '#7a6e5f' }}
                        >
                          {g.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MOTION STYLES */}
          {activeTab === 'styles' && (
            <div className="space-y-4">
              <div className="pb-2 border-b" style={{ borderColor: 'rgba(26,18,9,0.12)' }}>
                <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: '#1a1209' }}>
                  Motion Typography
                </h2>
                <p className="text-[11px]" style={{ color: '#7a6e5f' }}>
                  Aesthetic kinetic text animations synced to words
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {MOTION_STYLES.map(s => {
                  const isSelected = motionStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setMotionStyle(s.id)}
                      className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative"
                      style={{
                        borderColor: isSelected ? '#c94f00' : 'rgba(26,18,9,0.15)',
                        background: isSelected ? '#fcf9f2' : 'rgba(247,242,230,0.5)',
                        boxShadow: isSelected ? '0 4px 14px rgba(201,79,0,0.14)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold" style={{ color: isSelected ? '#c94f00' : '#1a1209' }}>
                          {s.label}
                        </span>
                        {isSelected && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#c94f00' }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: '#7a6e5f' }}>
                        {s.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & LYRICS */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="pb-2 border-b" style={{ borderColor: 'rgba(26,18,9,0.12)' }}>
                <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: '#1a1209' }}>
                  Audio Track & Lyrics
                </h2>
                <p className="text-[11px]" style={{ color: '#7a6e5f' }}>
                  Upload any MP3 or transcribe with Groq Whisper AI
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                className="border-2 border-dashed rounded-2xl p-5 text-center relative cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: 'rgba(26,18,9,0.25)', background: 'rgba(26,18,9,0.03)' }}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Music className="w-6 h-6 mx-auto mb-2" style={{ color: '#c94f00' }} />
                <p className="text-xs font-bold" style={{ color: '#1a1209' }}>
                  {uploadedFile ? uploadedFile.name : 'Upload Any Song / Voiceover'}
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#7a6e5f' }}>
                  MP3, WAV, M4A up to 25MB
                </p>
              </div>

              {uploadedFile && (
                <div
                  className="p-3.5 rounded-2xl border space-y-2.5"
                  style={{ background: 'rgba(26,18,9,0.05)', borderColor: 'rgba(26,18,9,0.18)' }}
                >
                  <label className="text-[11px] font-bold block" style={{ color: '#1a1209' }}>
                    Groq API Key (Whisper AI):
                  </label>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs border rounded-lg px-2.5 py-1.5 font-mono"
                    style={{ background: '#f4edd8', borderColor: 'rgba(26,18,9,0.25)', color: '#1a1209' }}
                  />
                  <button
                    onClick={handleRunTranscription}
                    disabled={isTranscribing}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    style={{ background: '#c94f00' }}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {transcribeStatus || 'Transcribing Word-by-Word...'}
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Transcribe Word-by-Word
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Current Track Info */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between text-xs"
                style={{ borderColor: 'rgba(26,18,9,0.15)', background: '#fbf8f0' }}
              >
                <div>
                  <div className="font-bold truncate max-w-[220px]" style={{ color: '#1a1209' }}>
                    {songTitle}
                  </div>
                  <div className="text-[10px]" style={{ color: '#7a6e5f' }}>
                    {words.length} synced words · {lines.length} lines
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold" style={{ color: '#c94f00' }}>
                  {Math.floor(duration / 60)}:{(Math.floor(duration % 60) + '').padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: FORMAT & CANVAS */}
          {activeTab === 'canvas' && (
            <div className="space-y-4">
              <div className="pb-2 border-b" style={{ borderColor: 'rgba(26,18,9,0.12)' }}>
                <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: '#1a1209' }}>
                  Format & Typography
                </h2>
                <p className="text-[11px]" style={{ color: '#7a6e5f' }}>
                  Switch video aspect ratio and configure text scale
                </p>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a6e5f' }}>
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                    style={{
                      borderColor: orientation === 'portrait' ? '#c94f00' : 'rgba(26,18,9,0.15)',
                      background: orientation === 'portrait' ? '#fcf9f2' : 'rgba(247,242,230,0.5)',
                      boxShadow: orientation === 'portrait' ? '0 4px 14px rgba(201,79,0,0.12)' : 'none',
                    }}
                  >
                    <p className="text-xs font-extrabold" style={{ color: orientation === 'portrait' ? '#c94f00' : '#1a1209' }}>
                      📱 9:16 Portrait
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>
                      Reels & Shorts
                    </p>
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer"
                    style={{
                      borderColor: orientation === 'landscape' ? '#c94f00' : 'rgba(26,18,9,0.15)',
                      background: orientation === 'landscape' ? '#fcf9f2' : 'rgba(247,242,230,0.5)',
                      boxShadow: orientation === 'landscape' ? '0 4px 14px rgba(201,79,0,0.12)' : 'none',
                    }}
                  >
                    <p className="text-xs font-extrabold" style={{ color: orientation === 'landscape' ? '#c94f00' : '#1a1209' }}>
                      🖥️ 16:9 Landscape
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>
                      YouTube & Video
                    </p>
                  </button>
                </div>
              </div>

              {/* Typography Options */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(26,18,9,0.12)' }}>
                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer" style={{ color: '#1a1209' }}>
                  <span>UPPERCASE Typography</span>
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={e => setUppercase(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#c94f00' }}
                  />
                </label>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold" style={{ color: '#7a6e5f' }}>
                    <span>Font Size</span>
                    <span className="font-mono" style={{ color: '#c94f00' }}>
                      {fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="48"
                    max="110"
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#c94f00' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

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
