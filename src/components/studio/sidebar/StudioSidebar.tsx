import React from 'react';
import {
  Sparkles,
  Layers,
  Music,
  Sliders,
  Upload,
  Zap,
  Loader2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { MOTION_STYLES } from '../styles';
import { GRAPHIC_OPTIONS } from '../graphics';
import { GraphicThumbnail } from './GraphicThumbnail';

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
  return (
    <div
      className="flex flex-row shrink-0 h-full select-none border-r"
      style={{
        background: '#ece3ca',
        borderColor: 'rgba(26,18,9,0.22)',
      }}
    >
      {/* ── 1. BOOKBINDER SPINE / VERTICAL INDEX TABS ────────────────────── */}
      <div
        className="flex flex-col items-center justify-between py-4 border-r shrink-0"
        style={{
          width: '54px',
          background: '#e3d7bb',
          borderColor: 'rgba(26,18,9,0.20)',
        }}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Top Logo Monogram */}
          <div
            className="w-8 h-8 rounded-sm border flex items-center justify-center font-mono font-black text-xs tracking-tighter mb-2"
            style={{
              borderColor: 'rgba(26,18,9,0.3)',
              background: '#f4eedb',
              color: '#c94f00',
            }}
          >
            §M
          </div>

          {/* Tab 1: Motifs / Graphics */}
          <button
            onClick={() => setActiveTab('graphics')}
            className="w-9 h-11 flex flex-col items-center justify-center border transition relative cursor-pointer"
            style={{
              borderColor: activeTab === 'graphics' ? '#c94f00' : 'rgba(26,18,9,0.18)',
              background: activeTab === 'graphics' ? '#c94f00' : '#ece3ca',
              color: activeTab === 'graphics' ? '#fff' : '#4a3d2e',
              boxShadow: activeTab === 'graphics' ? '0 2px 6px rgba(201,79,0,0.25)' : 'none',
            }}
            title="Aesthetic Motifs & Overlays"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[7.5px] font-mono tracking-wider uppercase mt-0.5">MOTIF</span>
            {activeGraphics.length > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[7.5px] font-mono font-bold px-1 border"
                style={{
                  background: '#1a1209',
                  color: '#ffffff',
                  borderColor: '#e3d7bb',
                }}
              >
                {activeGraphics.length}
              </span>
            )}
          </button>

          {/* Tab 2: Typography / Motion */}
          <button
            onClick={() => setActiveTab('styles')}
            className="w-9 h-11 flex flex-col items-center justify-center border transition cursor-pointer"
            style={{
              borderColor: activeTab === 'styles' ? '#c94f00' : 'rgba(26,18,9,0.18)',
              background: activeTab === 'styles' ? '#c94f00' : '#ece3ca',
              color: activeTab === 'styles' ? '#fff' : '#4a3d2e',
              boxShadow: activeTab === 'styles' ? '0 2px 6px rgba(201,79,0,0.25)' : 'none',
            }}
            title="Kinetic Motion Typography"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[7.5px] font-mono tracking-wider uppercase mt-0.5">TYPE</span>
          </button>

          {/* Tab 3: Audio & Sync */}
          <button
            onClick={() => setActiveTab('audio')}
            className="w-9 h-11 flex flex-col items-center justify-center border transition cursor-pointer"
            style={{
              borderColor: activeTab === 'audio' ? '#c94f00' : 'rgba(26,18,9,0.18)',
              background: activeTab === 'audio' ? '#c94f00' : '#ece3ca',
              color: activeTab === 'audio' ? '#fff' : '#4a3d2e',
              boxShadow: activeTab === 'audio' ? '0 2px 6px rgba(201,79,0,0.25)' : 'none',
            }}
            title="Audio Track & Syllables"
          >
            <Music className="w-4 h-4" />
            <span className="text-[7.5px] font-mono tracking-wider uppercase mt-0.5">TRACK</span>
          </button>

          {/* Tab 4: Format & Canvas */}
          <button
            onClick={() => setActiveTab('canvas')}
            className="w-9 h-11 flex flex-col items-center justify-center border transition cursor-pointer"
            style={{
              borderColor: activeTab === 'canvas' ? '#c94f00' : 'rgba(26,18,9,0.18)',
              background: activeTab === 'canvas' ? '#c94f00' : '#ece3ca',
              color: activeTab === 'canvas' ? '#fff' : '#4a3d2e',
              boxShadow: activeTab === 'canvas' ? '0 2px 6px rgba(201,79,0,0.25)' : 'none',
            }}
            title="Drafting & Format"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[7.5px] font-mono tracking-wider uppercase mt-0.5">FMT</span>
          </button>
        </div>

        {/* Bottom Spine Catalog Mark */}
        <div className="rotate-180 writing-vertical-lr text-[8px] font-mono tracking-widest uppercase opacity-40 text-[#1a1209]">
          ATELIER · 2026
        </div>
      </div>

      {/* ── 2. EDITORIAL SPECIMEN DRAWER PANEL ───────────────────────────── */}
      <div
        className="flex flex-col shrink-0 h-full overflow-hidden"
        style={{
          width: '395px',
          background: '#ede4cb',
        }}
      >
        {/* ══ TAB 1: GRAPHICS & BOTANICAL MOTIFS ═══════════════════════════ */}
        {activeTab === 'graphics' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Plate */}
            <div
              className="p-3.5 border-b flex items-center justify-between shrink-0"
              style={{
                borderColor: 'rgba(26,18,9,0.18)',
                background: '#e6dac0',
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#c94f00]">
                    PLATE · COLLECTION
                  </span>
                  <span className="text-[8px] font-mono opacity-50">§ 01</span>
                </div>
                <h3
                  className="text-sm font-bold tracking-tight mt-0.5"
                  style={{ color: '#1a1209', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  Visual Motifs & Botanical Slides
                </h3>
              </div>

              <div className="text-right">
                <span
                  className="text-[9px] font-mono font-bold px-2 py-0.5 border"
                  style={{
                    borderColor: '#c94f00',
                    background: 'rgba(201,79,0,0.12)',
                    color: '#c94f00',
                  }}
                >
                  {activeGraphics.length} MOUNTED
                </span>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div
              className="px-3 py-2 border-b flex items-center justify-between gap-1 text-[9px] font-mono uppercase shrink-0"
              style={{
                borderColor: 'rgba(26,18,9,0.14)',
                background: '#ece2c6',
              }}
            >
              {/* Category Pills */}
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'nature', label: 'BOTANICA' },
                  { id: 'cinematic', label: 'OPTICA' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGraphicFilter(cat.id as any)}
                    className="px-2 py-0.5 border transition cursor-pointer"
                    style={{
                      borderColor: graphicFilter === cat.id ? '#c94f00' : 'rgba(26,18,9,0.18)',
                      background: graphicFilter === cat.id ? '#c94f00' : '#f4eedb',
                      color: graphicFilter === cat.id ? '#ffffff' : '#574836',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Fast Presets */}
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveGraphics(['tree', 'floral', 'petals'])}
                  className="px-1.5 py-0.5 border transition hover:bg-black/5 cursor-pointer font-bold"
                  style={{ borderColor: 'rgba(26,18,9,0.22)', background: '#f4eedb', color: '#1a1209' }}
                  title="Mount Tree, Floral Vine & Falling Petals"
                >
                  NATURE
                </button>
                <button
                  onClick={() => setActiveGraphics(['corners', 'particles', 'stars'])}
                  className="px-1.5 py-0.5 border transition hover:bg-black/5 cursor-pointer"
                  style={{ borderColor: 'rgba(26,18,9,0.22)', background: '#f4eedb', color: '#574836' }}
                  title="Mount Viewfinder & Warm Dust"
                >
                  OPTIC
                </button>
                <button
                  onClick={() => setActiveGraphics([])}
                  className="px-1.5 py-0.5 border transition hover:bg-black/5 cursor-pointer text-[#8a7a66]"
                  style={{ borderColor: 'rgba(26,18,9,0.22)', background: '#f4eedb' }}
                  title="Clear All Overlays"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* 3-COLUMN ARCHIVAL SPECIMEN SLIDE GRID */}
            <div className="flex-1 p-2.5 overflow-y-auto [scrollbar-width:thin]">
              <div className="grid grid-cols-3 gap-2">
                {GRAPHIC_OPTIONS.filter(g =>
                  graphicFilter === 'all' ? true : g.category === graphicFilter
                ).map(g => {
                  const isActive = activeGraphics.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGraphic(g.id)}
                      className="group flex flex-col border transition text-left cursor-pointer overflow-hidden relative"
                      style={{
                        borderColor: isActive ? '#c94f00' : 'rgba(26,18,9,0.22)',
                        background: isActive ? '#fcf8ec' : '#f5edd9',
                        boxShadow: isActive ? '0 0 0 1px #c94f00 inset, 0 3px 10px rgba(201,79,0,0.12)' : 'none',
                      }}
                    >
                      {/* Top Specimen Header Tag */}
                      <div
                        className="px-1.5 py-0.5 border-b flex items-center justify-between text-[7.5px] font-mono tracking-tight"
                        style={{
                          borderColor: 'rgba(26,18,9,0.12)',
                          background: isActive ? '#f7efe0' : 'rgba(26,18,9,0.04)',
                          color: isActive ? '#c94f00' : '#6b5c49',
                        }}
                      >
                        <span className="font-bold">{g.index}</span>
                        <span className="uppercase font-semibold tracking-tighter">
                          {isActive ? '✓ MOUNT' : '+ ADD'}
                        </span>
                      </div>

                      {/* Live Actual Miniature Illustration Canvas */}
                      <div
                        className="w-full aspect-square relative border-b overflow-hidden"
                        style={{ borderColor: 'rgba(26,18,9,0.12)' }}
                      >
                        <GraphicThumbnail id={g.id} />

                        {/* Stamp Overlay */}
                        <div
                          className="absolute bottom-1 right-1 font-mono text-[7px] px-1 border tracking-tight font-bold"
                          style={{
                            background: isActive ? '#c94f00' : 'rgba(237,228,203,0.92)',
                            color: isActive ? '#ffffff' : '#6b5c46',
                            borderColor: isActive ? '#c94f00' : 'rgba(26,18,9,0.25)',
                          }}
                        >
                          {isActive ? 'ON' : 'OFF'}
                        </div>
                      </div>

                      {/* Title & Classification Plate */}
                      <div className="p-1.5 flex flex-col justify-between flex-1">
                        <div>
                          <div
                            className="text-[9.5px] font-mono font-bold truncate leading-tight"
                            style={{ color: isActive ? '#c94f00' : '#1a1209' }}
                          >
                            {g.label}
                          </div>
                          <div
                            className="text-[8px] italic truncate leading-none mt-0.5 opacity-70"
                            style={{
                              fontFamily: '"Cormorant Garamond", Georgia, serif',
                              color: '#1a1209',
                            }}
                          >
                            {g.sublabel}
                          </div>
                        </div>

                        <div className="text-[7.5px] font-sans truncate mt-1 text-[#7a6c58] leading-tight">
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
              className="p-3.5 border-b flex items-center justify-between shrink-0"
              style={{
                borderColor: 'rgba(26,18,9,0.18)',
                background: '#e6dac0',
              }}
            >
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#c94f00]">
                  TYPE ENGINES
                </span>
                <h3
                  className="text-sm font-bold tracking-tight mt-0.5"
                  style={{ color: '#1a1209', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  Kinetic Typography Plates
                </h3>
              </div>
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 border"
                style={{
                  borderColor: '#c94f00',
                  background: 'rgba(201,79,0,0.12)',
                  color: '#c94f00',
                }}
              >
                {motionStyle.toUpperCase()}
              </span>
            </div>

            <div className="flex-1 p-3 space-y-2 overflow-y-auto [scrollbar-width:thin]">
              {MOTION_STYLES.map(s => {
                const isSelected = motionStyle === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setMotionStyle(s.id)}
                    className="w-full p-3 border text-left transition cursor-pointer relative"
                    style={{
                      borderColor: isSelected ? '#c94f00' : 'rgba(26,18,9,0.22)',
                      background: isSelected ? '#fcf9ec' : '#f5edd9',
                      boxShadow: isSelected ? '0 0 0 1px #c94f00 inset, 0 2px 8px rgba(201,79,0,0.12)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-mono font-extrabold tracking-wide"
                        style={{ color: isSelected ? '#c94f00' : '#1a1209' }}
                      >
                        {s.label}
                      </span>
                      {isSelected ? (
                        <span
                          className="text-[8px] font-mono px-1.5 py-0.5 border font-bold text-white"
                          style={{ background: '#c94f00', borderColor: '#c94f00' }}
                        >
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono text-[#8a7a66]">SELECT</span>
                      )}
                    </div>
                    <p className="text-[10.5px] font-sans" style={{ color: '#635543' }}>
                      {s.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TAB 3: AUDIO & SYNC ══════════════════════════════════════════ */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className="p-3.5 border-b shrink-0"
              style={{
                borderColor: 'rgba(26,18,9,0.18)',
                background: '#e6dac0',
              }}
            >
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#c94f00]">
                ACOUSTIC SPOOL
              </span>
              <h3
                className="text-sm font-bold tracking-tight mt-0.5"
                style={{ color: '#1a1209', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Track & Whisper AI Alignment
              </h3>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto [scrollbar-width:thin]">
              {/* Dropzone */}
              <div
                className="border border-dashed p-4 text-center relative cursor-pointer hover:bg-black/5 transition"
                style={{ borderColor: 'rgba(26,18,9,0.3)', background: '#f5eee0' }}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#c94f00' }} />
                <p className="text-xs font-bold" style={{ color: '#1a1209' }}>
                  {uploadedFile ? uploadedFile.name : 'Upload Audio Track'}
                </p>
                <p className="text-[9.5px] font-mono mt-0.5" style={{ color: '#70624e' }}>
                  MP3, WAV, M4A up to 25MB
                </p>
              </div>

              {uploadedFile && (
                <div
                  className="p-3 border space-y-2"
                  style={{ borderColor: 'rgba(26,18,9,0.2)', background: '#f4ebd5' }}
                >
                  <label className="text-[10px] font-mono font-bold block" style={{ color: '#1a1209' }}>
                    GROQ API KEY (WHISPER AI):
                  </label>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs border px-2 py-1.5 font-mono"
                    style={{ background: '#fbf8f0', borderColor: 'rgba(26,18,9,0.3)', color: '#1a1209' }}
                  />
                  <button
                    onClick={handleRunTranscription}
                    disabled={isTranscribing}
                    className="w-full py-1.5 border text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    style={{ background: '#c94f00', borderColor: '#a63f00' }}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {transcribeStatus || 'Aligning timestamps...'}
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
                className="p-3 border font-mono"
                style={{ borderColor: 'rgba(26,18,9,0.22)', background: '#f8f3e5' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] text-[#70624e] tracking-widest uppercase">TRACK SPOOL</span>
                  <span className="text-[9px] font-bold text-[#c94f00]">
                    {Math.floor(duration / 60)}:{(Math.floor(duration % 60) + '').padStart(2, '0')}
                  </span>
                </div>
                <div className="font-bold truncate text-xs" style={{ color: '#1a1209' }}>
                  {songTitle}
                </div>
                <div className="text-[9.5px] mt-2 pt-2 border-t flex justify-between text-[#70624e]" style={{ borderColor: 'rgba(26,18,9,0.1)' }}>
                  <span>{wordsCount} timed words</span>
                  <span>{linesCount} verses</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: FORMAT & CANVAS DRAFTING ══════════════════════════════ */}
        {activeTab === 'canvas' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className="p-3.5 border-b shrink-0"
              style={{
                borderColor: 'rgba(26,18,9,0.18)',
                background: '#e6dac0',
              }}
            >
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#c94f00]">
                DRAFTING RATIO
              </span>
              <h3
                className="text-sm font-bold tracking-tight mt-0.5"
                style={{ color: '#1a1209', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Orientation & Typography Scale
              </h3>
            </div>

            <div className="flex-1 p-3.5 space-y-4 overflow-y-auto [scrollbar-width:thin]">
              {/* Orientation Buttons */}
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 text-[#70624e]">
                  CANVAS ASPECT RATIO
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className="p-3 border text-left transition cursor-pointer"
                    style={{
                      borderColor: orientation === 'portrait' ? '#c94f00' : 'rgba(26,18,9,0.22)',
                      background: orientation === 'portrait' ? '#fcf9ec' : '#f5ecd8',
                      boxShadow: orientation === 'portrait' ? '0 0 0 1px #c94f00 inset' : 'none',
                    }}
                  >
                    <div className="text-xs font-mono font-bold" style={{ color: orientation === 'portrait' ? '#c94f00' : '#1a1209' }}>
                      9:16 Portrait
                    </div>
                    <div className="text-[9px] font-sans mt-0.5 text-[#70624e]">
                      Shorts & Reels
                    </div>
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className="p-3 border text-left transition cursor-pointer"
                    style={{
                      borderColor: orientation === 'landscape' ? '#c94f00' : 'rgba(26,18,9,0.22)',
                      background: orientation === 'landscape' ? '#fcf9ec' : '#f5ecd8',
                      boxShadow: orientation === 'landscape' ? '0 0 0 1px #c94f00 inset' : 'none',
                    }}
                  >
                    <div className="text-xs font-mono font-bold" style={{ color: orientation === 'landscape' ? '#c94f00' : '#1a1209' }}>
                      16:9 Landscape
                    </div>
                    <div className="text-[9px] font-sans mt-0.5 text-[#70624e]">
                      YouTube & Video
                    </div>
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div className="pt-3 border-t space-y-3" style={{ borderColor: 'rgba(26,18,9,0.14)' }}>
                <label className="flex items-center justify-between text-xs font-mono font-bold cursor-pointer text-[#1a1209]">
                  <span>UPPERCASE TYPOGRAPHY</span>
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={e => setUppercase(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: '#c94f00' }}
                  />
                </label>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-1.5 text-[#70624e]">
                    <span>FONT SCALE</span>
                    <span style={{ color: '#c94f00' }}>{fontSize}px</span>
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
          </div>
        )}
      </div>
    </div>
  );
};
