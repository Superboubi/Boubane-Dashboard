import { useState } from "react";
import { Copy, Check, X, Trash2, CheckCircle } from "lucide-react";

interface HermesDraftBubbleProps {
  draft: string;
  confidence?: number;
  actionType: 'reply' | 'summary' | 'forward' | 'classify';
  onCopy: () => void;
  onInsert: () => void;
  onDismiss: () => void;
}

export function HermesDraftBubble({
  draft,
  confidence = 85,
  actionType,
  onCopy,
  onInsert,
  onDismiss
}: HermesDraftBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    setInserted(true);
    onInsert();
    setTimeout(() => setInserted(false), 1500);
  };

  const confidenceColor = confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--accent)]/30 rounded-xl shadow-lg overflow-hidden animate-spring-up mt-4">
      <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--accent)]/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--accent)]">H</span>
          </div>
          <span className="text-xs font-semibold text-[var(--text)]">
            {actionType === 'reply' ? 'Brouillon de reponse' :
             actionType === 'summary' ? 'Resume' :
             actionType === 'forward' ? 'Transfert' : 'Classification'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-h-[200px] overflow-y-auto">
        <div className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed font-mono">
          {draft}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)]">Confidence:</span>
          <div className="w-16 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className={`h-full ${confidenceColor} rounded-full transition-all`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{confidence}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
              copied
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copie' : 'Copier'}
          </button>
          {actionType === 'reply' && (
            <button
              onClick={handleInsert}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                inserted
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90'
              }`}
            >
              {inserted ? <CheckCircle className="w-3 h-3" /> : null}
              {inserted ? 'Insere' : 'Inserer'}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] rounded transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Effacer
          </button>
        </div>
      </div>
    </div>
  );
}
