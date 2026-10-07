import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Copy,
  Check,
  Download,
  FileText,
  Layers,
  Merge,
} from 'lucide-react';
import { parseSrt, chunkSrt, SrtChunk } from '../../services/srt-parser';
import { generateChunkPrompt } from '../../services/prompt-generator';
import { mergeChunkRecipes, ChunkRecipeInput } from '../../recipe/merge';
import { Recipe } from '../../types/recipe';
import { CustomSelect } from '../ui/CustomSelect';

interface PromptBuilderPanelProps {
  recipe: Recipe;
  onApplyMergedRecipe: (recipe: Recipe) => void;
}

export const PromptBuilderPanel: React.FC<PromptBuilderPanelProps> = ({
  recipe,
  onApplyMergedRecipe,
}) => {
  const [srtInput, setSrtInput] = useState<string>(`1
00:00:00,500 --> 00:00:05,200
Why do 90% of developers build before they even plan?

2
00:00:05,400 --> 00:00:11,800
Today we are looking at stateless architecture and pure canvas rendering.

3
00:00:12,000 --> 00:00:18,000
Turn any voiceover into motion graphics with instant frame seeking.`);

  const [chunkDuration, setChunkDuration] = useState<number>(30);
  const [sharedAssetsBlock, setSharedAssetsBlock] = useState<string>(
    `[
  {
    "id": "dev",
    "prompt": "A modern software developer at glowing desk, anime style. Aspect ratio 1:2.",
    "transparent": true
  }
]`
  );
  const [chunks, setChunks] = useState<SrtChunk[]>([]);
  const [copiedChunkIdx, setCopiedChunkIdx] = useState<number | null>(null);

  // Merge chunk state
  const [mergeInputs, setMergeInputs] = useState<string>('');
  const [mergeStatus, setMergeStatus] = useState<string | null>(null);

  const handleProcessSrt = () => {
    const cues = parseSrt(srtInput);
    if (cues.length === 0) {
      alert('No valid SRT cues found. Please check timestamp formatting.');
      return;
    }
    const computedChunks = chunkSrt(cues, chunkDuration);
    setChunks(computedChunks);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setSrtInput(text);
    };
    reader.readAsText(file);
  };

  const handleCopyChunkPrompt = (chunk: SrtChunk) => {
    const prompt = generateChunkPrompt(chunk, chunks.length, {
      aspect: recipe.settings?.aspect || '16:9',
      fps: recipe.settings?.fps || 30,
      sharedAssetsBlock,
    });
    navigator.clipboard.writeText(prompt);
    setCopiedChunkIdx(chunk.chunkIndex);
    setTimeout(() => setCopiedChunkIdx(null), 2000);
  };

  const handleDownloadPromptTxt = (chunk: SrtChunk) => {
    const prompt = generateChunkPrompt(chunk, chunks.length, {
      aspect: recipe.settings?.aspect || '16:9',
      fps: recipe.settings?.fps || 30,
      sharedAssetsBlock,
    });
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe_prompt_chunk_${chunk.chunkIndex}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMergeChunks = () => {
    try {
      setMergeStatus(null);
      const parsed = JSON.parse(mergeInputs);
      let chunkInputs: ChunkRecipeInput[] = [];

      if (Array.isArray(parsed)) {
        chunkInputs = parsed.map((item, idx) => ({
          chunkIndex: item.chunkIndex || idx + 1,
          startTime: item.startTime ?? idx * 30,
          recipe: item.recipe || item,
        }));
      } else if (parsed.chunks && Array.isArray(parsed.chunks)) {
        chunkInputs = parsed.chunks;
      } else {
        throw new Error('Input must be a JSON array of chunk recipe objects');
      }

      const merged = mergeChunkRecipes(chunkInputs);
      onApplyMergedRecipe(merged);
      setMergeStatus(`Successfully merged ${chunkInputs.length} chunk recipes!`);
    } catch (err: any) {
      setMergeStatus(`Merge Error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-y-auto p-4 space-y-4 text-card-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="pb-2 border-b border-border">
        <h2 className="font-bold text-xs text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Prompt Builder & Chunker
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Auto-chunk transcripts into LLM prompts with shared style lock.
        </p>
      </div>

      {/* ── Step 1: SRT Input ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            1. Timed SRT Transcript
          </label>
          <label className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium">
            <Upload className="w-3 h-3" />
            Upload .srt
            <input type="file" accept=".srt,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        <textarea
          value={srtInput}
          onChange={(e) => setSrtInput(e.target.value)}
          rows={5}
          placeholder="Paste timed SRT content..."
          className="w-full min-h-[110px] bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs resize-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
      </div>

      {/* ── Step 2: Shared Asset Block ─────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          2. Shared [ASSETS] Block
        </label>
        <textarea
          value={sharedAssetsBlock}
          onChange={(e) => setSharedAssetsBlock(e.target.value)}
          rows={4}
          className="w-full min-h-[85px] bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs resize-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
      </div>

      {/* ── Step 3: Chunk Duration & Full-Width Action Button ──────── */}
      <div className="space-y-2 pt-1 border-t border-border">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
            Target Chunk Duration
          </label>
          <CustomSelect
            value={chunkDuration}
            onChange={(val) => setChunkDuration(typeof val === 'number' ? val : parseInt(val))}
            options={[
              { value: 20, label: '20 seconds (~short reels)' },
              { value: 30, label: '30 seconds (recommended)' },
              { value: 45, label: '45 seconds (standard)' },
              { value: 60, label: '60 seconds (~long)' },
            ]}
          />
        </div>

        {/* Full-width Build Prompts Button placed cleanly below duration */}
        <button
          onClick={handleProcessSrt}
          className="w-full h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Build LLM Prompts ({chunkDuration}s Chunks)</span>
        </button>
      </div>

      {/* ── Generated Chunks Cards ─────────────────────────────────── */}
      {chunks.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground">
              Generated Prompts ({chunks.length} Chunks)
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              Ready to copy to LLM
            </span>
          </div>

          {chunks.map((chunk) => {
            const isCopied = copiedChunkIdx === chunk.chunkIndex;
            return (
              <div
                key={chunk.chunkIndex}
                className="p-3 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground">
                    Chunk {chunk.chunkIndex} of {chunks.length}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                    {chunk.startTime.toFixed(1)}s → {chunk.endTime.toFixed(1)}s ({chunk.duration.toFixed(1)}s)
                  </span>
                </div>

                <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-lg border border-border">
                  {chunk.fullText}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => handleCopyChunkPrompt(chunk)}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPromptTxt(chunk)}
                    className="h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title="Download .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 4: Merge Chunk Recipes ────────────────────────────── */}
      <div className="border-t border-border pt-3 space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Merge className="w-3.5 h-3.5 text-primary" />
          4. Merge Chunk Recipes
        </label>
        <textarea
          value={mergeInputs}
          onChange={(e) => setMergeInputs(e.target.value)}
          rows={4}
          placeholder='Paste LLM JSON chunk responses: [ { "chunkIndex": 1, "startTime": 0, "recipe": {...} }, ... ]'
          className="w-full min-h-[90px] bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs resize-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
        <button
          onClick={handleMergeChunks}
          disabled={!mergeInputs.trim()}
          className="w-full h-9 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground border border-border font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
        >
          <Merge className="w-3.5 h-3.5" />
          <span>Merge Chunks into Timeline</span>
        </button>

        {mergeStatus && (
          <p className="text-xs font-mono text-foreground p-2 rounded-lg bg-secondary border border-border animate-in fade-in">
            {mergeStatus}
          </p>
        )}
      </div>
    </div>
  );
};
