import {
  Recipe,
  RecipeLayer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  CardLayer,
  RecipeAsset,
  CameraKeyframe,
} from '../types/recipe';
import { computeEntranceTransform, computeExitTransform } from './presets';
import { drawRoundedRect, drawArrow, drawCheckmark, drawCross, drawCodeCard } from './shapes';
import { getEasing } from './easing';

export interface RenderOptions {
  width: number;
  height: number;
  showSafeAreas?: boolean;
  quality?: number; // 1 = full, 0.5 = 1/2, etc.
}

export type AssetMap = Map<string, HTMLImageElement | ImageBitmap>;

/**
 * Calculates responsive pixel size based on PRD unit rule:
 * <= 4 is fraction of short-side (or frame dimension)
 * > 4 is px in a 1080 short-side frame
 */
export function resolveSize(val: number | undefined, shortSide: number, fallback = 0): number {
  if (val === undefined || isNaN(val)) return fallback;
  if (val <= 4) {
    return val * shortSide;
  }
  return (val / 1080) * shortSide;
}

/**
 * Computes interpolated camera state at time t
 */
export function getCameraTransform(
  cameraKeyframes: CameraKeyframe[] | undefined,
  t: number
): { x: number; y: number; zoom: number } {
  if (!cameraKeyframes || cameraKeyframes.length === 0) {
    return { x: 0.5, y: 0.5, zoom: 1.0 };
  }

  // Find active keyframe or interpolate between keyframes
  for (let i = 0; i < cameraKeyframes.length; i++) {
    const kf = cameraKeyframes[i];
    if (t >= kf.start && t <= kf.end) {
      const duration = kf.end - kf.start || 1;
      const progress = (t - kf.start) / duration;
      const ease = getEasing(kf.ease || 'easeInOutCubic')(progress);
      
      const prevKf = cameraKeyframes[i - 1] || { x: 0.5, y: 0.5, zoom: 1.0 };
      return {
        x: prevKf.x + (kf.x - prevKf.x) * ease,
        y: prevKf.y + (kf.y - prevKf.y) * ease,
        zoom: prevKf.zoom + (kf.zoom - prevKf.zoom) * ease,
      };
    }
  }

  // If before first keyframe
  if (t < cameraKeyframes[0].start) {
    return { x: cameraKeyframes[0].x, y: cameraKeyframes[0].y, zoom: cameraKeyframes[0].zoom };
  }

  // If after last keyframe
  const last = cameraKeyframes[cameraKeyframes.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom };
}

