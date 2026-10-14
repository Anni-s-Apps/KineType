import React, { useState } from 'react';
import { Copy, Check, X, Sparkles, Terminal, Wand2, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AI_STYLE_MASTER_PROMPT = `You are an expert Kinetic Typography & HTML5 Canvas Animation Engineer. Your task is to design and code a brand-new, ultra-smooth motion typography animation style for our open-source video engine.

## 🛑 STEP 1: INTERVIEW THE USER FIRST (MANDATORY)
DO NOT write any animation code yet. First, interview the user by asking the following 5 focused design questions to understand their vision:

1. Visual Theme & Vibe: What is the mood or aesthetic? (e.g., Cyberpunk Glitch, Brutalist Swiss Poster, Lo-Fi Tape, Comic Book Boom, Luxury Editorial, 3D Neon, Minimalist Bauhaus)?
2. Word Animation Physics: How should words animate into the scene? (e.g., explosive scale-slam, damped spring bounce, hydraulic squash, smooth optical drift, 3D perspective flip, typewriter reveal)?
3. Active Word Karaoke Reaction: How should the currently spoken word stand out from the rest? (e.g., luminous neon bloom, pill badge, glowing underline, chromatic glitch, rotational tilt, color flip)?
4. Spoken vs Upcoming Words: How should words that have already been spoken look compared to words yet to come? (e.g., solid obsidian vs 25% wireframe, faded slate vs warm ink, blur effect)?
5. Special Ornaments & Framing: Do you want any contextual framing, progress bars, rhythm dots, subtle grid ticks, or stamps?

Tell the user: "Please describe your desired kinetic typography style or answer the questions above, and I will generate the complete, production-ready style code for you!"

---

## 📐 STEP 2: ENGINE ARCHITECTURE & CODE SPECIFICATION
(Read this contract before writing the code once the user replies)

Every style is a single TypeScript module placed in src/components/studio/styles/<styleName>.ts implementing the exact StyleRenderContext interface:

import { StyleRenderContext, TimedWord, clamp, ease } from './types';

export const render<StyleName> = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, fontSize, fmt, C, roundRect, isLandscape } = ctx;
  if (!curLine) return;
  // c is CanvasRenderingContext2D centered at (0, 0)
  // Dynamic wrapping within maxW = W - 180
  // Damped spring physics (60 FPS deterministic)
};

### ⚡ CRITICAL PERFORMANCE & RENDERING RULES:
1. Coordinate System: Origin (0,0) is ALREADY centered at the lyric focal point. Never assume top-left (0,0). Use relative coordinates around (0,0).
2. Zero Word Overlap: Always measure text (c.measureText) and wrap lines cleanly within maxW = W - 180. Never hardcode static column widths.
3. Smooth Damped Spring Physics: Use continuous math (Math.exp(-k*t) * Math.cos(freq*t)) or easing helpers (ease.outBack, ease.outCubic) for jitter-free 60 FPS export.
4. Transitions: Line entrance at curLine.start; smooth exit before curLine.end (timeToExit = curLine.end - t).
5. No Clipping: Ensure adequate padding for descenders and active badges.

---

## 🚀 STEP 3: REGISTRATION IN STUDIO
1. Export in src/components/studio/styles/index.ts:
   export { render<StyleName> } from './<styleName>';
2. Register in MOTION_STYLES:
   { id: '<styleName>', label: '<Clean Name>', desc: '<Description>', render: render<StyleName> }`;

export const AiStylePromptModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_STYLE_MASTER_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden"
        style={{
          background: '#fdfbf7',
          borderColor: 'rgba(28,21,13,0.18)',
          color: '#1c150d',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{
            background: '#f2eae0',
            borderColor: 'rgba(28,21,13,0.12)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: '#d95d39' }}
            >
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#1c150d]">
                Create Your Own Style with AI
              </h2>
              <p className="text-[12px] text-[#7a6e60]">
                Master prompt framework for Claude, ChatGPT, Cursor & Antigravity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition cursor-pointer text-[#7a6e60]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* How It Works banner */}
          <div
            className="p-4 rounded-xl border flex items-start gap-3.5"
            style={{
              background: '#f7f2e7',
              borderColor: 'rgba(28,21,13,0.10)',
            }}
          >
            <Sparkles className="w-5 h-5 text-[#d95d39] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-[#4a3f31]">
              <span className="font-bold text-[#1c150d]">How it works:</span> Copy this master prompt into your favorite AI model.
              The AI will <strong>first interview you</strong> about your desired visual vibe, physics, and effects, and then generate
              the exact TypeScript code ready to drop into this app.
            </div>
          </div>

          {/* Prompt Code Block */}
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a6e60] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Master Agent Prompt
              </span>
              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                style={{
                  background: copied ? '#2d6a4f' : '#d95d39',
                  color: '#ffffff',
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Master Prompt
                  </>
                )}
              </button>
            </div>

            <pre
              className="p-4 rounded-xl text-[11.5px] font-mono leading-relaxed overflow-x-auto border max-h-[340px] select-all [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                background: '#f5eee3',
                color: '#2a2016',
                borderColor: 'rgba(28,21,13,0.14)',
                boxShadow: 'inset 0 1px 3px rgba(28,21,13,0.05)',
              }}
            >
              {AI_STYLE_MASTER_PROMPT}
            </pre>
          </div>

          {/* Quick 3-Step Walkthrough */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div
              className="p-3 rounded-xl border text-left"
              style={{
                background: '#faf6ee',
                borderColor: 'rgba(28,21,13,0.08)',
              }}
            >
              <div className="text-[10px] font-bold text-[#d95d39] uppercase tracking-wider mb-1">
                Step 1
              </div>
              <div className="text-[11.5px] font-bold text-[#1c150d]">Paste Prompt</div>
              <p className="text-[10.5px] text-[#7a6e60] mt-1 leading-snug">
                Give prompt to Claude, ChatGPT, or Cursor. It will ask for your design ideas.
              </p>
            </div>

            <div
              className="p-3 rounded-xl border text-left"
              style={{
                background: '#faf6ee',
                borderColor: 'rgba(28,21,13,0.08)',
              }}
            >
              <div className="text-[10px] font-bold text-[#d95d39] uppercase tracking-wider mb-1">
                Step 2
              </div>
              <div className="text-[11.5px] font-bold text-[#1c150d]">Describe Vision</div>
              <p className="text-[10.5px] text-[#7a6e60] mt-1 leading-snug">
                Explain your desired colors, spring bounces, and karaoke highlights.
              </p>
            </div>

            <div
              className="p-3 rounded-xl border text-left"
              style={{
                background: '#faf6ee',
                borderColor: 'rgba(28,21,13,0.08)',
              }}
            >
              <div className="text-[10px] font-bold text-[#d95d39] uppercase tracking-wider mb-1">
                Step 3
              </div>
              <div className="text-[11.5px] font-bold text-[#1c150d]">Drop & Play</div>
              <p className="text-[10.5px] text-[#7a6e60] mt-1 leading-snug">
                Save the file in <code>src/components/studio/styles/</code>. It works immediately!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-between shrink-0"
          style={{
            background: '#f2eae0',
            borderColor: 'rgba(28,21,13,0.12)',
          }}
        >
          <span className="text-[11px] text-[#7a6e60] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Also saved in <code>docs/AI_STYLE_CREATOR_PROMPT.md</code>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer hover:bg-black/5"
            style={{
              borderColor: 'rgba(28,21,13,0.20)',
              color: '#1c150d',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
