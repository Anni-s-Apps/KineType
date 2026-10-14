import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Music,
  Sliders,
  Upload,
  Zap,
  Loader2,
  Check,
  Plus,
  Wand2,
} from 'lucide-react';
import { MOTION_STYLES } from '../styles';
import { GRAPHIC_OPTIONS } from '../graphics';
import { GraphicThumbnail } from './GraphicThumbnail';
import { StyleThumbnail } from './StyleThumbnail';
import { AiStylePromptModal } from './AiStylePromptModal';

export interface StudioSidebarProps {
  activeTab: 'graphics' | 'styles' | 'audio' | 'canvas';
  setActiveTab: (t: 'graphics' | 'styles' | 'audio' | 'canvas') => void;
  graphicFilter: 'all' | 'nature' | 'cinematic' | 'retro';
  setGraphicFilter: (f: 'all' | 'nature' | 'cinematic' | 'retro') => void;
  activeGraphics: string[];
  toggleGraphic: (id: string) => void;
  setActiveGraphics: (items: string[]) => void;
  motionStyle: string;
  setMotionStyle: (s: string) => void;
  orientation: 'portrait' | 'landscape';
  setOrientation: (o: 'portrait' | 'landscape') => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  uppercase: boolean;
  setUppercase: (u: boolean) => void;
  uploadedFile: File | null;
  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  groqKey: string;
  setGroqKey: (k: string) => void;
  handleRunTranscription: () => void;
  isTranscribing: boolean;
  transcribeStatus: string;
  songTitle: string;
  wordsCount: number;
  linesCount: number;
  duration: number;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  activeTab,
  setActiveTab,
  graphicFilter,
  setGraphicFilter,
  activeGraphics,
  toggleGraphic,
  setActiveGraphics,
  motionStyle,
  setMotionStyle,
  orientation,
  setOrientation,
  fontSize,
  setFontSize,
  uppercase,
  setUppercase,
  uploadedFile,
  handleAudioUpload,
  groqKey,
  setGroqKey,
  handleRunTranscription,
  isTranscribing,
  transcribeStatus,
  songTitle,
  wordsCount,
  linesCount,
  duration,
}) => {
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <div
      className="flex flex-row shrink-0 h-full select-none border-r"
      style={{
        background: '#f4ede0',
        borderColor: 'rgba(28,21,13,0.12)',
      }}
    >
      {/* ── 1. SOFT SANDY ICON RAIL ───────────────────────────────────────── */}
      <div
        className="flex flex-col items-center py-4 px-2 border-r shrink-0 gap-2.5"
        style={{
          width: '64px',
          background: '#ece3cf',
          borderColor: 'rgba(28,21,13,0.12)',
        }}
      >
        {/* Motifs Tab */}
        <button
          onClick={() => setActiveTab('graphics')}
          className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'graphics' ? 'shadow-sm' : 'hover:bg-black/5 opacity-80 hover:opacity-100'
          }`}
          style={{
            background: activeTab === 'graphics' ? '#d95d39' : 'transparent',
            color: activeTab === 'graphics' ? '#ffffff' : '#4a3f31',
          }}
          title="Decorative Overlays & Motifs"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5">Motifs</span>
          {activeGraphics.length > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8.5px] font-bold flex items-center justify-center shadow-xs"
              style={{
                background: activeTab === 'graphics' ? '#1c150d' : '#d95d39',
                color: '#ffffff',
              }}
            >
              {activeGraphics.length}
            </span>
          )}
        </button>

        {/* Styles Tab */}
        <button
          onClick={() => setActiveTab('styles')}
          className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'styles' ? 'shadow-sm' : 'hover:bg-black/5 opacity-80 hover:opacity-100'
          }`}
          style={{
            background: activeTab === 'styles' ? '#d95d39' : 'transparent',
            color: activeTab === 'styles' ? '#ffffff' : '#4a3f31',
          }}
          title="Kinetic Typography Styles"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5">Styles</span>
        </button>

        {/* Audio Tab */}
        <button
          onClick={() => setActiveTab('audio')}
          className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'audio' ? 'shadow-sm' : 'hover:bg-black/5 opacity-80 hover:opacity-100'
          }`}
          style={{
            background: activeTab === 'audio' ? '#d95d39' : 'transparent',
            color: activeTab === 'audio' ? '#ffffff' : '#4a3f31',
          }}
          title="Audio Track & Sync"
        >
          <Music className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5">Audio</span>
        </button>

        {/* Format Tab */}
        <button
          onClick={() => setActiveTab('canvas')}
          className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'canvas' ? 'shadow-sm' : 'hover:bg-black/5 opacity-80 hover:opacity-100'
          }`}
          style={{
            background: activeTab === 'canvas' ? '#d95d39' : 'transparent',
            color: activeTab === 'canvas' ? '#ffffff' : '#4a3f31',
          }}
          title="Canvas & Format"
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5">Format</span>
        </button>
      </div>

      {/* ── 2. SOFT SANDY DRAWER PANEL ────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 h-full overflow-hidden"
        style={{
          width: '390px',
          background: '#f6f0e4',
        }}
      >
        {/* ══ TAB 1: GRAPHICS & BOTANICAL MOTIFS ═══════════════════════════ */}
        {activeTab === 'graphics' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between shrink-0"
              style={{
                borderColor: 'rgba(28,21,13,0.10)',
                background: '#eee5d5',
              }}
            >
              <div>
                <h3 className="text-sm font-bold text-[#1c150d] tracking-tight">
                  Visual Motifs & Elements
                </h3>
                <p className="text-[11px] text-[#7a6e60]">
                  Click to add decoration onto video canvas
                </p>
              </div>

              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  background: 'rgba(217,93,57,0.12)',
                  borderColor: 'rgba(217,93,57,0.35)',
                  color: '#d95d39',
                }}
              >
                {activeGraphics.length} Active
              </span>
            </div>

            {/* Filter Pills & Actions */}
            <div
              className="px-3.5 py-2.5 border-b flex items-center justify-between gap-1 shrink-0"
              style={{
                borderColor: 'rgba(28,21,13,0.08)',
                background: '#f2eae0',
              }}
            >
              {/* Filter */}
              <div
                className="flex gap-1 p-0.5 rounded-lg border"
                style={{
                  background: 'rgba(28,21,13,0.05)',
                  borderColor: 'rgba(28,21,13,0.08)',
                }}
              >
                {[
                  { id: 'all', label: 'All' },
                  { id: 'nature', label: 'Nature' },
                  { id: 'cinematic', label: 'Cinema' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGraphicFilter(cat.id as any)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer"
                    style={{
                      background: graphicFilter === cat.id ? '#ffffff' : 'transparent',
                      color: graphicFilter === cat.id ? '#d95d39' : '#6b5e50',
                      boxShadow: graphicFilter === cat.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Fast Presets */}
              <div className="flex gap-1.5 text-[10.5px]">
                <button
                  onClick={() => setActiveGraphics(['tree', 'floral', 'petals'])}
                  className="px-2.5 py-1 rounded-md font-semibold border transition hover:opacity-90 cursor-pointer"
                  style={{
                    background: '#fdfbf7',
                    borderColor: 'rgba(28,21,13,0.16)',
                    color: '#1c150d',
                  }}
                >
                  Nature
                </button>
                <button
                  onClick={() => setActiveGraphics([])}
                  className="px-2.5 py-1 rounded-md font-semibold border transition hover:opacity-90 cursor-pointer text-[#8c7e6e]"
                  style={{
                    background: '#fdfbf7',
                    borderColor: 'rgba(28,21,13,0.16)',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 3-COLUMN SOFT ROUNDED GRID */}
            <div className="flex-1 p-3 overflow-y-auto [scrollbar-width:thin]">
              <div className="grid grid-cols-3 gap-2.5">
                {GRAPHIC_OPTIONS.filter(g =>
                  graphicFilter === 'all' ? true : g.category === graphicFilter
                ).map(g => {
                  const isActive = activeGraphics.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGraphic(g.id)}
                      className="group flex flex-col rounded-xl border transition-all text-left cursor-pointer overflow-hidden relative shadow-xs hover:shadow-sm"
                      style={{
                        borderColor: isActive ? '#d95d39' : 'rgba(28,21,13,0.14)',
                        background: isActive ? '#fffaf4' : '#fdfbf7',
                        boxShadow: isActive ? '0 0 0 1.5px #d95d39' : '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Thumbnail Container (Auto-Fit Live Preview) */}
                      <div
                        className="w-full aspect-square relative border-b overflow-hidden rounded-t-xl bg-[#f8f4ec]"
                        style={{ borderColor: 'rgba(28,21,13,0.08)' }}
                      >
                        <GraphicThumbnail id={g.id} />

                        {/* Soft Pill Badge */}
                        <div
                          className="absolute top-1.5 right-1.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs transition"
                          style={{
                            background: isActive ? '#d95d39' : 'rgba(255,255,255,0.85)',
                            color: isActive ? '#ffffff' : '#6b5e50',
                          }}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-2.5 h-2.5" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-2.5 h-2.5" /> Add
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info Text */}
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div
                          className="text-[11px] font-bold truncate leading-tight"
                          style={{ color: isActive ? '#d95d39' : '#1c150d' }}
                        >
                          {g.label}
                        </div>
                        <div className="text-[9px] truncate mt-0.5 text-[#857767] leading-tight">
                          {g.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: MOTION TYPOGRAPHY ═════════════════════════════════════ */}
        {activeTab === 'styles' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className="p-4 border-b flex items-center justify-between shrink-0"
              style={{
                borderColor: 'rgba(28,21,13,0.10)',
                background: '#eee5d5',
              }}
            >
              <div>
                <h3 className="text-sm font-bold text-[#1c150d] tracking-tight">
                  Kinetic Typography
                </h3>
                <p className="text-[11px] text-[#7a6e60]">
                  Word-synced kinetic animation engines
                </p>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border uppercase"
                style={{
                  background: 'rgba(217,93,57,0.12)',
                  borderColor: 'rgba(217,93,57,0.35)',
                  color: '#d95d39',
                }}
              >
                {motionStyle}
              </span>
            </div>

            {/* 2-COLUMN STYLES GRID WITH REAL VIDEO FRAME PREVIEWS */}
            <div className="flex-1 p-3 overflow-y-auto [scrollbar-width:thin]">
              <div className="grid grid-cols-2 gap-2.5">
                {MOTION_STYLES.map(s => {
                  const isSelected = motionStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setMotionStyle(s.id)}
                      className="group flex flex-col rounded-xl border transition-all text-left cursor-pointer overflow-hidden relative shadow-xs hover:shadow-sm"
                      style={{
                        borderColor: isSelected ? '#d95d39' : 'rgba(28,21,13,0.14)',
                        background: isSelected ? '#fffaf4' : '#fdfbf7',
                        boxShadow: isSelected ? '0 0 0 1.5px #d95d39' : '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Real Kinetic Style Frame Preview */}
                      <div
                        className="w-full aspect-[16/10] relative border-b overflow-hidden rounded-t-xl bg-[#f8f4ec]"
                        style={{ borderColor: 'rgba(28,21,13,0.08)' }}
                      >
                        <StyleThumbnail id={s.id} />

                        {/* Status Badge */}
                        <div
                          className="absolute top-1.5 right-1.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs transition"
                          style={{
                            background: isSelected ? '#d95d39' : 'rgba(255,255,255,0.85)',
                            color: isSelected ? '#ffffff' : '#6b5e50',
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-2.5 h-2.5" /> Active
                            </>
                          ) : (
                            'Select'
                          )}
                        </div>
                      </div>

                      {/* Clean Style Title */}
                      <div className="px-2.5 py-2 flex items-center justify-between">
                        <span
                          className="text-[12px] font-bold truncate leading-tight tracking-tight"
                          style={{ color: isSelected ? '#d95d39' : '#1c150d' }}
                        >
                          {s.label}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d95d39] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Create Custom Style with AI Card */}
                <button
                  onClick={() => setShowAiModal(true)}
                  className="group flex flex-col rounded-xl border border-dashed transition-all text-left cursor-pointer overflow-hidden relative shadow-xs hover:shadow-sm"
                  style={{
                    borderColor: 'rgba(217,93,57,0.40)',
                    background: '#faf4ea',
                  }}
                >
                  <div
                    className="w-full aspect-[16/10] relative border-b flex flex-col items-center justify-center p-3 text-center overflow-hidden rounded-t-xl"
                    style={{ borderColor: 'rgba(217,93,57,0.15)', background: '#f5ede0' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs mb-1.5 transition group-hover:scale-105"
                      style={{ background: '#d95d39' }}
                    >
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <span className="text-[9.5px] font-bold text-[#d95d39] uppercase tracking-wider">
                      Custom Engine
                    </span>
                  </div>

                  <div className="px-2.5 py-2 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#1c150d] group-hover:text-[#d95d39] transition">
                      Create with AI
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(217,93,57,0.12)', color: '#d95d39' }}
                    >
                      Prompt
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3: AUDIO & SYNC ══════════════════════════════════════════ */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className="p-4 border-b shrink-0"
              style={{
                borderColor: 'rgba(28,21,13,0.10)',
                background: '#eee5d5',
              }}
            >
              <h3 className="text-sm font-bold text-[#1c150d] tracking-tight">
                Audio Track & Lyrics
              </h3>
              <p className="text-[11px] text-[#7a6e60]">
                Upload track or align timestamps with Groq AI
              </p>
            </div>

            <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto [scrollbar-width:thin]">
              {/* Dropzone */}
              <div
                className="border-2 border-dashed rounded-xl p-5 text-center relative cursor-pointer hover:bg-black/5 transition"
                style={{ borderColor: 'rgba(28,21,13,0.22)', background: '#fdfbf7' }}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#d95d39' }} />
                <p className="text-xs font-bold text-[#1c150d]">
                  {uploadedFile ? uploadedFile.name : 'Upload Audio Track'}
                </p>
                <p className="text-[10px] mt-0.5 text-[#7a6e60]">
                  MP3, WAV, M4A up to 25MB
                </p>
              </div>

              {uploadedFile && (
                <div
                  className="p-3.5 rounded-xl border space-y-2.5"
                  style={{ borderColor: 'rgba(28,21,13,0.16)', background: '#fdfbf7' }}
                >
                  <label className="text-[11px] font-bold block text-[#1c150d]">
                    Groq API Key (Whisper AI):
                  </label>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs border rounded-lg px-2.5 py-1.5 font-mono"
                    style={{ background: '#fcfaf6', borderColor: 'rgba(28,21,13,0.22)', color: '#1c150d' }}
                  />
                  <button
                    onClick={handleRunTranscription}
                    disabled={isTranscribing}
                    className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    style={{ background: '#d95d39' }}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {transcribeStatus || 'Transcribing...'}
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

              {/* Track Metadata Card */}
              <div
                className="p-3.5 rounded-xl border"
                style={{ borderColor: 'rgba(28,21,13,0.14)', background: '#fdfbf7' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-[#7a6e60] tracking-wider uppercase">Current Track</span>
                  <span className="text-[10px] font-mono font-bold text-[#d95d39]">
                    {Math.floor(duration / 60)}:{(Math.floor(duration % 60) + '').padStart(2, '0')}
                  </span>
                </div>
                <div className="font-bold truncate text-xs text-[#1c150d]">
                  {songTitle}
                </div>
                <div className="text-[10px] mt-2 pt-2 border-t flex justify-between text-[#7a6e60]" style={{ borderColor: 'rgba(28,21,13,0.08)' }}>
                  <span>{wordsCount} timed words</span>
                  <span>{linesCount} lines</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: FORMAT & CANVAS DRAFTING ══════════════════════════════ */}
        {activeTab === 'canvas' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className="p-4 border-b shrink-0"
              style={{
                borderColor: 'rgba(28,21,13,0.10)',
                background: '#eee5d5',
              }}
            >
              <h3 className="text-sm font-bold text-[#1c150d] tracking-tight">
                Canvas & Format
              </h3>
              <p className="text-[11px] text-[#7a6e60]">
                Orientation and font scale controls
              </p>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto [scrollbar-width:thin]">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-2 text-[#7a6e60]">
                  Video Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      borderColor: orientation === 'portrait' ? '#d95d39' : 'rgba(28,21,13,0.15)',
                      background: orientation === 'portrait' ? '#fffaf4' : '#fdfbf7',
                      boxShadow: orientation === 'portrait' ? '0 0 0 1.5px #d95d39' : 'none',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: orientation === 'portrait' ? '#d95d39' : '#1c150d' }}>
                      9:16 Portrait
                    </div>
                    <div className="text-[10px] mt-0.5 text-[#7a6e60]">
                      Shorts & Reels
                    </div>
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      borderColor: orientation === 'landscape' ? '#d95d39' : 'rgba(28,21,13,0.15)',
                      background: orientation === 'landscape' ? '#fffaf4' : '#fdfbf7',
                      boxShadow: orientation === 'landscape' ? '0 0 0 1.5px #d95d39' : 'none',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: orientation === 'landscape' ? '#d95d39' : '#1c150d' }}>
                      16:9 Landscape
                    </div>
                    <div className="text-[10px] mt-0.5 text-[#7a6e60]">
                      YouTube & Video
                    </div>
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div className="pt-3 border-t space-y-3" style={{ borderColor: 'rgba(28,21,13,0.10)' }}>
                <label className="flex items-center justify-between text-xs font-bold cursor-pointer text-[#1c150d]">
                  <span>UPPERCASE Typography</span>
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={e => setUppercase(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#d95d39' }}
                  />
                </label>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-[#7a6e60]">
                    <span>Word Font Size</span>
                    <span className="font-mono" style={{ color: '#d95d39' }}>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="48"
                    max="110"
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#d95d39' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Style Prompt Modal */}
      <AiStylePromptModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
    </div>
  );
};
