import React, { useState } from 'react';
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

  return (
    <aside className="flex h-full min-h-0 bg-card border-l border-border shrink-0 select-none z-20 text-card-foreground">
      {/* ── Content Area (w-80) ────────────────────────── */}
      {isExpanded && (
        <div className="w-80 h-full flex flex-col bg-card overflow-hidden">
          {/* Top Panel Tab Headers */}
          <div className="h-10 border-b border-border px-3 bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center bg-muted p-0.5 rounded-md text-xs">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`h-6 px-2.5 rounded-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'inspector'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Inspector
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`h-6 px-2.5 rounded-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3 h-3" />
                Recipe JSON
              </button>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
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
        <div className="w-10 h-full flex flex-col items-center py-2 bg-card border-l border-border gap-2">
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
            className="writing-mode-vertical text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer py-2 tracking-wider uppercase rotate-180"
            style={{ writingMode: 'vertical-rl' }}
          >
            Inspector
          </div>
        </div>
      )}
    </aside>
  );
};
