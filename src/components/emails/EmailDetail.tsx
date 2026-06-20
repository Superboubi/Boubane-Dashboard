import { useState } from "react";
import { Reply, Send, Paperclip, X, Loader2, Archive, Trash2, MailPlus, Forward } from "lucide-react";
import { Email } from "../../types";
import { HermesActionBar } from "./HermesActionBar";
import { HermesDraftBubble } from "./HermesDraftBubble";

interface EmailDetailProps {
  email: Email;
  emailBody: string;
  onBack: () => void;
  onMove: (id: string, toFolder: 'INBOX' | 'SENT' | 'ARCHIVE' | 'TRASH' | 'DRAFT') => void;
  onMarkUnread: (e: React.MouseEvent, id: string) => void;
  onReply: (draft: string) => void;
}

export function EmailDetail({
  email,
  emailBody,
  onBack,
  onMove,
  onMarkUnread,
  onReply
}: EmailDetailProps) {
  const [hermesStatus, setHermesStatus] = useState<'idle' | 'thinking' | 'draft_ready' | 'error'>('idle');
  const [draft, setDraft] = useState<{type: string; content: string; confidence: number} | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const callHermesAPI = async (action: string, body: object) => {
    setLoadingAction(action);
    setHermesStatus('thinking');
    try {
      const res = await fetch('/api/mail/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (data.success) return data;
      throw new Error('API error');
    } catch {
      setHermesStatus('error');
      return null;
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReply = async () => {
    const result = await callHermesAPI('reply', {
      emailSubject: email.subject,
      emailBody: emailBody,
      emailSender: email.sender,
    });
    if (result?.reply) {
      setDraft({ type: 'reply', content: result.reply, confidence: 88 });
      setHermesStatus('draft_ready');
    }
  };

  const handleSummarize = async () => {
    const result = await callHermesAPI('summarize', {
      emailSubject: email.subject,
      emailBody: emailBody,
    });
    if (result?.summary) {
      setDraft({ type: 'summary', content: result.summary, confidence: 92 });
      setHermesStatus('draft_ready');
    }
  };

  const handleClassify = async () => {
    const result = await callHermesAPI('classify', {
      emailSubject: email.subject,
      emailBody: emailBody,
    });
    if (result?.category) {
      setDraft({ type: 'classify', content: `${result.category} | ${result.urgency || ''}`, confidence: 85 });
      setHermesStatus('draft_ready');
    }
  };

  const handleAnalyze = async () => {
    const result = await callHermesAPI('classify', {
      emailSubject: email.subject,
      emailBody: emailBody,
    });
    if (result?.sentiment) {
      setDraft({
        type: 'analyze',
        content: `Sentiment: ${result.sentiment}\nUrgence: ${result.urgency}\nAction: ${result.recommendedAction}`,
        confidence: 78,
      });
      setHermesStatus('draft_ready');
    }
  };

  const handleForwardPrepare = () => {
    setReplyContent(`\n\n--- Message transfere ---\nDe: ${email.sender}\nDate: ${new Date(email.date).toLocaleString('fr-FR')}\nObjet: ${email.subject}\n\n${emailBody}`);
    setIsComposing(true);
  };

  const handleInsertDraft = () => {
    if (draft?.type === 'reply') {
      setReplyContent(draft.content);
      setIsComposing(true);
      setDraft(null);
      setHermesStatus('idle');
    }
  };

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setIsComposing(false);
      setReplyContent('');
    }
  };

  const handleDismissDraft = () => {
    setDraft(null);
    setHermesStatus('idle');
  };

  const renderCategoryBadge = () => {
    if (email.category && email.category !== 'none') {
      const colors: Record<string, string> = {
        important: 'bg-red-500/10 text-red-500 border-red-500/20',
        finance: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        business: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        update: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      };
      return (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${colors[email.category] || 'bg-gray-500/10 text-gray-500'}`}>
          {email.category.toUpperCase()}
        </span>
      );
    }
    return null;
  };

  const renderUrgencyBadge = () => {
    if (email.urgency) {
      const colors: Record<string, string> = {
        haute: 'bg-red-500/10 text-red-500',
        moyenne: 'bg-amber-500/10 text-amber-500',
        basse: 'bg-emerald-500/10 text-emerald-500',
      };
      return (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${colors[email.urgency] || ''}`}>
          {email.urgency.toUpperCase()}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <HermesActionBar
        hermesStatus={hermesStatus}
        onReply={handleReply}
        onSummarize={handleSummarize}
        onClassify={handleClassify}
        onForward={handleForwardPrepare}
        onAnalyze={handleAnalyze}
        draftCount={draft ? 1 : 0}
      />

      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {renderCategoryBadge()}
                {renderUrgencyBadge()}
              </div>
              <h1 className="text-base font-bold text-[var(--text)] leading-tight">{email.subject}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold flex items-center justify-center shrink-0 border border-[var(--accent)]/20 text-xs">
              {email.sender.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-[var(--text)]">{email.sender}</span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">{'<'}{email.senderEmail}{'>'}</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {new Date(email.date).toLocaleString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          <div className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed border-t border-[var(--border)] pt-4">
            {emailBody || 'Chargement du contenu...'}
          </div>

          {draft && (
            <HermesDraftBubble
              draft={draft.content}
              confidence={draft.confidence}
              actionType={draft.type === 'summary' ? 'summary' : draft.type === 'analyze' ? 'classify' : 'reply'}
              onCopy={() => {}}
              onInsert={handleInsertDraft}
              onDismiss={handleDismissDraft}
            />
          )}
        </div>
      </div>

      {isComposing && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg)]">
            <Reply className="w-3.5 h-3.5" />
            Repondre a <span className="font-medium text-[var(--text)]">{email.senderEmail}</span>
          </div>
          <div className="p-4">
            <textarea
              autoFocus
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full min-h-[120px] bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent)]"
              placeholder="Votre message..."
            />
            <div className="flex items-center justify-between mt-3">
              <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsComposing(false); setReplyContent(''); }}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim()}
                  className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] disabled:opacity-50 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
