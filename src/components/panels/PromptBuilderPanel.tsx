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
    <div className="flex-1 flex flex-col h-full bg-card border-r border-border overflow-y-auto p-4 space-y-5 text-card-foreground">
      {/* Header */}
      <div>
        <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Prompt Builder & Chunker
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Auto-chunk transcripts into LLM prompts with shared style lock.
        </p>
      </div>

      {/* Step 1: SRT Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            1. Timed SRT Transcript
          </label>
          <label className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1">
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
          className="w-full bg-background border border-input rounded-md p-2.5 font-mono text-xs text-foreground focus:border-primary outline-none"
        />
      </div>

      {/* Step 2: Shared Asset Block */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          2. Shared [ASSETS] Block
        </label>
        <textarea
          value={sharedAssetsBlock}
          onChange={(e) => setSharedAssetsBlock(e.target.value)}
          rows={3}
          className="w-full bg-background border border-input rounded-md p-2 font-mono text-xs text-foreground focus:border-primary outline-none"
        />
      </div>

      {/* Chunk Duration & Action */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground block mb-1">Target Chunk Duration</label>
          <select
            value={chunkDuration}
            onChange={(e) => setChunkDuration(parseInt(e.target.value))}
            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground outline-none"
          >
            <option value={20}>20 seconds (~short)</option>
            <option value={30}>30 seconds (recommended)</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>
        <div className="self-end">
          <button
            onClick={handleProcessSrt}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Build Prompts
          </button>
        </div>
      </div>

      {/* Generated Chunks Cards */}
      {chunks.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-semibold text-foreground">
            Prompts ({chunks.length} Chunks)
          </h3>
          {chunks.map((chunk) => {
            const isCopied = copiedChunkIdx === chunk.chunkIndex;
            return (
              <div
                key={chunk.chunkIndex}
                className="p-3 rounded-lg border border-border bg-background space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Chunk {chunk.chunkIndex} of {chunks.length}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                    {chunk.startTime.toFixed(1)}s → {chunk.endTime.toFixed(1)}s ({chunk.duration.toFixed(1)}s)
                  </span>
                </div>

                <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-1.5 rounded border border-border">
                  {chunk.fullText}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => handleCopyChunkPrompt(chunk)}
                    className="flex-1 py-1 px-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied!' : 'Copy Prompt'}
                  </button>

                  <button
                    onClick={() => handleDownloadPromptTxt(chunk)}
                    className="p-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground"
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

      {/* Merge Chunk Helper */}
      <div className="border-t border-border pt-4 space-y-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Merge className="w-3.5 h-3.5 text-primary" />
          Merge Chunk Recipes
        </label>
        <textarea
          value={mergeInputs}
          onChange={(e) => setMergeInputs(e.target.value)}
          rows={3}
          placeholder='[ { "chunkIndex": 1, "startTime": 0, "recipe": {...} }, ... ]'
          className="w-full bg-background border border-input rounded-md p-2 font-mono text-xs text-foreground outline-none"
        />
        <button
          onClick={handleMergeChunks}
          disabled={!mergeInputs.trim()}
          className="w-full py-1.5 rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground border border-border font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Merge className="w-3.5 h-3.5" />
          Merge Chunks into Timeline
        </button>
        {mergeStatus && (
          <p className="text-xs font-mono text-muted-foreground p-2 rounded bg-muted border border-border">
            {mergeStatus}
          </p>
        )}
      </div>
    </div>
  );
};