/**
 * Pure deterministic frame renderer
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  recipe: Recipe,
  assets: AssetMap,
  t: number,
  options: RenderOptions
) {
  const { width, height, showSafeAreas = false } = options;
  const shortSide = Math.min(width, height);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // ─── 1. Background & Scene ────────────────────────────────────────────────
  const bg = recipe.scene?.bg || '#090d16';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Background Gradient / Glow if specified
  if (recipe.scene?.accent) {
    const glow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      10,
      width * 0.5,
      height * 0.5,
      width * 0.7
    );
    glow.addColorStop(0, recipe.scene.accent + '33'); // 20% opacity
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  // Background tech grid if enabled
  if (recipe.scene?.grid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = shortSide * 0.06;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ─── 2. Camera Transform with Parallax ──────────────────────────────────
  const camera = getCameraTransform(recipe.camera, t);

  // Sort visible layers by z-index
  const visibleLayers = (recipe.layers || [])
    .filter((l) => !l.hidden && t >= l.start && t <= l.end)
    .sort((a, b) => (a.z || 0) - (b.z || 0));

  // ─── 3. Render Layers ──────────────────────────────────────────────────
  for (const layer of visibleLayers) {
    ctx.save();

    // Calculate Layer Timing Progress
    const duration = layer.end - layer.start;
    const localTime = t - layer.start;
    const inDur = layer.inDuration || 0.45;
    const outDur = layer.outDuration || 0.4;

    let entranceTransform: import('./presets').TransformState = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      opacity: 1,
      rotation: 0,
      blur: 0,
      progress: 1,
    };
    let exitTransform: import('./presets').TransformState = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      opacity: 1,
      rotation: 0,
      blur: 0,
      progress: 1,
    };

    if (layer.in && localTime < inDur) {
      entranceTransform = computeEntranceTransform(layer.in, localTime / inDur);
    }

    const remainingTime = layer.end - t;
    if (layer.out && remainingTime < outDur) {
      exitTransform = computeExitTransform(layer.out, 1 - remainingTime / outDur);
    }

    // Combine transformations
    const combinedOpacity = (layer.opacity ?? 1) * entranceTransform.opacity * exitTransform.opacity;
    if (combinedOpacity <= 0) {
      ctx.restore();
      continue;
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, combinedOpacity));

    // Handle growTo animation if specified
    let animWidthOffset = 0;
    let animHeightOffset = 0;
    let animScaleMult = 1;
    if (layer.growTo && t >= layer.growTo.t0 && t <= layer.growTo.t1) {
      const g = layer.growTo;
      const gProgress = (t - g.t0) / (g.t1 - g.t0);
      const ease = getEasing(g.ease || 'easeOutCubic')(gProgress);
      const currentVal = g.from + (g.to - g.from) * ease;
      if (g.prop === 'w') animWidthOffset = currentVal - g.from;
      if (g.prop === 'h') animHeightOffset = currentVal - g.from;
      if (g.prop === 'scale') animScaleMult = currentVal / g.from;
    }

    // Parallax depth calculation: 0 = static overlay, 1 = full camera movement
    const depth = layer.depth ?? 0.8;
    const camOffsetX = (0.5 - camera.x) * width * depth * (camera.zoom - 1);
    const camOffsetY = (0.5 - camera.y) * height * depth * (camera.zoom - 1);
    const camZoom = 1 + (camera.zoom - 1) * depth;

    // Layer Center Position
    const posX = layer.x * width + camOffsetX + entranceTransform.offsetX + exitTransform.offsetX;
    const posY = layer.y * height + camOffsetY + entranceTransform.offsetY + exitTransform.offsetY;

    // Apply translation, rotation, and scaling
    ctx.translate(posX, posY);
    const layerScale = (layer.scale ?? 1) * entranceTransform.scale * exitTransform.scale * camZoom * animScaleMult;
    const layerRot = ((layer.rotation ?? 0) + entranceTransform.rotation + exitTransform.rotation) * (Math.PI / 180);
    ctx.scale(layerScale, layerScale);
    if (layerRot !== 0) ctx.rotate(layerRot);

    // Render by Layer Type
    switch (layer.type) {
      case 'text':
        renderTextLayer(ctx, layer as TextLayer, shortSide, entranceTransform.progress);
        break;
      case 'image':
        renderImageLayer(ctx, layer as ImageLayer, recipe.assets, assets, shortSide);
        break;
      case 'shape':
        renderShapeLayer(ctx, layer as ShapeLayer, shortSide, entranceTransform.progress, animWidthOffset, animHeightOffset);
        break;
      case 'card':
        renderCardLayer(ctx, layer as CardLayer, shortSide);
        break;
    }

    ctx.restore();
  }

  // ─── 4. Vignette Overlay ─────────────────────────────────────────────────
  const vignetteVal = recipe.scene?.vignette ?? 0.45;
  if (vignetteVal > 0) {
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      shortSide * 0.4,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${vignetteVal})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  // ─── 5. Safe Area Overlay Guide ──────────────────────────────────────────
  if (showSafeAreas) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    // 2% Safe area margin
    ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);
    // Center crosshairs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 15, height / 2); ctx.lineTo(width / 2 + 15, height / 2);
    ctx.moveTo(width / 2, height / 2 - 15); ctx.lineTo(width / 2, height / 2 + 15);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Text Layer Renderer with Word-in / Type-on animation & line breaks
 */
function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  shortSide: number,
  animProgress: number
) {
  const fontSize = resolveSize(layer.size || 52, shortSide, 48);
  const fontWeight = layer.weight || 700;
  const fontFamily = layer.fontFamily || 'Plus Jakarta Sans, Inter, sans-serif';
  const color = layer.color || '#FFFFFF';
  const align = layer.align || 'center';

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (layer.shadow) {
    ctx.shadowColor = typeof layer.shadow === 'string' ? layer.shadow : 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
  }

  let fullText = layer.text;

  // Handle typeOn animation
  if (layer.in === 'typeOn') {
    const charCount = Math.floor(fullText.length * animProgress);
    fullText = fullText.slice(0, charCount);
  }

  const lines = fullText.split('\n');
  const lineHeight = fontSize * (layer.lineHeight || 1.25);
  const totalHeight = lines.length * lineHeight;
  const startY = -(totalHeight / 2) + lineHeight / 2;

  lines.forEach((line, i) => {
    const lineY = startY + i * lineHeight;

    // WordIn animation
    if (layer.in === 'wordIn') {
      const words = line.split(' ');
      const totalWords = words.length;
      const visibleWordCount = Math.ceil(totalWords * animProgress);
      const displayedWords = words.slice(0, visibleWordCount).join(' ');
      ctx.fillText(displayedWords, 0, lineY);
    } else {
      ctx.fillText(line, 0, lineY);
    }
  });
}

