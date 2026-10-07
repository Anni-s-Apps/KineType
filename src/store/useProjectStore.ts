import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe, RecipeLayer, ValidationResult, ValidationError } from '../types/recipe';
import { validateRecipe } from '../recipe/validator';
import { SAMPLE_RECIPES } from '../recipe/samples';
import { saveAutosave, loadAutosave, downloadProjectFile } from '../services/storage';

export interface ProjectState {
  recipe: Recipe;
  recipeJsonText: string;
  validation: ValidationResult;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  previewQuality: number;
  showSafeAreas: boolean;
  selectedLayerId: string | null;
  audioFile: File | null;
  audioUrl: string | null;
  audioBlob: Blob | null;
  assetsMap: Map<string, HTMLImageElement>;
  activeLeftTab: 'assets' | 'layers' | 'prompt-builder' | 'templates';
  activeRightTab: 'code' | 'inspector' | 'camera';
  canUndo: boolean;
  canRedo: boolean;
}

export function useProjectState() {
  const [recipe, setRecipeInternal] = useState<Recipe>(SAMPLE_RECIPES.developerIntro);
  const [recipeJsonText, setRecipeJsonText] = useState<string>(
    JSON.stringify(SAMPLE_RECIPES.developerIntro, null, 2)
  );
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validateRecipe(SAMPLE_RECIPES.developerIntro)
  );
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [previewQuality, setPreviewQuality] = useState<number>(1);
  const [showSafeAreas, setShowSafeAreas] = useState<boolean>(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('title_main');
  const [audioFile, setAudioFileState] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [assetsMap, setAssetsMap] = useState<Map<string, HTMLImageElement>>(new Map());
  const [activeLeftTab, setActiveLeftTab] = useState<'assets' | 'layers' | 'prompt-builder' | 'templates'>('assets');
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'inspector' | 'camera'>('code');

  const historyRef = useRef<{ undo: Recipe[]; redo: Recipe[] }>({ undo: [], redo: [] });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Audio element reference for playback sync
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Update undo/redo state trackers
  const updateHistoryState = () => {
    setCanUndo(historyRef.current.undo.length > 0);
    setCanRedo(historyRef.current.redo.length > 0);
  };

  // Set Recipe with optional undo history recording
  const setRecipe = useCallback((newRecipe: Recipe, recordHistory = true) => {
    if (recordHistory) {
      setRecipeInternal((prev) => {
        historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
        if (historyRef.current.undo.length > 30) historyRef.current.undo.shift();
        historyRef.current.redo = [];
        updateHistoryState();
        return newRecipe;
      });
    } else {
      setRecipeInternal(newRecipe);
    }

    const jsonStr = JSON.stringify(newRecipe, null, 2);
    setRecipeJsonText(jsonStr);
    setValidation(validateRecipe(newRecipe));
    saveAutosave(newRecipe);
  }, []);

  // Update single layer
  const updateLayer = useCallback(
    (layerId: string, updates: Partial<RecipeLayer>) => {
      setRecipeInternal((prev) => {
        historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
        updateHistoryState();

        const updatedLayers = prev.layers.map((l) =>
          l.id === layerId ? ({ ...l, ...updates } as RecipeLayer) : l
        );
        const nextRecipe = { ...prev, layers: updatedLayers };
        setRecipeJsonText(JSON.stringify(nextRecipe, null, 2));
        setValidation(validateRecipe(nextRecipe));
        saveAutosave(nextRecipe);
        return nextRecipe;
      });
    },
    []
  );

  // Add new layer
  const addLayer = useCallback((layer: RecipeLayer) => {
    setRecipeInternal((prev) => {
      historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
      updateHistoryState();

      const nextRecipe = { ...prev, layers: [...prev.layers, layer] };
      setRecipeJsonText(JSON.stringify(nextRecipe, null, 2));
      setValidation(validateRecipe(nextRecipe));
      saveAutosave(nextRecipe);
      return nextRecipe;
    });
    setSelectedLayerId(layer.id);
  }, []);

  // Delete layer
  const removeLayer = useCallback((layerId: string) => {
    setRecipeInternal((prev) => {
      historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
      updateHistoryState();

      const nextRecipe = { ...prev, layers: prev.layers.filter((l) => l.id !== layerId) };
      setRecipeJsonText(JSON.stringify(nextRecipe, null, 2));
      setValidation(validateRecipe(nextRecipe));
      saveAutosave(nextRecipe);
      return nextRecipe;
    });
    setSelectedLayerId(null);
  }, []);

  // Duplicate layer
  const duplicateLayer = useCallback((layerId: string) => {
    setRecipeInternal((prev) => {
      const target = prev.layers.find((l) => l.id === layerId);
      if (!target) return prev;

      historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
      updateHistoryState();

      const newId = `${target.id}_copy_${Date.now().toString().slice(-4)}`;
      const duplicated: RecipeLayer = {
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        x: Math.min(0.9, target.x + 0.04),
        y: Math.min(0.9, target.y + 0.04),
      };

      const nextRecipe = { ...prev, layers: [...prev.layers, duplicated] };
      setRecipeJsonText(JSON.stringify(nextRecipe, null, 2));
      setValidation(validateRecipe(nextRecipe));
      saveAutosave(nextRecipe);
      setSelectedLayerId(newId);
      return nextRecipe;
    });
  }, []);

  // Undo / Redo
  const undo = useCallback(() => {
    const prev = historyRef.current.undo.pop();
    if (prev) {
      historyRef.current.redo.push(JSON.parse(JSON.stringify(recipe)));
      updateHistoryState();
      setRecipeInternal(prev);
      setRecipeJsonText(JSON.stringify(prev, null, 2));
      setValidation(validateRecipe(prev));
      saveAutosave(prev);
    }
  }, [recipe]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo.pop();
    if (next) {
      historyRef.current.undo.push(JSON.parse(JSON.stringify(recipe)));
      updateHistoryState();
      setRecipeInternal(next);
      setRecipeJsonText(JSON.stringify(next, null, 2));
      setValidation(validateRecipe(next));
      saveAutosave(next);
    }
  }, [recipe]);

  // Apply JSON string from Code Editor
  const applyJsonCode = useCallback((codeString: string): { success: boolean; errors: ValidationError[] } => {
    try {
      const parsed = JSON.parse(codeString);
      const val = validateRecipe(parsed);
      setValidation(val);
      if (val.valid) {
        setRecipeInternal((prev) => {
          historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
          updateHistoryState();
          return parsed as Recipe;
        });
        setRecipeJsonText(codeString);
        saveAutosave(parsed);
        return { success: true, errors: [] };
      } else {
        return { success: false, errors: val.errors };
      }
    } catch (e: any) {
      const parseError: ValidationError = {
        message: `JSON Syntax Error: ${e.message}`,
        severity: 'error',
      };
      setValidation({ valid: false, errors: [parseError], warnings: [] });
      return { success: false, errors: [parseError] };
    }
  }, []);

  // Import Asset File (by asset slot ID)
  const importAsset = useCallback((assetId: string, fileOrUrl: File | string) => {
    if (typeof fileOrUrl === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fileOrUrl;
      img.onload = () => {
        setAssetsMap((prev) => {
          const next = new Map(prev);
          next.set(assetId, img);
          return next;
        });
      };
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          setAssetsMap((prev) => {
            const next = new Map(prev);
            next.set(assetId, img);
            return next;
          });
        };
      };
      reader.readAsDataURL(fileOrUrl);
    }
  }, []);

  // Set Processed Audio Result (from direct audio or video extraction)
  const setProcessedAudio = useCallback((result: import('../services/audio-extractor').ProcessedAudioResult) => {
    setAudioUrl(result.audioUrl);
    setAudioBlob(result.audioBlob);
    setRecipeInternal((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        duration: Math.max(result.duration, prev.settings?.duration || 10),
      },
    }));
  }, []);

  // Set Voiceover Audio File
  const setAudioFile = useCallback((file: File | null) => {
    if (!file) {
      setAudioFileState(null);
      setAudioUrl(null);
      setAudioBlob(null);
      return;
    }
    setAudioFileState(file);
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Read audio duration and update recipe settings if desired
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setRecipeInternal((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            duration: Number(tempAudio.duration.toFixed(1)),
          },
        }));
      }
    };
  }, []);

  // Playhead seeking
  const seekTo = useCallback(
    (time: number) => {
      const duration = recipe.settings?.duration || 10;
      const clamped = Math.max(0, Math.min(duration, time));
      setCurrentTime(clamped);
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = clamped;
      }
    },
    [recipe.settings?.duration]
  );

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (audioElementRef.current) {
        if (next) {
          audioElementRef.current.play().catch(() => {});
        } else {
          audioElementRef.current.pause();
        }
      }
      return next;
    });
  }, []);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = ((now - lastTimestamp) / 1000) * playbackSpeed;
      lastTimestamp = now;

      setCurrentTime((prev) => {
        const duration = recipe.settings?.duration || 10;
        const nextTime = prev + deltaSeconds;
        if (nextTime >= duration) {
          setIsPlaying(false);
          if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current.currentTime = 0;
          }
          return 0;
        }
        return nextTime;
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, recipe.settings?.duration]);

  // Load Autosave on initial mount (with fallback to rich default sample)
  useEffect(() => {
    loadAutosave().then((saved) => {
      if (saved && saved.recipe && Array.isArray(saved.recipe.layers) && saved.recipe.layers.length > 0) {
        setRecipeInternal(saved.recipe);
        setRecipeJsonText(JSON.stringify(saved.recipe, null, 2));
        setValidation(validateRecipe(saved.recipe));
      } else {
        setRecipeInternal(SAMPLE_RECIPES.developerIntro);
        setRecipeJsonText(JSON.stringify(SAMPLE_RECIPES.developerIntro, null, 2));
        setValidation(validateRecipe(SAMPLE_RECIPES.developerIntro));
        saveAutosave(SAMPLE_RECIPES.developerIntro);
      }
    });
  }, []);

  return {
    recipe,
    recipeJsonText,
    setRecipeJsonText,
    validation,
    currentTime,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    previewQuality,
    setPreviewQuality,
    showSafeAreas,
    setShowSafeAreas,
    selectedLayerId,
    setSelectedLayerId,
    audioFile,
    audioUrl,
    audioBlob,
    assetsMap,
    activeLeftTab,
    setActiveLeftTab,
    activeRightTab,
    setActiveRightTab,
    canUndo,
    canRedo,
    audioElementRef,
    // Actions
    setRecipe,
    updateLayer,
    addLayer,
    removeLayer,
    duplicateLayer,
    undo,
    redo,
    applyJsonCode,
    importAsset,
    setAudioFile,
    setProcessedAudio,
    seekTo,
    togglePlay,
    saveProject: () => downloadProjectFile(recipe),
  };
}
