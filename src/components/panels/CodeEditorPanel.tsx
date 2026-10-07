import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Copy,
  AlignLeft,
} from 'lucide-react';
import { ValidationResult, ValidationError } from '../../types/recipe';

interface CodeEditorPanelProps {
  recipeJsonText: string;
  onChangeJsonText: (text: string) => void;
  validation: ValidationResult;
  onApplyJson: (text: string) => { success: boolean; errors: ValidationError[] };
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  recipeJsonText,
  onChangeJsonText,
  validation,
  onApplyJson,
}) => {
  const [applyFeedback, setApplyFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const handleApply = () => {
    const result = onApplyJson(recipeJsonText);
    if (result.success) {
      setApplyFeedback({ type: 'success', msg: 'Recipe applied to canvas!' });
    } else {
      setApplyFeedback({
        type: 'error',
        msg: `Apply failed: ${result.errors[0]?.message || 'Invalid JSON'}`,
      });
    }
    setTimeout(() => setApplyFeedback(null), 3000);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(recipeJsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      onChangeJsonText(formatted);
    } catch {
      // ignore if invalid
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recipeJsonText);
    setApplyFeedback({ type: 'success', msg: 'Copied JSON!' });
    setTimeout(() => setApplyFeedback(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card border-l border-border overflow-hidden text-card-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <h2 className="font-semibold text-xs text-foreground">Recipe JSON</h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleFormat}
            className="h-6 px-2 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Prettify JSON"
          >
            <AlignLeft className="w-3 h-3" />
            Format
          </button>
          <button
            onClick={handleCopy}
            className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center border border-border transition-colors"
            title="Copy JSON"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Code Textarea */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-background">
        <textarea
          value={recipeJsonText}
          onChange={(e) => onChangeJsonText(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full h-full p-3 font-mono text-xs text-foreground bg-transparent resize-none outline-none leading-relaxed select-text [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          placeholder="Paste recipe JSON here..."
        />
      </div>

      {/* Live Validation Banner */}
      <div className="border-t border-border bg-card p-3 space-y-2 max-h-44 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            {validation.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-destructive" />
            )}
            {validation.valid ? 'Schema Valid' : 'Validation Errors'}
          </span>

          {validation.warnings.length > 0 && (
            <span className="text-[11px] text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {validation.warnings.length} warning(s)
            </span>
          )}
        </div>

        {/* Error Items */}
        {validation.errors.map((err, idx) => (
          <div
            key={idx}
            className="p-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-mono leading-tight"
          >
            <strong>{err.layerId ? `[#${err.layerId}] ` : ''}</strong>
            {err.message}
          </div>
        ))}

        {/* Warning Items */}
        {validation.warnings.map((warn, idx) => (
          <div
            key={idx}
            className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-mono leading-tight"
          >
            <strong>{warn.layerId ? `[#${warn.layerId}] ` : ''}</strong>
            {warn.message}
          </div>
        ))}

        {/* Apply Feedback toast */}
        {applyFeedback && (
          <div
            className={`p-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 ${
              applyFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {applyFeedback.type === 'success' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {applyFeedback.msg}
          </div>
        )}
      </div>

      {/* Footer Apply Button */}
      <div className="p-2.5 border-t border-border bg-card">
        <button
          onClick={handleApply}
          className="w-full h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          Apply & Preview
        </button>
      </div>
    </div>
  );
};
