import React from 'react';
import { Tv, Sparkles } from 'lucide-react';
import { SAMPLE_RECIPES } from '../../recipe/samples';
import { Recipe } from '../../types/recipe';

interface TemplatesPanelProps {
  currentRecipe: Recipe;
  onApplyTemplate: (recipe: Recipe) => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  onApplyTemplate,
}) => {
  const templates = [
    {
      id: 'developerManifesto',
      title: 'Building Real Software (Full 10-Chunk Video)',
      description: 'Complete 332s motion graphics: chaos to architecture, AI workflows, multi-platform builds, and open source giveaways.',
      recipe: SAMPLE_RECIPES.developerManifesto,
      badge: 'Full Video',
    },
    {
      id: 'developerIntro',
      title: "Developer's Journey",
      description: 'Anime software developer, code cards, feature points, and smooth camera zoom.',
      recipe: SAMPLE_RECIPES.developerIntro,
      badge: 'Popular',
    },
    {
      id: 'techExplainer',
      title: 'SaaS / Tech Explainer',
      description: 'Minimal dark mode theme with pill badges, shape expansion, and multi-point highlights.',
      badge: 'SaaS',
      recipe: {
        ...SAMPLE_RECIPES.developerIntro,
        settings: { ...SAMPLE_RECIPES.developerIntro.settings, title: 'SaaS Explainer Flow' },
        scene: { bg: '#09090b', accent: '#27272a', vignette: 0.4, grid: false },
      },
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-card border-r border-border overflow-y-auto p-4 space-y-3.5 text-card-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div>
        <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-primary" />
          Templates
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Pre-designed motion-graphics recipes ready to customize.
        </p>
      </div>

      <div className="space-y-2.5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-3.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-xs text-foreground">{tpl.title}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                {tpl.badge}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.description}</p>

            <button
              onClick={() => onApplyTemplate(tpl.recipe)}
              className="w-full py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
