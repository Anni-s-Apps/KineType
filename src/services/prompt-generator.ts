import { SrtChunk } from './srt-parser';
import { AspectRatio } from '../types/recipe';

export interface PromptBuildOptions {
  aspect: AspectRatio;
  fps: number;
  styleName?: string;
  sharedAssetsBlock?: string;
  customRules?: string;
}

export const DEFAULT_RULES_PROMPT = `You are RecipeCut AI, an elite motion graphics director.
Convert the provided timed voiceover transcript into a structured JSON motion-graphics recipe.

### JSON Schema Specification (Version 1):
\`\`\`json
{
  "version": 1,
  "settings": {
    "aspect": "{{ASPECT}}",
    "fps": {{FPS}},
    "duration": {{DURATION}}
  },
  "scene": {
    "bg": "#06121A",
    "accent": "#35D6C0",
    "vignette": 0.55,
    "grid": true
  },
  "assets": [
    {
      "id": "char1",
      "file": "character.png",
      "aspect": "1:2",
      "transparent": true,
      "prompt": "<style lock>. A developer with headphones looking at screen. Aspect ratio 1:2."
    }
  ],
  "camera": [
    { "start": 0, "end": 5.0, "x": 0.5, "y": 0.5, "zoom": 1.05 }
  ],
  "layers": [
    {
      "id": "t1",
      "type": "text",
      "text": "Main Headline",
      "start": 0.5,
      "end": 4.5,
      "x": 0.5,
      "y": 0.35,
      "size": 64,
      "weight": 800,
      "color": "#FFFFFF",
      "align": "center",
      "in": "wordIn",
      "out": "fadeOut",
      "z": 4
    },
    {
      "id": "c1",
      "type": "card",
      "title": "Code Example",
      "code": "const result = run();",
      "start": 4.5,
      "end": 9.0,
      "x": 0.5,
      "y": 0.5,
      "w": 500,
      "h": 280,
      "in": "slideL",
      "out": "slideOutL",
      "z": 3
    }
  ]
}
\`\`\`

### Strict Design Guidelines:
1. **Coordinates**: Element center is \`x\` and \`y\` (range 0.02 to 0.98). (0.5, 0.5) is dead center. Keep elements inside the safe area (avoid < 0.02 or > 0.98).
2. **Sizes**: Numbers <= 4 are frame fractions. Numbers > 4 are pixels in a 1080 short-side frame.
3. **Animations**:
   - Entrances: \`fadeUp\`, \`fadeDown\`, \`scaleIn\`, \`popIn\`, \`blurIn\`, \`slideL\`, \`slideR\`, \`typeOn\`, \`wordIn\`, \`charFade\`, \`zoomRotateIn\`, \`bounceIn\`
   - Exits: \`fadeOut\`, \`scaleOut\`, \`slideOutL\`, \`slideOutR\`, \`fadeDownOut\`
4. **Shapes Supported**: \`rect\`, \`pill\`, \`circle\`, \`ring\`, \`line\`, \`arrow\`, \`check\`, \`cross\`
5. **Pacing**: Never leave dead air gaps > 1.2s without visual elements. Layers should ideally be >= 0.8s long.
6. **Output Requirement**: Respond ONLY with raw valid JSON. Do not include markdown codeblocks or commentary.`;

export function generateChunkPrompt(
  chunk: SrtChunk,
  totalChunks: number,
  options: PromptBuildOptions
): string {
  const rules = (options.customRules || DEFAULT_RULES_PROMPT)
    .replace(/{{ASPECT}}/g, options.aspect)
    .replace(/{{FPS}}/g, String(options.fps))
    .replace(/{{DURATION}}/g, String(chunk.duration));

  let srtBlock = `### Transcript Chunk ${chunk.chunkIndex} of ${totalChunks} (Time: ${chunk.startTime.toFixed(2)}s to ${chunk.endTime.toFixed(2)}s, Duration: ${chunk.duration.toFixed(2)}s):\n\n`;

  chunk.cues.forEach((cue) => {
    // Relative times within chunk
    const relStart = (cue.startTime - chunk.startTime).toFixed(2);
    const relEnd = (cue.endTime - chunk.startTime).toFixed(2);
    srtBlock += `[${relStart}s -> ${relEnd}s] ${cue.text}\n`;
  });

  let assetsBlock = '';
  if (options.sharedAssetsBlock && options.sharedAssetsBlock.trim()) {
    assetsBlock = `\n### [ASSETS] Shared Style & Existing Assets (Reuse these IDs where applicable):\n${options.sharedAssetsBlock.trim()}\n`;
  }

  return `${rules}\n\n${assetsBlock}\n${srtBlock}\n\nReturn the complete JSON recipe for this chunk (timestamps relative to 0s..${chunk.duration.toFixed(2)}s).`;
}
