import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Upload, Sparkles, RotateCcw, Volume2, VolumeX,
  Layers, Type, Music, Loader2, Film, Zap,
} from 'lucide-react';
import defaultSongData from '../../data/defaultSong.json';
import { transcribeWithGroq } from '../../services/transcription';

// ─── Types ──────────────────────────────────────────────────────────────────
export type MotionStyle =
  | 'askew'     // Dense-Askew: tilting world, alternating angles per word, elastic spring pop
  | 'hook'      // Hook: full-frame single-word SLAM, bounce + implosion
  | 'verdict'   // Verdict: giant centered slam, glow burst, ink background
  | 'mask'      // Loom [MASK]: bone blocks that wipe left→right as word is sung
  | 'press'     // Dense-Press: words compressed beat-by-beat into a slab
  | 'mono'      // Stack / Open: IBM Plex Mono technical terminal with graph-paper grid
  | 'serif';    // Editorial / Fuse: luxury Cormorant Garamond float

interface TimedWord { word: string; start: number; end: number }
interface TimedLine  { i: number; text: string; start: number; end: number; words: TimedWord[] }

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const prog  = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp  = (a: number, b: number, k: number) => a + (b - a) * k;
const ease  = {
  outExpo:  (x: number) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  outBack:  (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  inCubic:  (x: number) => x * x * x,
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
};
const pulse = (t: number, t0: number, hw: number) => Math.max(0, 1 - Math.abs(t - t0) / hw);
const springStep = (dt: number, freq = 3, damp = 0.45) => {
  const w = freq * Math.PI * 2;
  const d = damp * w;
  const wd = Math.sqrt(Math.max(0, w * w - d * d));
  return wd > 0 ? 1 - Math.exp(-d * dt) * (Math.cos(wd * dt) + (d / wd) * Math.sin(wd * dt)) : 1;
};

// Paper colour palette (warm cream)
const C = {
  ink:     '#1a1209',      // near-black warm ink
  bone:    '#e8dcc8',      // warm off-white
  signal:  '#c94f00',      // burnt-orange signal
  ash:     '#7a6e5f',      // warm mid grey
  paper:   '#f4edd8',      // cream paper
  papDark: '#e0d4bc',      // slightly darker paper
};

// ─── Default data ────────────────────────────────────────────────────────────
const initialLines: TimedLine[] = ((defaultSongData as any).lines || []).map((l: any) => ({
  i: l.i, text: l.text, start: l.start, end: l.end,
  words: (l.words || []).map((w: any) => ({
    word: w.word || w.w || '',
    start: w.start, end: w.end,
  })),
}));

// ─── Component ───────────────────────────────────────────────────────────────
export const ShortsStudio: React.FC = () => {
  const [songTitle,    setSongTitle]    = useState<string>(defaultSongData.title);
  const [audioUrl,     setAudioUrl]     = useState<string>(defaultSongData.audioUrl);
  const [words,        setWords]        = useState<TimedWord[]>(defaultSongData.words as TimedWord[]);
  const [lines,        setLines]        = useState<TimedLine[]>(initialLines);
  const [duration,     setDuration]     = useState<number>(defaultSongData.duration);
  const [isPlaying,    setIsPlaying]    = useState<boolean>(false);
  const [currentTime,  setCurrentTime]  = useState<number>(0);
  const [isMuted,      setIsMuted]      = useState<boolean>(false);
  const [motionStyle,  setMotionStyle]  = useState<MotionStyle>('askew');
  const [fontSize,     setFontSize]     = useState<number>(72);
  const [uppercase,    setUppercase]    = useState<boolean>(true);
  const [groqKey,      setGroqKey]      = useState<string>(
    localStorage.getItem('recipecut_groq_key') || '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'
  );
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExporting,  setIsExporting]  = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [orientation,  setOrientation]  = useState<'portrait' | 'landscape'>('portrait');

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Audio sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying
      ? audioRef.current.play().catch(() => setIsPlaying(false))
      : audioRef.current.pause();
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(p => !p);

  const handleSeek = (time: number) => {
    const t = Math.max(0, Math.min(time, duration));
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const onAudioTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const onAudioLoadedMetadata = () => { if (audioRef.current?.duration) setDuration(audioRef.current.duration); };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadedFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    setIsPlaying(false); setCurrentTime(0);
  };

  // ── Transcription ──────────────────────────────────────────────────────────
  const handleRunTranscription = async () => {
    if (!uploadedFile) { alert('Please upload an audio file first!'); return; }
    if (!groqKey.trim()) { alert('Please enter your Groq API Key'); return; }
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
          const tw = { word: w, start: cue.startTime + wi * wdur, end: cue.startTime + (wi + 1) * wdur };
          newWords.push(tw); return tw;
        });
        newLines.push({ i: ci, text: cue.text, start: cue.startTime, end: cue.endTime, words: timedLineWords });
      });
      setWords(newWords); setLines(newLines);
      if (res.duration) setDuration(res.duration);
      setTranscribeStatus('Done ✓');
    } catch (err: any) {
      console.error(err); alert(`Transcription error: ${err.message || err}`);
    } finally { setIsTranscribing(false); }
  };

  const handleLoadDemoSong = () => {
    setSongTitle(defaultSongData.title); setAudioUrl(defaultSongData.audioUrl);
    setWords(defaultSongData.words as TimedWord[]); setLines(initialLines);
    setDuration(defaultSongData.duration); setIsPlaying(false); setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  };

  // ── CANVAS RENDERER ────────────────────────────────────────────────────────
  const renderFrame = useCallback((t: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const c = canvas.getContext('2d'); if (!c) return;
    const isLandscape = orientation === 'landscape';
    const W = isLandscape ? 1920 : 1080;
    const H = isLandscape ? 1080 : 1920;
    canvas.width = W; canvas.height = H;

    // ── WARM PAPER BACKGROUND ──────────────────────────────────────────────
    c.fillStyle = C.paper;
    c.fillRect(0, 0, W, H);

    // Subtle warm vignette
    const vig = c.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.85);
    vig.addColorStop(0,   'rgba(0,0,0,0)');
    vig.addColorStop(0.7, 'rgba(40,25,8,0.05)');
    vig.addColorStop(1,   'rgba(40,25,8,0.18)');
    c.fillStyle = vig;
    c.fillRect(0, 0, W, H);

    // ── WORD / LINE DETECTION ───────────────────────────────────────────────
    const curLine   = lines.find(l => t >= l.start && t < l.end) || lines.find(l => l.start <= t && l.end >= t - 0.5);
    const activeWord = words.find(w => t >= w.start && t < w.end);
    const fmt = (s: string) => uppercase ? s.toUpperCase() : s;

    // ── CENTER KINETIC ZONE ─────────────────────────────────────────────────
    c.save();
    c.translate(W * 0.5, H * 0.44);

    if (!curLine) {
      // ── Musical pause: floating rest symbol ──────────────────────────────
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const breathY = Math.sin(t * 1.4) * 18;
      c.font = `italic 400 48px "Cormorant Garamond", serif`;
      c.fillStyle = 'rgba(26,18,9,0.35)';
      c.fillText('♩', 0, breathY);
    } else {

      // ════════════════════════════════════════════════════════════════════
      // STYLE 1 — ASKEW (Dense-Askew: alternating angles, spring pop, badge)
      // Each word appears at its own tilt angle; active word gets orange badge
      // ════════════════════════════════════════════════════════════════════
      if (motionStyle === 'askew') {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const lw = curLine.words;
        const WPR = 2; // max 2 words per row — prevents overflow

        // ── Dynamic font scale: measure widest word, fit within safe slot ──
        const safeW = (W - 160) / WPR;       // safe slot width per word
        c.font = `900 ${fontSize}px "Archivo", sans-serif`;
        const maxMeasured = Math.max(...lw.map(w => c.measureText(fmt(w.word)).width), 1);
        const dynScale   = maxMeasured > safeW * 0.88 ? (safeW * 0.88) / maxMeasured : 1;
        const fs = fontSize * dynScale;        // safe font size

        const rows: TimedWord[][] = [];
        for (let i = 0; i < lw.length; i += WPR) rows.push(lw.slice(i, i + WPR));
        const rowH = fs * 1.72;
        const startY = -((rows.length - 1) * rowH) * 0.5;

        rows.forEach((row, ri) => {
          const rowY = startY + ri * rowH;
          const colW = (W - 120) / WPR;        // evenly divide safe canvas width
          const rowStartX = -((row.length - 1) * colW) * 0.5;

          row.forEach((w, wi) => {
            const gi = ri * WPR + wi;
            const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.14);
            const spoken = t >= w.start;
            const age = t - w.start;
            c.save();
            c.translate(rowStartX + wi * colW, rowY);

            // Alternating tilt: smaller angles to avoid overflow
            const tiltDeg = (gi % 2 === 0 ? -1 : 1) * (2.5 + (gi * 2.3) % 3.8);
            c.rotate(tiltDeg * Math.PI / 180);

            // Spring pop on new word
            let sc = spoken ? 1.0 : 0.86;
            if (isCur && age >= 0) {
              const sp = Math.min(1, age / 0.16);
              sc = 1 + 0.26 * Math.sin(sp * Math.PI) * Math.exp(-sp * 2.8);
            }
            c.scale(sc, sc);

            // Font mixture: Archivo / Cormorant / Mono alternating
            const fontDef = gi % 3 === 0
              ? `900 ${fs}px "Archivo", sans-serif`
              : gi % 3 === 1
              ? `italic 700 ${Math.round(fs * 1.15)}px "Cormorant Garamond", serif`
              : `700 ${Math.round(fs * 0.86)}px "IBM Plex Mono", monospace`;
            c.font = fontDef;
            const wt = fmt(w.word);
            const tw = c.measureText(wt).width;
            const bpad = fs * 0.36;

            if (isCur) {
              c.shadowColor = C.signal; c.shadowBlur = 20;
              roundRect(c, -tw / 2 - bpad, -fs * 0.64, tw + bpad * 2, fs * 1.26, 10);
              c.fillStyle = C.signal; c.fill();
              c.shadowBlur = 0;
              c.fillStyle = C.paper;
              c.fillText(wt, 0, 4);
            } else {
              c.fillStyle = spoken ? C.ink : 'rgba(26,18,9,0.20)';
              c.fillText(wt, 0, 4);
            }
            c.restore();
          });
        });
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 2 — HOOK (Full-frame single-word SLAM, scale-bounce + hold)
      // One word fills the frame, slams in with a jump-scale, holds, next
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'hook') {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const bigW = activeWord || curLine.words[0];
        if (bigW) {
          const age = Math.max(0, t - bigW.start);
          const slamK = ease.outExpo(Math.min(1, age / 0.14));
          const slamScale = 1 + 0.42 * (1 - slamK) + 0.018 * Math.min(age, 3);
          c.save();
          c.scale(slamScale, slamScale);

          // Calculate safe font size so long words never overflow
          let hookSz = fontSize * 2.0;
          c.font = `900 ${hookSz}px "Archivo", sans-serif`;
          const wordText = fmt(bigW.word);
          const mw = c.measureText(wordText).width;
          const maxHookW = W - 180;
          if (mw > maxHookW) {
            hookSz *= (maxHookW / mw);
            c.font = `900 ${hookSz}px "Archivo", sans-serif`;
          }

          // Ghost outline behind (like pdoom's n=3 hair variant)
          const ghostAlpha = clamp(1 - age / 1.5) * 0.18;
          if (ghostAlpha > 0) {
            c.strokeStyle = `rgba(26,18,9,${ghostAlpha})`;
            c.lineWidth = 3;
            c.strokeText(wordText, 0, 0);
          }
          // Impact glow ring on slam
          const impPulse = pulse(t, bigW.start, 0.12);
          if (impPulse > 0.01) {
            c.shadowColor = C.signal; c.shadowBlur = 55 * impPulse;
          }
          c.fillStyle = C.ink;
          c.fillText(wordText, 0, 0);
          c.shadowBlur = 0;
          c.restore();
          // Footnote: lyric line small below
          c.font = `400 24px "IBM Plex Mono", monospace`;
          c.fillStyle = C.ash;
          c.fillText(curLine.text, 0, hookSz * 0.5 + 50);
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 3 — VERDICT (Giant centered slam, glow burst, minimal)
      // Words wrap dynamically into punchy rows to never overflow!
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'verdict') {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const tSlam = curLine.start;
        const tHold = curLine.end - 0.2;
        if (t >= tSlam) {
          const dtSlam = t - tSlam;
          const slamScale = 1 + 0.32 * Math.exp(-dtSlam * 7);
          let implodeScale = 1, alpha = 1;
          if (t >= tHold) {
            const k = clamp((t - tHold) / 0.22);
            implodeScale = 1 - ease.inCubic(k);
            alpha = 1 - k * k;
          }
          c.save();
          c.scale(slamScale * implodeScale, slamScale * implodeScale);
          const impPulse = pulse(t, tSlam, 0.14);
          if (impPulse > 0.01) {
            c.shadowColor = C.signal; c.shadowBlur = 42 * impPulse;
          }

          // Dynamic wrap into lines that fit within maxSafeW
          const maxSafeW = W - 180;
          let testSz = fontSize * 1.5;
          c.font = `900 ${testSz}px "Archivo", sans-serif`;

          const rawWords = curLine.words.map(w => fmt(w.word));
          const vRows: string[] = [];
          let curVRow: string[] = [];
          const wordsPerVRow = isLandscape ? 4 : 2;

          for (const rw of rawWords) {
            const testRow = [...curVRow, rw].join(' ');
            if (curVRow.length > 0 && (c.measureText(testRow).width > maxSafeW || curVRow.length >= wordsPerVRow)) {
              vRows.push(curVRow.join(' '));
              curVRow = [rw];
            } else {
              curVRow.push(rw);
            }
          }
          if (curVRow.length > 0) vRows.push(curVRow.join(' '));

          // Check if any row still exceeds maxSafeW and scale testSz down
          const widestRow = Math.max(...vRows.map(r => c.measureText(r).width), 1);
          if (widestRow > maxSafeW) {
            testSz *= (maxSafeW / widestRow);
            c.font = `900 ${testSz}px "Archivo", sans-serif`;
          }

          const vRowH = testSz * 1.25;
          const vStartY = -((vRows.length - 1) * vRowH) * 0.5;

          c.fillStyle = `rgba(26,18,9,${alpha})`;
          vRows.forEach((r, ri) => {
            c.fillText(r, 0, vStartY + ri * vRowH);
          });

          c.shadowBlur = 0;
          // Mono subtitle
          c.font = `500 22px "IBM Plex Mono", monospace`;
          c.fillStyle = `rgba(201,79,0,${alpha * 0.8})`;
          c.fillText(`[ ${String(curLine.i).padStart(2,'0')} / VERDICT ]`, 0, vStartY + vRows.length * vRowH * 0.5 + 45);
          c.restore();
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 4 — MASK ([MASK] blocks that wipe left→right as word sung)
      // Bone-coloured block covers each word, hot scan-line at unmasking edge
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'mask') {
        c.textAlign = 'left'; c.textBaseline = 'middle';
        const lw = curLine.words;
        const sz = fontSize * 0.88;
        // measure total width to center
        c.font = `900 ${sz}px "Archivo", sans-serif`;
        const wordMetrics = lw.map(w => ({ w, tw: c.measureText(fmt(w.word)).width }));
        const totalW = wordMetrics.reduce((a, m) => a + m.tw + sz * 0.28, -sz * 0.28);
        const maxW = W - 160;
        const scale = Math.min(1, maxW / totalW);
        const scaledSz = sz * scale;
        c.font = `900 ${scaledSz}px "Archivo", sans-serif`;

        // Lay out rows
        const rowH = scaledSz * 1.5;
        const rows: { w: TimedWord; tw: number }[][] = [];
        let cur: { w: TimedWord; tw: number }[] = [];
        let curRowW = 0;
        const gap = scaledSz * 0.28;
        for (const m of wordMetrics.map(m => ({ ...m, tw: m.tw * scale }))) {
          if (curRowW + m.tw > maxW && cur.length > 0) {
            rows.push(cur); cur = []; curRowW = 0;
          }
          cur.push(m); curRowW += m.tw + gap;
        }
        if (cur.length) rows.push(cur);

        const totalRowH = rows.length * rowH;
        let rowY = -totalRowH * 0.5 + rowH * 0.5;

        rows.forEach(row => {
          const rowW = row.reduce((a, m) => a + m.tw + gap, -gap);
          let x = -rowW * 0.5;
          row.forEach(({ w, tw }) => {
            const p = clamp((t - w.start) / Math.max(0.05, w.end - w.start));
            const txt = fmt(w.word);
            // Revealed word behind
            c.fillStyle = p <= 0 ? 'rgba(0,0,0,0)' : p < 1 ? C.signal : C.ink;
            c.fillText(txt, x, rowY);
            // [MASK] block sliding away
            const cover = 1 - p;
            if (cover > 0) {
              const bx = x - 6, bw = tw + 12, by = rowY - scaledSz * 0.76, bh = scaledSz * 0.86;
              const cx2 = bx + bw * (1 - cover);
              c.fillStyle = C.bone;
              c.fillRect(cx2, by, bw * cover, bh);
              // [MASK] label inside
              c.save();
              c.beginPath(); c.rect(cx2, by, bw * cover, bh); c.clip();
              c.font = `600 ${scaledSz * 0.28}px "IBM Plex Mono", monospace`;
              c.textAlign = 'center';
              c.fillStyle = C.ink;
              c.fillText('[MASK]', bx + bw / 2, by + bh * 0.62);
              c.textAlign = 'left';
              c.restore();
              // Hot scan-line edge
              if (p > 0) {
                c.fillStyle = C.signal;
                c.fillRect(cx2 - 2.5, by - 4, 5, bh + 8);
              }
            }
            x += tw + gap;
          });
          rowY += rowH;
        });
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 5 — PRESS (Dense-Press: words compress kick by kick into a slab)
      // Words start spread, then get squished together beat-by-beat
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'press') {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const lw = curLine.words;
        const sz = fontSize * 1.05;
        // compress factor: how tight the words are packed (0=loose, 1=slab)
        const elapsed = Math.max(0, t - curLine.start);
        const pressK = Math.min(1, elapsed / Math.max(0.1, curLine.end - curLine.start));
        const lineSpacing = lerp(sz * 1.6, sz * 0.72, ease.outCubic(pressK));
        const WPR = 2;
        const rows: TimedWord[][] = [];
        for (let i = 0; i < lw.length; i += WPR) rows.push(lw.slice(i, i + WPR));
        const startY = -((rows.length - 1) * lineSpacing) * 0.5;
        rows.forEach((row, ri) => {
          const rowY = startY + ri * lineSpacing;
          // lerp horizontal gap from spread to packed
          const colW = lerp(220, 60, ease.outCubic(pressK));
          const rsx = -((row.length - 1) * colW) * 0.5;
          row.forEach((w, wi) => {
            const spoken = t >= w.start;
            c.save();
            c.translate(rsx + wi * colW, rowY);
            c.font = `900 ${sz}px "Archivo", sans-serif`;
            if (spoken) {
              c.fillStyle = C.ink;
              if (t >= w.start && t < w.end) {
                c.shadowColor = C.signal; c.shadowBlur = 18;
              }
            } else {
              c.fillStyle = 'rgba(26,18,9,0.22)';
            }
            c.fillText(fmt(w.word), 0, 0);
            c.shadowBlur = 0;
            c.restore();
          });
        });
        // Press frame indicators
        if (pressK > 0.5) {
          const barH = 3;
          c.fillStyle = C.signal;
          c.fillRect(-W * 0.38, -rows.length * lineSpacing * 0.5 - 16, W * 0.76, barH);
          c.fillRect(-W * 0.38,  rows.length * lineSpacing * 0.5 + 10, W * 0.76, barH);
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 6 — MONO (Stack / Open: IBM Plex Mono terminal, graph-paper)
      // Words reveal in monospace, technical deadpan annotation style
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'mono') {
        c.textAlign = 'left'; c.textBaseline = 'middle';
        const lw = curLine.words;
        const sz = Math.min(fontSize * 0.78, 62);
        const lh = sz * 1.55;
        const maxW = W - 180;
        // Wrap into rows
        c.font = `700 ${sz}px "IBM Plex Mono", monospace`;
        const rows: TimedWord[][] = [];
        let curRow: TimedWord[] = []; let curW = 0;
        const sp = c.measureText(' ').width;
        for (const w of lw) {
          const tw = c.measureText(w.word).width;
          if (curW + tw > maxW && curRow.length > 0) { rows.push(curRow); curRow = []; curW = 0; }
          curRow.push(w); curW += tw + sp;
        }
        if (curRow.length) rows.push(curRow);
        const totalH = rows.length * lh;
        let rowY = -totalH * 0.5 + lh * 0.5;
        rows.forEach(row => {
          const rowW = row.reduce((a, w) => a + c.measureText(w.word).width + sp, -sp);
          let x = -rowW * 0.5;
          row.forEach(w => {
            const tw = c.measureText(w.word).width;
            const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.14);
            const spoken = t >= w.start;
            if (isCur) {
              // Box cursor — monospace terminal cursor style
              c.fillStyle = C.signal;
              c.fillRect(x - 4, rowY - sz * 0.72, tw + 8, sz * 0.88);
              c.fillStyle = C.paper;
            } else if (spoken) {
              c.fillStyle = C.ink;
            } else {
              c.strokeStyle = 'rgba(26,18,9,0.30)';
              c.lineWidth = 1.2;
              // Draw outline only
              c.strokeText(fmt(w.word), x, rowY);
              x += tw + sp; return;
            }
            c.fillText(fmt(w.word), x, rowY);
            x += tw + sp;
          });
          rowY += lh;
        });
        // Annotation: > cursor and line info
        const lineNo = String(curLine.i).padStart(3, '0');
        c.font = `400 18px "IBM Plex Mono", monospace`;
        c.fillStyle = C.ash;
        c.textAlign = 'right';
        c.fillText(`› LINE ${lineNo}`, W * 0.4, totalH * 0.5 + 44);
        c.textAlign = 'left';
      }

      // ════════════════════════════════════════════════════════════════════
      // STYLE 7 — SERIF (Fuse / Editorial: Cormorant Garamond luxury float)
      // Full line in italic serif, gentle float, active word underscored
      // ════════════════════════════════════════════════════════════════════
      else if (motionStyle === 'serif') {
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const floatY = Math.sin(t * 1.6) * 14;
        c.save();
        c.translate(0, floatY);
        // Full line in Cormorant italic
        const sz = Math.min(fontSize * 1.25, 96);
        c.font = `italic 600 ${sz}px "Cormorant Garamond", serif`;
        c.fillStyle = C.ink;
        // Wrap if too wide
        const fullTxt = fmt(curLine.text);
        const maxW = W - 160;
        const totalTW = c.measureText(fullTxt).width;
        if (totalTW < maxW) {
          c.fillText(fullTxt, 0, -24);
        } else {
          const half = Math.ceil(curLine.words.length / 2);
          const r1 = curLine.words.slice(0, half).map(w => fmt(w.word)).join(' ');
          const r2 = curLine.words.slice(half).map(w => fmt(w.word)).join(' ');
          c.fillText(r1, 0, -sz * 0.68);
          c.fillText(r2, 0,  sz * 0.68);
        }
        // Active word: hot orange underline + glow word
        if (activeWord) {
          c.font = `italic 700 ${sz * 0.62}px "Cormorant Garamond", serif`;
          c.fillStyle = C.signal;
          c.shadowColor = C.signal; c.shadowBlur = 20;
          c.fillText(`✦  ${fmt(activeWord.word)}  ✦`, 0, sz * 1.2);
          c.shadowBlur = 0;
          // Thin underline
          const uw = c.measureText(`✦  ${fmt(activeWord.word)}  ✦`).width;
          c.fillStyle = C.signal;
          c.fillRect(-uw * 0.5, sz * 1.2 + sz * 0.38, uw, 2);
        }
        c.restore();
      }
    } // end if curLine

    c.restore(); // end center translate

    // ── BOTTOM CAPTION BAND (only thing besides kinetic type) ────────────────
    if (curLine) {
      const banY = H - (isLandscape ? 130 : 250);
      const banH = isLandscape ? 90 : 140;

      // Fade-up scrim from bottom
      const banGrad = c.createLinearGradient(0, banY - 40, 0, H);
      banGrad.addColorStop(0,   'rgba(244,237,216,0)');
      banGrad.addColorStop(0.25,'rgba(244,237,216,0.92)');
      banGrad.addColorStop(1,   'rgba(244,237,216,1)');
      c.fillStyle = banGrad;
      c.fillRect(0, banY - 40, W, H - (banY - 40));

      // Draw words one-by-one with spoken / active colouring
      const baseCapSz = isLandscape ? 32 : 40;
      c.font = `700 ${baseCapSz}px "Archivo", sans-serif`;
      c.textBaseline = 'middle';
      const lw = curLine.words;
      const sp = c.measureText(' ').width;
      const totalW2 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + sp, -sp);
      // If too wide, scale font down
      const capMaxW = W - 140;
      const capSz = totalW2 > capMaxW ? baseCapSz * (capMaxW / totalW2) : baseCapSz;
      c.font = `700 ${capSz}px "Archivo", sans-serif`;
      const spScaled = c.measureText(' ').width;
      const totalW3 = lw.reduce((a, w) => a + c.measureText(fmt(w.word)).width + spScaled, -spScaled);
      let bx = W * 0.5 - totalW3 * 0.5;
      const capY = banY + banH * 0.45;
      lw.forEach(w => {
        const isCur = !!(activeWord && activeWord.word === w.word && Math.abs(activeWord.start - w.start) < 0.14);
        const spoken = t >= w.start;
        const tw2 = c.measureText(fmt(w.word)).width;
        c.textAlign = 'left';
        c.fillStyle = isCur ? C.signal : spoken ? C.ink : C.ash;
        c.fillText(fmt(w.word), bx, capY);
        bx += tw2 + spScaled;
      });
      c.textAlign = 'left';
    }



  }, [songTitle, lines, words, motionStyle, fontSize, uppercase, orientation]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      let t = currentTime;
      if (audioRef.current && isPlaying) { t = audioRef.current.currentTime; setCurrentTime(t); }
      renderFrame(t);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, currentTime, renderFrame]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExportVideo = async () => {
    const canvas = canvasRef.current, audio = audioRef.current;
    if (!canvas || !audio) return;
    try {
      setIsExporting(true); setExportProgress(0); setIsPlaying(false);
      const stream = canvas.captureStream(60);
      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest); src.connect(audioCtx.destination);
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : 'video/webm;codecs=vp9';
      const rec = new MediaRecorder(new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]),
        { mimeType, videoBitsPerSecond: 14_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${songTitle.replace(/[^\w]/g, '_')}_9x16.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        a.click(); URL.revokeObjectURL(url);
        setIsExporting(false); setExportProgress(0);
      };
      rec.start(200);
      audio.currentTime = 0; audio.play();
      const tick = setInterval(() => {
        setExportProgress(Math.round((audio.currentTime / duration) * 100));
        if (audio.currentTime >= duration - 0.2) { clearInterval(tick); rec.stop(); audio.pause(); }
      }, 250);
    } catch (err) { console.error(err); setIsExporting(false); }
  };

  // ── Format time ────────────────────────────────────────────────────────────
  const fmt2 = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  // ── Motion style definitions ───────────────────────────────────────────────
  const STYLES: { id: MotionStyle; label: string; desc: string }[] = [
    { id: 'askew',   label: '⚡ Askew',    desc: 'Tilting angles + spring pop badge' },
    { id: 'hook',    label: '💥 Hook Slam', desc: 'Full-frame word slam + ghost' },
    { id: 'verdict', label: '⚖️ Verdict',  desc: 'Giant line slam + implosion' },
    { id: 'mask',    label: '▓ [MASK]',    desc: 'Bone blocks wipe left→right' },
    { id: 'press',   label: '🗜 Press',    desc: 'Words compress into slab' },
    { id: 'mono',    label: '> Mono',      desc: 'Terminal cursor + annotation' },
    { id: 'serif',   label: '✦ Serif',     desc: 'Cormorant float + underline' },
  ];

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ background: '#f4edd8', fontFamily: '"IBM Plex Mono", monospace', color: '#1a1209' }}>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div className="h-13 border-b flex items-center justify-between px-6 shrink-0 z-10"
        style={{ borderColor: 'rgba(26,18,9,0.18)', background: '#ede4cc' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{ background: '#c94f00', borderColor: 'rgba(201,79,0,0.4)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: '#1a1209' }}>
              Kinetic Shorts Studio
              <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold"
                style={{ background: 'rgba(201,79,0,0.12)', color: '#c94f00', borderColor: 'rgba(201,79,0,0.3)' }}>
                {orientation === 'portrait' ? '1080×1920 (9:16)' : '1920×1080 (16:9)'}
              </span>
            </h1>
            <p className="text-[10px]" style={{ color: '#7a6e5f' }}>pdoom motion styles · warm paper</p>
          </div>
        </div>

        {/* ── PORTRAIT / LANDSCAPE FORMAT TOGGLE IN TOP BAR ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl border"
          style={{ background: '#e0d4bc', borderColor: 'rgba(26,18,9,0.18)' }}>
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
          <button onClick={handleLoadDemoSong}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5"
            style={{ background: '#e8dcc8', borderColor: 'rgba(26,18,9,0.22)', color: '#1a1209' }}>
            <Music className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />
            Load "Better on My Own"
          </button>
          <button onClick={handleExportVideo} disabled={isExporting}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: '#c94f00', boxShadow: '0 4px 14px rgba(201,79,0,0.3)' }}>
            {isExporting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rendering ({exportProgress}%)...</>
              : <><Film className="w-3.5 h-3.5" />Export {orientation === 'portrait' ? '9:16' : '16:9'} Video</>}
          </button>
        </div>
      </div>

      {/* ── HIDDEN AUDIO ────────────────────────────────────────────────────── */}
      <audio ref={audioRef} src={audioUrl}
        onTimeUpdate={onAudioTimeUpdate} onLoadedMetadata={onAudioLoadedMetadata}
        onEnded={() => setIsPlaying(false)} muted={isMuted} />

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="w-88 border-r overflow-y-auto p-5 space-y-6 shrink-0 [scrollbar-width:none]"
          style={{ borderColor: 'rgba(26,18,9,0.14)', background: '#ede4cc', width: '348px' }}>

          {/* Audio Upload */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: '#7a6e5f' }}>
              <Upload className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />1. Audio Track
            </h2>
            <div className="border-2 border-dashed rounded-xl p-4 text-center relative cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderColor: 'rgba(26,18,9,0.25)', background: 'rgba(26,18,9,0.03)' }}>
              <input type="file" accept="audio/*" onChange={handleAudioUpload}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              <Music className="w-5 h-5 mx-auto mb-2" style={{ color: '#7a6e5f' }} />
              <p className="text-xs font-medium" style={{ color: '#1a1209' }}>
                {uploadedFile ? uploadedFile.name : 'Upload Any Song / Voiceover'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>MP3, WAV, M4A up to 25MB</p>
            </div>

            {uploadedFile && (
              <div className="p-3 rounded-xl border space-y-2"
                style={{ background: 'rgba(26,18,9,0.05)', borderColor: 'rgba(26,18,9,0.18)' }}>
                <label className="text-[11px] font-medium block" style={{ color: '#1a1209' }}>
                  Groq API Key:
                </label>
                <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full text-xs border rounded px-2.5 py-1.5 font-mono"
                  style={{ background: '#f4edd8', borderColor: 'rgba(26,18,9,0.25)', color: '#1a1209' }} />
                <button onClick={handleRunTranscription} disabled={isTranscribing}
                  className="w-full py-1.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: '#c94f00' }}>
                  {isTranscribing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{transcribeStatus || 'Transcribing...'}</>
                    : <><Zap className="w-3.5 h-3.5" />Transcribe Word-by-Word</>}
                </button>
              </div>
            )}
          </div>

          {/* Motion Style */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: '#7a6e5f' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />2. Motion Style
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setMotionStyle(s.id)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: motionStyle === s.id ? '#c94f00' : 'rgba(26,18,9,0.18)',
                    background: motionStyle === s.id ? 'rgba(201,79,0,0.10)' : 'rgba(26,18,9,0.03)',
                  }}>
                  <p className="text-xs font-bold" style={{ color: '#1a1209' }}>{s.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio / Format Selector */}
          <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(26,18,9,0.14)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: '#7a6e5f' }}>
              <Film className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />3. Aspect Ratio / Format
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrientation('portrait')}
                className="p-3 rounded-xl border text-left transition-all"
                style={{
                  borderColor: orientation === 'portrait' ? '#c94f00' : 'rgba(26,18,9,0.18)',
                  background: orientation === 'portrait' ? 'rgba(201,79,0,0.12)' : 'rgba(26,18,9,0.03)',
                }}
              >
                <p className="text-xs font-bold" style={{ color: '#1a1209' }}>📱 9:16 Portrait</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>Shorts & Reels</p>
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className="p-3 rounded-xl border text-left transition-all"
                style={{
                  borderColor: orientation === 'landscape' ? '#c94f00' : 'rgba(26,18,9,0.18)',
                  background: orientation === 'landscape' ? 'rgba(201,79,0,0.12)' : 'rgba(26,18,9,0.03)',
                }}
              >
                <p className="text-xs font-bold" style={{ color: '#1a1209' }}>🖥️ 16:9 Landscape</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#7a6e5f' }}>YouTube & TV</p>
              </button>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(26,18,9,0.14)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: '#7a6e5f' }}>
              <Type className="w-3.5 h-3.5" style={{ color: '#c94f00' }} />4. Typography
            </h2>
            <label className="flex items-center justify-between text-xs cursor-pointer"
              style={{ color: '#1a1209' }}>
              <span>UPPERCASE Words</span>
              <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: '#c94f00' }} />
            </label>
            <div>
              <div className="flex justify-between text-[11px] mb-1" style={{ color: '#7a6e5f' }}>
                <span>Word Size</span>
                <span className="font-mono" style={{ color: '#1a1209' }}>{fontSize}px</span>
              </div>
              <input type="range" min="48" max="110" value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#c94f00' }} />
            </div>
          </div>
        </div>

        {/* ── CENTER: VIDEO PREVIEW + CONTROLS ─────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-hidden"
          style={{ background: '#e8dcc8' }}>

          {/* Canvas Container — dynamically adapts to 9:16 or 16:9 */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden">
            <div
              className="relative rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300"
              style={{
                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                maxHeight: orientation === 'portrait' ? '74vh' : '55vh',
                maxWidth: orientation === 'portrait' ? 'min(calc(74vh * 9 / 16), 46vw)' : 'min(calc(55vh * 16 / 9), 70vw)',
                width: '100%',
                borderColor: 'rgba(26,18,9,0.25)',
                boxShadow: '0 24px 60px rgba(26,18,9,0.22)',
              }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
                onClick={togglePlay}
              />
            </div>
          </div>

          {/* External Playback Controls */}
          <div className="w-full max-w-xl rounded-2xl p-4 shadow-xl mt-4 shrink-0 flex flex-col gap-3 border"
            style={{ background: '#ede4cc', borderColor: 'rgba(26,18,9,0.18)' }}>
            <input type="range" min="0" max={duration || 100} step="0.05" value={currentTime}
              onChange={e => handleSeek(Number(e.target.value))}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: '#c94f00', background: 'rgba(26,18,9,0.15)' }} />
            <div className="flex items-center justify-between text-xs" style={{ color: '#7a6e5f' }}>
              <span className="font-mono w-16">{fmt2(currentTime)}</span>
              <div className="flex items-center gap-5">
                <button onClick={() => handleSeek(currentTime - 5)}
                  className="p-2 rounded-full hover:opacity-70 transition-opacity">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={togglePlay}
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ background: '#c94f00', boxShadow: '0 4px 16px rgba(201,79,0,0.35)' }}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:opacity-70 transition-opacity">
                  {isMuted
                    ? <VolumeX className="w-4 h-4" style={{ color: '#c94f00' }} />
                    : <Volume2 className="w-4 h-4" />}
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
