import { Recipe } from '../types/recipe';

const DB_NAME = 'RecipeCutDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const AUTOSAVE_KEY = 'latest_autosave';

export interface SavedProject {
  id: string;
  recipe: Recipe;
  assetBlobs?: Record<string, string>; // assetId -> base64/dataUrl
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAutosave(recipe: Recipe, assetBlobs?: Record<string, string>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: SavedProject = {
      id: AUTOSAVE_KEY,
      recipe,
      assetBlobs,
      updatedAt: Date.now(),
    };
    store.put(data);
  } catch (err) {
    console.warn('Autosave failed:', err);
  }
}

export async function loadAutosave(): Promise<SavedProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(AUTOSAVE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function downloadProjectFile(recipe: Recipe, filename?: string) {
  const json = JSON.stringify(recipe, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${recipe.settings?.title || 'recipe_project'}.recipe.json`;
  a.click();
  URL.revokeObjectURL(url);
}
