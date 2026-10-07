import { Recipe, RecipeLayer, ValidationResult, ValidationError } from '../types/recipe';

const VALID_LAYER_TYPES = ['text', 'image', 'shape', 'card'];
const VALID_SHAPE_KINDS = ['rect', 'pill', 'circle', 'ring', 'line', 'arrow', 'check', 'cross', 'card', 'codeBlock'];

export function validateRecipe(recipe: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!recipe || typeof recipe !== 'object') {
    return {
      valid: false,
      errors: [{ message: 'Recipe must be a valid JSON object', severity: 'error' }],
      warnings: [],
    };
  }

  const rec = recipe as Partial<Recipe>;

  // Check version
  if (rec.version !== 1) {
    errors.push({
      field: 'version',
      message: `Unsupported recipe version "${rec.version}". Expected version: 1`,
      severity: 'error',
    });
  }

  // Check settings
  if (!rec.settings || typeof rec.settings !== 'object') {
    errors.push({
      field: 'settings',
      message: 'Missing "settings" object in recipe',
      severity: 'error',
    });
  } else {
    if (!['16:9', '9:16', '1:1'].includes(rec.settings.aspect as string)) {
      errors.push({
        field: 'settings.aspect',
        message: `Invalid aspect ratio "${rec.settings.aspect}". Supported: "16:9", "9:16", "1:1"`,
        severity: 'error',
      });
    }
    if (typeof rec.settings.duration !== 'number' || rec.settings.duration <= 0) {
      errors.push({
        field: 'settings.duration',
        message: 'settings.duration must be a positive number (seconds)',
        severity: 'error',
      });
    }
    if (typeof rec.settings.fps !== 'number' || rec.settings.fps <= 0) {
      errors.push({
        field: 'settings.fps',
        message: 'settings.fps must be a positive number (e.g. 30, 60)',
        severity: 'error',
      });
    }
  }

  // Check scene
  if (!rec.scene || typeof rec.scene !== 'object') {
    errors.push({
      field: 'scene',
      message: 'Missing "scene" object in recipe',
      severity: 'error',
    });
  } else {
    if (!rec.scene.bg) {
      warnings.push({
        field: 'scene.bg',
        message: 'scene.bg color is not specified, default #090d16 will be used',
        severity: 'warning',
      });
    }
  }

  // Collect asset IDs
  const assetIdSet = new Set<string>();
  if (Array.isArray(rec.assets)) {
    rec.assets.forEach((asset, idx) => {
      if (!asset.id) {
        errors.push({
          field: `assets[${idx}]`,
          message: `Asset at index ${idx} is missing an "id"`,
          severity: 'error',
        });
      } else {
        assetIdSet.add(asset.id);
      }
    });
  }

  // Check layers
  if (!Array.isArray(rec.layers)) {
    errors.push({
      field: 'layers',
      message: 'Recipe must contain a "layers" array',
      severity: 'error',
    });
    return { valid: errors.length === 0, errors, warnings };
  }

  if (rec.layers.length === 0) {
    warnings.push({
      field: 'layers',
      message: 'Recipe has no layers defined',
      severity: 'warning',
    });
  }

  // Track time intervals for gap detection
  const layerIntervals: Array<{ start: number; end: number }> = [];

  const seenIds = new Set<string>();

  rec.layers.forEach((layer: RecipeLayer, idx: number) => {
    const layerId = layer?.id || `layer_${idx}`;

    if (!layer || typeof layer !== 'object') {
      errors.push({
        layerId,
        message: `Layer at index ${idx} is not a valid object`,
        severity: 'error',
      });
      return;
    }

    if (!layer.id) {
      errors.push({
        layerId: `index_${idx}`,
        field: 'id',
        message: `Layer at index ${idx} is missing mandatory "id"`,
        severity: 'error',
      });
    } else if (seenIds.has(layer.id)) {
      errors.push({
        layerId: layer.id,
        field: 'id',
        message: `Duplicate layer ID "${layer.id}". Layer IDs must be unique`,
        severity: 'error',
      });
    } else {
      seenIds.add(layer.id);
    }

    // Check layer type
    if (!layer.type || !VALID_LAYER_TYPES.includes(layer.type)) {
      errors.push({
        layerId,
        field: 'type',
        message: `Unknown layer type "${layer.type}". Allowed types: ${VALID_LAYER_TYPES.join(', ')}`,
        severity: 'error',
      });
    }

    // Check timing
    if (typeof layer.start !== 'number' || isNaN(layer.start) || layer.start < 0) {
      errors.push({
        layerId,
        field: 'start',
        message: `Layer "${layerId}" has invalid start time (${layer.start}). Must be >= 0`,
        severity: 'error',
      });
    }

    if (typeof layer.end !== 'number' || isNaN(layer.end)) {
      errors.push({
        layerId,
        field: 'end',
        message: `Layer "${layerId}" is missing or has invalid "end" time`,
        severity: 'error',
      });
    } else if (layer.end <= layer.start) {
      errors.push({
        layerId,
        field: 'end',
        message: `Layer "${layerId}" end time (${layer.end}s) must be greater than start time (${layer.start}s)`,
        severity: 'error',
      });
    } else {
      const duration = layer.end - layer.start;
      if (duration < 0.8) {
        warnings.push({
          layerId,
          field: 'duration',
          message: `Layer "${layerId}" duration is short (${duration.toFixed(2)}s < 0.8s). It may flash by too fast`,
          severity: 'warning',
        });
      }
      layerIntervals.push({ start: layer.start, end: layer.end });
    }

    // Check coordinates (safe area warning 2%)
    if (typeof layer.x === 'number') {
      if (layer.x < 0.02 || layer.x > 0.98) {
        warnings.push({
          layerId,
          field: 'x',
          message: `Layer "${layerId}" x coordinate (${layer.x}) is outside the recommended 2% safe area margin (0.02 - 0.98)`,
          severity: 'warning',
        });
      }
    } else {
      errors.push({
        layerId,
        field: 'x',
        message: `Layer "${layerId}" is missing "x" coordinate`,
        severity: 'error',
      });
    }

    if (typeof layer.y === 'number') {
      if (layer.y < 0.02 || layer.y > 0.98) {
        warnings.push({
          layerId,
          field: 'y',
          message: `Layer "${layerId}" y coordinate (${layer.y}) is outside the recommended 2% safe area margin (0.02 - 0.98)`,
          severity: 'warning',
        });
      }
    } else {
      errors.push({
        layerId,
        field: 'y',
        message: `Layer "${layerId}" is missing "y" coordinate`,
        severity: 'error',
      });
    }

    // Type specific checks
    if (layer.type === 'text') {
      if (!layer.text || typeof layer.text !== 'string') {
        errors.push({
          layerId,
          field: 'text',
          message: `Text layer "${layerId}" is missing or has empty "text" property`,
          severity: 'error',
        });
      }
    } else if (layer.type === 'image') {
      if (!layer.asset) {
        errors.push({
          layerId,
          field: 'asset',
          message: `Image layer "${layerId}" is missing required "asset" id`,
          severity: 'error',
        });
      } else if (!assetIdSet.has(layer.asset)) {
        warnings.push({
          layerId,
          field: 'asset',
          message: `Image layer "${layerId}" references asset "${layer.asset}" which is not defined in the assets block`,
          severity: 'warning',
        });
      }
    } else if (layer.type === 'shape') {
      if (!layer.kind || !VALID_SHAPE_KINDS.includes(layer.kind)) {
        errors.push({
          layerId,
          field: 'kind',
          message: `Shape layer "${layerId}" has unknown kind "${layer.kind}". Allowed: ${VALID_SHAPE_KINDS.join(', ')}`,
          severity: 'error',
        });
      }
    }
  });

  // Check for long visual gaps (> 1.2s without any visible layer)
  if (layerIntervals.length > 0 && rec.settings?.duration) {
    layerIntervals.sort((a, b) => a.start - b.start);
    let currentCoverageEnd = 0;
    
    if (layerIntervals[0].start > 1.2) {
      warnings.push({
        field: 'layers',
        message: `Initial dead air gap of ${layerIntervals[0].start.toFixed(2)}s (> 1.2s) before first layer appears`,
        severity: 'warning',
      });
    }

    for (const interval of layerIntervals) {
      if (interval.start > currentCoverageEnd + 1.2) {
        const gap = interval.start - currentCoverageEnd;
        warnings.push({
          field: 'layers',
          message: `Visual gap of ${gap.toFixed(2)}s detected around t=${currentCoverageEnd.toFixed(1)}s where no elements are on screen`,
          severity: 'warning',
        });
      }
      currentCoverageEnd = Math.max(currentCoverageEnd, interval.end);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
