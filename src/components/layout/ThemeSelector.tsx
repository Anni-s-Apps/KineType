import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme, ThemeId, ThemeOption } from '../../hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find((t) => t.id === currentTheme) || themes[3];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const lightThemes = themes.filter((t) => t.mode === 'light');
  const darkThemes = themes.filter((t) => t.mode === 'dark');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-7 px-2.5 rounded-md hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 border border-border transition-colors select-none shrink-0 whitespace-nowrap"
        title="Change Theme Palette"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
          style={{ backgroundColor: activeTheme.colorPreview }}
        />
        <span className="truncate max-w-[85px]">{activeTheme.name}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60 shrink-0" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 text-card-foreground animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Light Themes Header */}
          <div className="px-2 py-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Sun className="w-3 h-3 text-amber-500" />
            <span>Light Themes (3)</span>
          </div>

          <div className="space-y-0.5 mb-2">
            {lightThemes.map((t) => {
              const isSelected = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-secondary font-semibold text-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: t.colorPreview }}
                    />
                    <div>
                      <div className="text-xs">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground font-normal leading-tight">
                        {t.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-border my-1" />

          {/* Dark Themes Header */}
          <div className="px-2 py-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Moon className="w-3 h-3 text-purple-400" />
            <span>Dark Themes (2)</span>
          </div>

          <div className="space-y-0.5">
            {darkThemes.map((t) => {
              const isSelected = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-secondary font-semibold text-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: t.colorPreview }}
                    />
                    <div>
                      <div className="text-xs">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground font-normal leading-tight">
                        {t.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
