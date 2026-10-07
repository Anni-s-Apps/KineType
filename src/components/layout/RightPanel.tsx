import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Code2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Recipe, RecipeLayer, ValidationResult, ValidationError } from '../../types/recipe';
import { InspectorPanel } from '../panels/InspectorPanel';
import { CodeEditorPanel } from '../panels/CodeEditorPanel';

interface RightPanelProps {
  recipe: Recipe;
  recipeJsonText: string;
  onChangeJsonText: (text: string) => void;
  validation: ValidationResult;
  onApplyJson: (text: string) => { success: boolean; errors: ValidationError[] };
  selectedLayerId: string | null;
  onUpdateLayer: (layerId: string, updates: Partial<RecipeLayer>) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  recipe,
  recipeJsonText,
  onChangeJsonText,
  validation,
  onApplyJson,
  selectedLayerId,
  onUpdateLayer,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'code'>('inspector');
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelWidth, setPanelWidth] = useState<number>(340);
  const [isResizing, setIsResizing] = useState(false);

  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(340);

  // Resizable Right Panel width handlers (min: 260px, max: 520px)
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Moving mouse left increases right-panel width
      const deltaX = resizeStartXRef.current - e.clientX;
      const newWidth = Math.max(260, Math.min(520, resizeStartWidthRef.current + deltaX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <aside className="flex h-full min-h-0 bg-card border-l border-border shrink-0 select-none z-20 text-card-foreground relative">
      {/* ── Content Area (Resizable width) ─────────────────────────── */}
      {isExpanded && (
        <div
          style={{ width: `${panelWidth}px` }}
          className="h-full flex flex-col bg-card overflow-hidden relative"
        >
          {/* ── Left Vertical Resize Drag Handle ─────────────────────── */}
          <div
            onMouseDown={handleResizeMouseDown}
            className={`absolute top-0 left-0 w-1.5 h-full cursor-col-resize transition-colors z-30 ${
              isResizing ? 'bg-primary' : 'bg-transparent hover:bg-primary/60'
            }`}
            title="Drag left/right to resize inspector panel (260px - 520px)"
          />

          {/* Top Panel Tab Headers */}
          <div className="h-10 border-b border-border px-3 bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center bg-muted/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`h-7 px-3 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'inspector'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`h-7 px-3 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Recipe JSON</span>
              </button>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Collapse Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Panel View */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'inspector' ? (
              <InspectorPanel
                recipe={recipe}
                selectedLayerId={selectedLayerId}
                onUpdateLayer={onUpdateLayer}
              />
            ) : (
              <CodeEditorPanel
                recipeJsonText={recipeJsonText}
                onChangeJsonText={onChangeJsonText}
                validation={validation}
                onApplyJson={onApplyJson}
              />
            )}
          </div>
        </div>
      )}

      {/* Collapsed Strip */}
      {!isExpanded && (
        <div className="w-10 h-full flex flex-col items-center py-2.5 bg-card border-l border-border gap-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title="Expand Panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            onClick={() => {
              setActiveTab('inspector');
              setIsExpanded(true);
            }}
            className="writing-mode-vertical text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-2 tracking-wider uppercase rotate-180"
            style={{ writingMode: 'vertical-rl' }}
          >
            Inspector
          </div>
        </div>
      )}
    </aside>
  );
};
