import { Recipe, RecipeLayer, RecipeAsset, CameraKeyframe } from '../types/recipe';

export interface ChunkRecipeInput {
  chunkIndex: number;
  startTime: number;
  recipe: Recipe;
}

/**
 * Merges multiple chunk recipes into one consolidated Recipe.
 * Adjusts layer start/end times and camera keyframes with the corresponding chunk offset.
 * Deduplicates assets by asset ID.
 */
export function mergeChunkRecipes(chunks: ChunkRecipeInput[]): Recipe {
  if (!chunks || chunks.length === 0) {
    throw new Error('No chunk recipes provided for merging');
  }

  // Sort chunks by startTime
  const sortedChunks = [...chunks].sort((a, b) => a.startTime - b.startTime);
  const baseRecipe = sortedChunks[0].recipe;

  const mergedAssets: RecipeAsset[] = [];
  const assetIdSet = new Set<string>();
  const mergedLayers: RecipeLayer[] = [];
  const mergedCamera: CameraKeyframe[] = [];

  let maxDuration = 0;

  for (const chunk of sortedChunks) {
    const offset = chunk.startTime || 0;
    const rec = chunk.recipe;

    // Merge assets (deduplicating by ID)
    if (Array.isArray(rec.assets)) {
      for (const asset of rec.assets) {
        if (!assetIdSet.has(asset.id)) {
          assetIdSet.add(asset.id);
          mergedAssets.push({ ...asset });
        }
      }
    }

    // Offset camera keyframes
    if (Array.isArray(rec.camera)) {
      for (const cam of rec.camera) {
        mergedCamera.push({
          ...cam,
          start: Number((cam.start + offset).toFixed(3)),
          end: Number((cam.end + offset).toFixed(3)),
        });
      }
    }

    // Offset layers
    if (Array.isArray(rec.layers)) {
      for (const layer of rec.layers) {
        const shiftedLayer: RecipeLayer = {
          ...layer,
          id: `${layer.id}_c${chunk.chunkIndex}`,
          start: Number((layer.start + offset).toFixed(3)),
          end: Number((layer.end + offset).toFixed(3)),
        };

        if (shiftedLayer.growTo) {
          shiftedLayer.growTo = {
            ...shiftedLayer.growTo,
            t0: Number((shiftedLayer.growTo.t0 + offset).toFixed(3)),
            t1: Number((shiftedLayer.growTo.t1 + offset).toFixed(3)),
          };
        }

        mergedLayers.push(shiftedLayer);
        maxDuration = Math.max(maxDuration, shiftedLayer.end);
      }
    }

    const chunkCalculatedEnd = offset + (rec.settings?.duration || 0);
    maxDuration = Math.max(maxDuration, chunkCalculatedEnd);
  }

  return {
    version: 1,
    settings: {
      aspect: baseRecipe.settings?.aspect || '16:9',
      fps: baseRecipe.settings?.fps || 30,
      duration: Math.ceil(maxDuration * 10) / 10 || 30,
      title: `${baseRecipe.settings?.title || 'Merged Project'} (Merged)`,
    },
    scene: {
      ...baseRecipe.scene,
    },
    assets: mergedAssets,
    camera: mergedCamera,
    layers: mergedLayers,
  };
}
