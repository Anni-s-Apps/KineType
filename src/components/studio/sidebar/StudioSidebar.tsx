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
  Plus,
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
    <div className="flex flex-row shrink-0 h-full select-none" style={{ background: '#ece3cb' }}>
      {/* ── 1. COMPACT PAPER ICON RAIL ──────────────────────────────────── */}
      <div
        className="flex flex-col items-center py-3 border-r"
        style={{
          borderColor: 'rgba(26,18,9,0.18)',
          background: '#e4d9be',
          width: '56px',
        }}
      >
        <button
          onClick={() => setActiveTab('graphics')}
          className="w-10 h-10 mb-2 flex flex-col items-center justify-center border transition relative cursor-pointer"
          style={{
            borderColor: activeTab === 'graphics' ? '#c94f00' : 'rgba(26,18,9,0.15)',
            background: activeTab === 'graphics' ? '#c94f00' : 'transparent',
            color: activeTab === 'graphics' ? '#fbf8f0' : '#4a3f31',
          }}
          title="Decorative Elements"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-tight mt-0.5">ELEM</span>
          {activeGraphics.length > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-mono px-1 border"
              style={{
                background: '#1a1209',
                color: '#ffffff',
                borderColor: '#e4d9be',
              }}
            >
              {activeGraphics.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('styles')}
          className="w-10 h-10 mb-2 flex flex-col items-center justify-center border transition cursor-pointer"
          style={{
            borderColor: activeTab === 'styles' ? '#c94f00' : 'rgba(26,18,9,0.15)',
            background: activeTab === 'styles' ? '#c94f00' : 'transparent',
            color: activeTab === 'styles' ? '#fbf8f0' : '#4a3f31',
          }}
          title="Motion Typography"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-tight mt-0.5">TYPE</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className="w-10 h-10 mb-2 flex flex-col items-center justify-center border transition cursor-pointer"
          style={{
            borderColor: activeTab === 'audio' ? '#c94f00' : 'rgba(26,18,9,0.15)',
            background: activeTab === 'audio' ? '#c94f00' : 'transparent',
            color: activeTab === 'audio' ? '#fbf8f0' : '#4a3f31',
          }}
          title="Audio Track"
        >
          <Music className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-tight mt-0.5">AUDIO</span>
        </button>

        <button
          onClick={() => setActiveTab('canvas')}
          className="w-10 h-10 mb-2 flex flex-col items-center justify-center border transition cursor-pointer"
          style={{
            borderColor: activeTab === 'canvas' ? '#c94f00' : 'rgba(26,18,9,0.15)',
            background: activeTab === 'canvas' ? '#c94f00' : 'transparent',
            color: activeTab === 'canvas' ? '#fbf8f0' : '#4a3f31',
          }}
          title="Format & Canvas"
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-tight mt-0.5">FMT</span>
        </button>
      </div>

      {/* ── 2. EDITORIAL PAPER DRAWER PANEL ─────────────────────────────── */}
      <div
        className="border-r overflow-y-auto flex flex-col shrink-0 [scrollbar-width:thin]"
        style={{
          borderColor: 'rgba(26,18,9,0.18)',
          background: '#ede4cb',
          width: '380px',
        }}
      >
        {/* TAB: GRAPHICS & DECORATIVE ELEMENTS */}
        {activeTab === 'graphics' && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div
              className="p-3 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(26,18,9,0.16)', background: '#e7dcc0' }}
            >
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: '#1a1209' }}>
                  Graphics & Motifs
                </h3>
                <p className="text-[10px] font-sans" style={{ color: '#70624e' }}>
                  Click tile to toggle on video canvas
                </p>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 border"
                style={{
                  borderColor: 'rgba(201,79,0,0.4)',
                  background: 'rgba(201,79,0,0.1)',
                  color: '#c94f00',
                }}
              >
                {activeGraphics.length} ACTIVE
              </span>
            </div>

            {/* Filter Pills / Presets */}
            <div
              className="px-3 py-2 border-b flex items-center justify-between gap-1 text-[10px] font-mono uppercase"
              style={{ borderColor: 'rgba(26,18,9,0.14)', background: '#ede3c7' }}
            >
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'nature', label: 'NATURE' },
                  { id: 'cinematic', label: 'CINEMA' },
                  { id: 'retro', label: 'RETRO' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGraphicFilter(cat.id as any)}
                    className="px-2 py-0.5 border transition cursor-pointer"
                    style={{
                      borderColor: graphicFilter === cat.id ? '#c94f00' : 'rgba(26,18,9,0.16)',
                      background: graphicFilter === cat.id ? '#c94f00' : 'transparent',
                      color: graphicFilter === cat.id ? '#fff' : '#5c4e3b',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setActiveGraphics(['tree', 'floral', 'petals'])}
                  className="px-1.5 py-0.5 border text-[9px] hover:bg-black/5 cursor-pointer"
                  style={{ borderColor: 'rgba(26,18,9,0.2)', color: '#1a1209' }}
                  title="Tree, Flower Vine, Petals"
                >
                  PRESET
                </button>
                <button
                  onClick={() => setActiveGraphics([])}
                  className="px-1.5 py-0.5 border text-[9px] hover:bg-black/5 cursor-pointer"
                  style={{ borderColor: 'rgba(26,18,9,0.2)', color: '#70624e' }}
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* 3-COLUMN COMPACT DENSE GRID (No emojis, actual live canvas preview) */}
            <div className="p-2.5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
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
                      className="group flex flex-col border transition text-left cursor-pointer overflow-hidden relative"
                      style={{
                        borderColor: isActive ? '#c94f00' : 'rgba(26,18,9,0.20)',
                        background: isActive ? '#faf6eb' : '#f5ecd8',
                        boxShadow: isActive ? '0 0 0 1px #c94f00 inset' : 'none',
                      }}
                    >
                      {/* Actual Miniature Graphic Canvas Thumbnail */}
                      <div
                        className="w-full aspect-square relative border-b overflow-hidden"
                        style={{ borderColor: 'rgba(26,18,9,0.12)' }}
                      >
                        <GraphicThumbnail id={g.id} />

                        {/* Status Stamp */}
                        <div
                          className="absolute top-1 right-1 font-mono text-[8px] px-1 border tracking-tight"
                          style={{
                            background: isActive ? '#c94f00' : 'rgba(237,228,203,0.92)',
                            color: isActive ? '#ffffff' : '#6b5c46',
                            borderColor: isActive ? '#c94f00' : 'rgba(26,18,9,0.25)',
                          }}
                        >
                          {isActive ? 'ON' : '+'}
                        </div>
                      </div>

                      {/* Info Footer */}
                      <div className="p-1.5">
                        <div
                          className="text-[10px] font-mono font-bold truncate leading-tight"
                          style={{ color: isActive ? '#c94f00' : '#1a1209' }}
                        >
                          {g.label}
                        </div>
                        <div
                          className="text-[8px] font-sans truncate leading-none mt-0.5"
                          style={{ color: '#7a6c58' }}
                        >
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

        {/* TAB: MOTION STYLES */}
        {activeTab === 'styles' && (
          <div className="flex flex-col h-full">
            <div
              className="p-3 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(26,18,9,0.16)', background: '#e7dcc0' }}
            >
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: '#1a1209' }}>
                  Typography Motion
                </h3>
                <p className="text-[10px] font-sans" style={{ color: '#70624e' }}>
                  Kinetic typography engine selection
                </p>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 border"
                style={{
                  borderColor: 'rgba(201,79,0,0.4)',
                  background: 'rgba(201,79,0,0.1)',
                  color: '#c94f00',
                }}
              >
                {motionStyle.toUpperCase()}
              </span>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto">
              {MOTION_STYLES.map(s => {
                const isSelected = motionStyle === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setMotionStyle(s.id)}
                    className="w-full p-2.5 border text-left transition cursor-pointer"
                    style={{
                      borderColor: isSelected ? '#c94f00' : 'rgba(26,18,9,0.18)',
                      background: isSelected ? '#faf5ea' : '#f4edd9',
                      boxShadow: isSelected ? '0 0 0 1px #c94f00 inset' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="text-xs font-mono font-bold tracking-wide"
                        style={{ color: isSelected ? '#c94f00' : '#1a1209' }}
                      >
                        {s.label}
                      </span>
                      {isSelected && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.2 border text-white font-bold"
                          style={{ background: '#c94f00', borderColor: '#c94f00' }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-sans" style={{ color: '#70624e' }}>
                      {s.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: AUDIO & LYRICS */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full">
            <div
              className="p-3 border-b"
              style={{ borderColor: 'rgba(26,18,9,0.16)', background: '#e7dcc0' }}
            >
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: '#1a1209' }}>
                Audio & Transcription
              </h3>
              <p className="text-[10px] font-sans" style={{ color: '#70624e' }}>
                Upload track or align timestamps with Groq AI
              </p>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto">
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
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: '#c94f00' }} />
                <p className="text-xs font-bold" style={{ color: '#1a1209' }}>
                  {uploadedFile ? uploadedFile.name : 'Upload Audio File'}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: '#70624e' }}>
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
                    className="w-full text-xs border px-2 py-1 font-mono"
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

              {/* Track Metadata */}
              <div
                className="p-2.5 border text-xs font-mono"
                style={{ borderColor: 'rgba(26,18,9,0.18)', background: '#f8f3e5' }}
              >
                <div className="font-bold truncate text-[11px]" style={{ color: '#1a1209' }}>
                  {songTitle}
                </div>
                <div className="text-[10px] mt-1 flex justify-between" style={{ color: '#70624e' }}>
                  <span>{wordsCount} synced words</span>
                  <span>{linesCount} lines</span>
                  <span className="font-bold" style={{ color: '#c94f00' }}>
                    {Math.floor(duration / 60)}:{(Math.floor(duration % 60) + '').padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CANVAS & FORMAT */}
        {activeTab === 'canvas' && (
          <div className="flex flex-col h-full">
            <div
              className="p-3 border-b"
              style={{ borderColor: 'rgba(26,18,9,0.16)', background: '#e7dcc0' }}
            >
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: '#1a1209' }}>
                Format & Typography
              </h3>
              <p className="text-[10px] font-sans" style={{ color: '#70624e' }}>
                Orientation and font scaling controls
              </p>
            </div>

            <div className="p-3 space-y-4 overflow-y-auto">
              {/* Orientation Buttons */}
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#70624e' }}>
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className="p-2.5 border text-left transition cursor-pointer"
                    style={{
                      borderColor: orientation === 'portrait' ? '#c94f00' : 'rgba(26,18,9,0.2)',
                      background: orientation === 'portrait' ? '#faf5ea' : '#f5ecd8',
                      boxShadow: orientation === 'portrait' ? '0 0 0 1px #c94f00 inset' : 'none',
                    }}
                  >
                    <div className="text-xs font-mono font-bold" style={{ color: orientation === 'portrait' ? '#c94f00' : '#1a1209' }}>
                      9:16 Portrait
                    </div>
                    <div className="text-[9px] font-sans mt-0.5" style={{ color: '#70624e' }}>
                      Shorts & Reels
                    </div>
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className="p-2.5 border text-left transition cursor-pointer"
                    style={{
                      borderColor: orientation === 'landscape' ? '#c94f00' : 'rgba(26,18,9,0.2)',
                      background: orientation === 'landscape' ? '#faf5ea' : '#f5ecd8',
                      boxShadow: orientation === 'landscape' ? '0 0 0 1px #c94f00 inset' : 'none',
                    }}
                  >
                    <div className="text-xs font-mono font-bold" style={{ color: orientation === 'landscape' ? '#c94f00' : '#1a1209' }}>
                      16:9 Landscape
                    </div>
                    <div className="text-[9px] font-sans mt-0.5" style={{ color: '#70624e' }}>
                      YouTube & Video
                    </div>
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div className="pt-3 border-t space-y-3" style={{ borderColor: 'rgba(26,18,9,0.14)' }}>
                <label className="flex items-center justify-between text-xs font-mono font-semibold cursor-pointer" style={{ color: '#1a1209' }}>
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
                  <div className="flex justify-between text-xs font-mono font-semibold mb-1" style={{ color: '#70624e' }}>
                    <span>FONT SIZE</span>
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