/**
 * Image Layer Renderer with slot resolution & fallback placeholder
 */
function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  recipeAssets: RecipeAsset[] | undefined,
  assets: AssetMap,
  shortSide: number
) {
  const imgObj = assets.get(layer.asset);
  const assetMeta = recipeAssets?.find((a) => a.id === layer.asset);

  const w = resolveSize(layer.w || 320, shortSide, 260);
  const h = resolveSize(layer.h, shortSide, w * 1.2);

  let anchorYOffset = 0;
  if (layer.anchor === 'bottom') anchorYOffset = -h / 2;
  if (layer.anchor === 'top') anchorYOffset = h / 2;

  if (imgObj) {
    ctx.save();
    if (layer.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
    }

    if (layer.cornerRadius) {
      drawRoundedRect(ctx, -w / 2, -h / 2 + anchorYOffset, w, h, layer.cornerRadius);
      ctx.clip();
    }

    ctx.drawImage(imgObj, -w / 2, -h / 2 + anchorYOffset, w, h);

    if (layer.border) {
      ctx.strokeStyle = layer.border.color;
      ctx.lineWidth = layer.border.width;
      drawRoundedRect(ctx, -w / 2, -h / 2 + anchorYOffset, w, h, layer.cornerRadius || 0);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Placeholder badge when user hasn't uploaded image yet
    ctx.save();
    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, -w / 2, -h / 2 + anchorYOffset, w, h, 16);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[Asset: ${layer.asset}]`, 0, -10 + anchorYOffset);

    ctx.fillStyle = '#64748b';
    ctx.font = '400 12px Inter, sans-serif';
    ctx.fillText(assetMeta?.prompt ? 'Ready for import' : 'Drop image here', 0, 15 + anchorYOffset);
    ctx.restore();
  }
}

/**
 * Shape Layer Renderer
 */
function renderShapeLayer(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer,
  shortSide: number,
  animProgress: number,
  animWidthOffset = 0,
  animHeightOffset = 0
) {
  const w = resolveSize(layer.w || 120, shortSide, 100) + animWidthOffset;
  const h = resolveSize(layer.h || 60, shortSide, 50) + animHeightOffset;
  const color = layer.color || layer.fill || '#35D6C0';
  const strokeColor = layer.stroke || color;
  const strokeWidth = layer.strokeWidth || 3;
  const radius = layer.cornerRadius || 8;

  ctx.fillStyle = color;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  switch (layer.kind) {
    case 'rect':
      drawRoundedRect(ctx, -w / 2, -h / 2, w, h, radius);
      ctx.fill();
      if (layer.stroke) ctx.stroke();
      break;

    case 'pill':
      drawRoundedRect(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      if (layer.stroke) ctx.stroke();
      break;

    case 'circle': {
      const rad = w / 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      if (layer.stroke) ctx.stroke();
      break;
    }

    case 'ring': {
      const rad = w / 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'line':
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();
      break;

    case 'arrow':
      drawArrow(ctx, -w / 2, 0, w / 2, 0, layer.arrowHeadSize || 18);
      break;

    case 'check':
      drawCheckmark(ctx, 0, 0, w, animProgress);
      break;

    case 'cross':
      drawCross(ctx, 0, 0, w);
      break;
  }
}

/**
 * Card Layer Renderer (IDE/Code Card or Highlight Box)
 */
function renderCardLayer(ctx: CanvasRenderingContext2D, layer: CardLayer, shortSide: number) {
  const w = resolveSize(layer.w || 640, shortSide, 500);
  const h = resolveSize(layer.h || 380, shortSide, 300);

  if (layer.code) {
    drawCodeCard(ctx, -w / 2, -h / 2, w, h, layer.code, layer.title || 'code.ts', layer.codeLang || 'ts');
    return;
  }

  // Standard Card
  ctx.fillStyle = layer.bg || '#111726';
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 16);
  ctx.fill();

  ctx.strokeStyle = layer.border || '#232e4a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (layer.title) {
    ctx.fillStyle = layer.textColor || '#FFFFFF';
    ctx.font = '700 24px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.title, 0, layer.subtitle ? -20 : 0);
  }

  if (layer.subtitle) {
    ctx.fillStyle = layer.accentColor || '#94a3b8';
    ctx.font = '400 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.subtitle, 0, 20);
  }
}
