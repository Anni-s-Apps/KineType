import { useState, useEffect } from 'react';

export type ThemeId =
  | 'light-zinc'
  | 'light-amber'
  | 'light-slate'
  | 'dark-zinc'
  | 'dark-amber';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  mode: 'light' | 'dark';
  colorPreview: string; // Hex for preview dot
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 3 Light Mode Themes
  {
    id: 'light-zinc',
    name: 'Zinc White',
    mode: 'light',
    colorPreview: '#18181b',
    description: 'Crisp minimal white & neutral zinc',
  },
  {
    id: 'light-amber',
    name: 'Warm Amber Cream',
    mode: 'light',
    colorPreview: '#d97706',
    description: 'Soft warm paper cream with amber accents',
  },
  {
    id: 'light-slate',
    name: 'Frost Slate',
    mode: 'light',
    colorPreview: '#0284c7',
    description: 'Calm cool slate with sky blue accents',
  },
  // 2 Dark Mode Themes
  {
    id: 'dark-zinc',
    name: 'Midnight Onyx',
    mode: 'dark',
    colorPreview: '#fafafa',
    description: 'Deep neutral obsidian dark mode',
  },
  {
    id: 'dark-amber',
    name: 'Cyber Amber',
    mode: 'dark',
    colorPreview: '#f59e0b',
    description: 'Charcoal dark with glowing amber accents',
  },
];

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('recipecut_theme_id') as ThemeId;
    return saved && THEME_OPTIONS.some((t) => t.id === saved) ? saved : 'light-slate';
  });
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);

  const activeThemeId = previewThemeId || currentTheme;

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all previous theme classes
    THEME_OPTIONS.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('light', 'dark');

    // Add new theme class & mode class
    const selected = THEME_OPTIONS.find((t) => t.id === activeThemeId) || THEME_OPTIONS[2]; // Default to Frost Slate
    root.classList.add(selected.mode);
    root.classList.add(`theme-${selected.id}`);

    if (!previewThemeId) {
      localStorage.setItem('recipecut_theme_id', currentTheme);
    }
  }, [activeThemeId, currentTheme, previewThemeId]);

  const setTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    setPreviewThemeId(null);
    localStorage.setItem('recipecut_theme_id', themeId);
  };

  const previewTheme = (themeId: ThemeId | null) => {
    setPreviewThemeId(themeId);
  };

  const isDarkMode = activeThemeId.startsWith('dark');

  const toggleMode = () => {
    if (isDarkMode) {
      setTheme('light-slate');
    } else {
      setTheme('dark-zinc');
    }
  };

  return {
    currentTheme,
    activeThemeId,
    setTheme,
    previewTheme,
    isDarkMode,
    toggleMode,
    themes: THEME_OPTIONS,
  };
}
