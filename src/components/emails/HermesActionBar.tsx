import { PenTool, FileText, Tag, Forward, Search, Loader2, Bot } from "lucide-react";

interface HermesActionBarProps {
  hermesStatus: 'idle' | 'thinking' | 'draft_ready' | 'error';
  onReply: () => void;
  onSummarize: () => void;
  onClassify: () => void;
  onForward: () => void;
  onAnalyze: () => void;
  draftCount?: number;
}

export function HermesActionBar({
  hermesStatus,
  onReply,
  onSummarize,
  onClassify,
  onForward,
  onAnalyze,
  draftCount = 0
}: HermesActionBarProps) {
  const isLoading = hermesStatus === 'thinking';

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[var(--bg)] border-b border-[var(--border)] shrink-0 overflow-x-auto">
      <button
        onClick={onReply}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text)] text-[var(--bg)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
      >
        <PenTool className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Repondre</span>
      </button>

      <button
        onClick={onSummarize}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Resumer</span>
      </button>

      <button
        onClick={onClassify}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 shrink-0"
      >
        <Tag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Classer</span>
      </button>

      <button
        onClick={onForward}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 shrink-0"
      >
        <Forward className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Transferer</span>
      </button>

      <button
        onClick={onAnalyze}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 shrink-0"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Analyser</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 shrink-0">
        {isLoading ? (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-[var(--text-muted)]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden sm:inline">Hermes reflechit...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-[var(--accent)]">
            <Bot className="w-3 h-3" />
            <span className="hidden sm:inline">
              {draftCount > 0 ? `${draftCount} draft${draftCount > 1 ? 's' : ''}` : 'Hermes'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
