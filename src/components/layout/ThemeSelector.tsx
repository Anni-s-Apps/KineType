import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, ChevronDown, Sparkles, Eye } from 'lucide-react';
import { useTheme, ThemeId, ThemeOption } from '../../hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, activeThemeId, setTheme, previewTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'light' | 'dark'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayedTheme = themes.find((t) => t.id === activeThemeId) || themes[2];

  // Close when clicking outside and reset hover preview
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        previewTheme(null);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, previewTheme]);

  const filteredThemes = themes.filter((t) => {
    if (filterMode === 'light') return t.mode === 'light';
    if (filterMode === 'dark') return t.mode === 'dark';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger Button Connected to Popover ────────────────────── */}
      <button
        onClick={() => {
          if (isOpen) {
            previewTheme(null);
          }
          setIsOpen(!isOpen);
        }}
        className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-2 border transition-all select-none shrink-0 whitespace-nowrap ${
          isOpen
            ? 'bg-secondary text-foreground border-primary shadow-xs ring-2 ring-primary/25'
            : 'border-border text-foreground hover:bg-muted hover:border-border'
        }`}
        title="Change Theme & Appearance"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/25 shrink-0 shadow-2xs"
          style={{ backgroundColor: displayedTheme.colorPreview }}
        />
        <span className="font-medium text-foreground">{displayedTheme.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-foreground' : 'opacity-70'
          }`}
        />
      </button>

      {/* ── Dropdown Popover with Connected Arrow Pointer ──────────── */}
      {isOpen && (
        <div
          onMouseLeave={() => previewTheme(null)}
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl p-3 z-50 text-card-foreground origin-top-right animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Arrow Pointer Connected to Trigger Button */}
          <div className="absolute -top-1.5 right-8 w-3 h-3 bg-card border-t border-l border-border rotate-45 z-20 shadow-2xs" />

          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border relative z-30">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground tracking-tight block leading-none">
                  Theme & Palette
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Hover for instant live preview
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
              5 Themes
            </span>
          </div>

          {/* Mode Segmented Filter Tabs */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg mb-2.5 text-xs relative z-30">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All (5)
            </button>
            <button
              onClick={() => setFilterMode('light')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                filterMode === 'light'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              Light (3)
            </button>
            <button
              onClick={() => setFilterMode('dark')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                filterMode === 'dark'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3 h-3 text-purple-400" />
              Dark (2)
            </button>
          </div>

          {/* Theme List / Cards with Live Hover Preview */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-30">
            {filteredThemes.map((t) => {
              const isSelected = t.id === currentTheme;
              const isHovered = t.id === activeThemeId && t.id !== currentTheme;

              return (
                <button
                  key={t.id}
                  onMouseEnter={() => previewTheme(t.id)}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border group ${
                    isSelected
                      ? 'bg-secondary border-primary shadow-xs ring-1 ring-primary/30'
                      : isHovered
                      ? 'bg-muted/80 border-primary/50 text-foreground shadow-2xs'
                      : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Visual Color Preview Swatch */}
                    <div className="relative shrink-0">
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-xs transition-transform group-hover:scale-110"
                        style={{ backgroundColor: t.colorPreview }}
                      />
                      {t.mode === 'light' ? (
                        <Sun className="w-2.5 h-2.5 text-amber-500 absolute -bottom-1 -right-1 drop-shadow-xs" />
                      ) : (
                        <Moon className="w-2.5 h-2.5 text-purple-400 absolute -bottom-1 -right-1 drop-shadow-xs" />
                      )}
                    </div>

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs ${
                            isSelected
                              ? 'font-bold text-foreground'
                              : 'font-semibold text-foreground'
                          }`}
                        >
                          {t.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/15 text-primary font-bold">
                            Active
                          </span>
                        )}
                        {isHovered && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground font-medium flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Previewing
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-normal leading-tight mt-0.5 truncate">
                        {t.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-2 shadow-xs animate-in zoom-in-75">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono relative z-30">
            <span className="flex items-center gap-1 text-foreground/80 font-medium">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span>Hover for Instant Preview</span>
            </span>
            <span className="uppercase text-[9px] tracking-wider text-muted-foreground">
              5 Palettes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
