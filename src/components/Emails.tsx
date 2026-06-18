import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, Email } from "../types";
import {
  Archive, Trash2, CheckCircle2, Sparkles, Inbox, Send, FileText, Mail,
  Bot, PenTool, X, Forward, MoreVertical, Paperclip, Search,
  ArrowLeft, Star, Bell, BellOff,
  ChevronDown, SlidersHorizontal,
  Loader2, Check, Clock3
} from "lucide-react";

const AVATAR_COLORS = [
  'bg-[var(--border)] text-[var(--text)]',
  'bg-[var(--bg-hover)] text-[var(--text)]',
  'bg-[var(--border)] text-[var(--text)]',
  'bg-[var(--bg-hover)] text-[var(--text)]',
  'bg-[var(--border)] text-[var(--text)]',
  'bg-[var(--bg-hover)] text-[var(--text)]',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const INBOX_TABS = [
  { id: 'primary', label: 'Principale', icon: Inbox },
  { id: 'social', label: 'Social', icon: Bell },
  { id: 'updates', label: 'Updates', icon: BellOff },
] as const;

type InboxTab = typeof INBOX_TABS[number]['id'];

function useStreamingText() {
  const [displayed, setDisplayed] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useCallback(async (text: string, speed = 12) => {
    setIsStreaming(true); setDisplayed('');
    let idx = 0; const step = 2;
    intervalRef.current = setInterval(() => {
      idx += step;
      if (idx >= text.length) { setDisplayed(text); setIsStreaming(false); if (intervalRef.current) clearInterval(intervalRef.current); }
      else setDisplayed(text.slice(0, idx));
    }, speed);
  }, []);
  const cancel = useCallback(() => { if (intervalRef.current) clearInterval(intervalRef.current); setIsStreaming(false); }, []);
  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);
  return { displayed, isStreaming, stream, cancel };
}

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const handlers = {
    onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; },
    onTouchMove: (e: React.TouchEvent) => { setOffsetX(e.touches[0].clientX - startX.current); },
    onTouchEnd: () => {
      if (offsetX < -80) onSwipeLeft();
      else if (offsetX > 80) onSwipeRight();
      setOffsetX(0);
    },
  };
  return { offsetX, handlers, style: offsetX !== 0 ? { transform: `translateX(${offsetX}px)`, transition: 'none' } as const : {} };
}

function getCategoryBadge(cat: string) {
  switch (cat) {
    case 'important': return <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]">Urgent</span>;
    case 'finance': return <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]">Finance</span>;
    case 'business': return <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]">Business</span>;
    case 'update': return <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]">Notif</span>;
    default: return null;
  }
}

function SmartReplyChips({ onSelect, loading }: { onSelect: (mood: string) => void; loading: boolean }) {
  const chips = [
    { id: 'professional', label: 'Merci, je reviens vers vous' },
    { id: 'positive', label: 'Accepté avec plaisir' },
    { id: 'more_details', label: 'Pouvez-vous préciser ?' },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {chips.map(c => (
        <button
          key={c.id}
          disabled={loading}
          onClick={() => onSelect(c.id)}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-[var(--border)] hover:bg-[var(--bg-hover)] disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function Emails({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void, navigateToChat: () => void }) {
  const [inboxTab, setInboxTab] = useState<InboxTab>('primary');
  const [folder, setFolder] = useState<'INBOX' | 'SENT' | 'ARCHIVE' | 'TRASH' | 'DRAFT'>('INBOX');
  const [selectedMail, setSelectedMail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [mailAnalysis, setMailAnalysis] = useState<Record<string, { sentiment: string; urgency: string; recommendedAction: string }>>({});
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
  const [refining, setRefining] = useState(false);
  const [processedIds, setProcessedIds] = useState<Record<string, boolean>>({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoMail, setUndoMail] = useState<Email | null>(null);
  const [quickFilter, setQuickFilter] = useState<'all' | 'starred' | 'unread' | 'attachments'>('all');
  const [lastAction, setLastAction] = useState<{ type: 'archive' | 'trash'; emails: Email[] } | null>(null);
  const { displayed: streamedDraft, isStreaming: draftStreaming, stream: streamDraft } = useStreamingText();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setShowShortcuts(s => !s); }
      if (e.key === 'Escape') { if (selectedMail) closeDetail(); else { setShowSearch(false); searchRef.current?.blur(); } }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && selectedMail && activeReply && draftContent.trim()) { e.preventDefault(); sendReply(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100); }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !isComposing && !selectedMail && !showSearch) { handleCompose(); }
      if (e.key === 'e' && selectedMail && !isComposing) { moveMail(selectedMail.id, 'ARCHIVE'); }
      if (e.key === '#' && selectedMail && !isComposing) { moveMail(selectedMail.id, 'TRASH'); }
      if (e.key === 'u' && selectedMail) { updateState({ emails: state.emails.map(m => m.id === selectedMail.id ? { ...m, read: !m.read } : m) }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedMail, activeReply, draftContent, isComposing, showSearch]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id) { const m = state.emails.find(x => x.id === detail.id); if (m) handleSelect(m); }
    };
    window.addEventListener('boubane-select-mail', handler);
    return () => window.removeEventListener('boubane-select-mail', handler);
  }, [state.emails]);

  useEffect(() => {
    const unprocessed = state.emails.filter(e => !e.sentiment && !processedIds[e.id]);
    if (!unprocessed.length) return;
    unprocessed.forEach(async (mail) => {
      setProcessedIds(p => ({ ...p, [mail.id]: true }));
      try {
        const res = await fetch("/api/mail/ai", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "auto-process", emailSubject: mail.subject, emailBody: mail.body, emailSender: mail.sender })
        });
        const data = await res.json();
        if (data.success) {
          updateState({ emails: state.emails.map(e => e.id === mail.id ? { ...e, category: (data.category && data.category !== "none") ? data.category : e.category, sentiment: data.sentiment || "neutre", urgency: data.urgency || "moyenne", aiRecommendation: data.recommendedAction, aiSummary: data.aiSummary, aiDraft: data.aiDraft } : e) });
        }
      } catch { /* ignore */ }
    });
  }, [state.emails]);

  useEffect(() => {
    if (selectedMail && selectedMail.aiDraft && !draftContent) setDraftContent(selectedMail.aiDraft);
  }, [selectedMail?.aiDraft]);

  useEffect(() => {
    if (!undoMail) return;
    const t = setTimeout(() => setUndoMail(null), 4000);
    return () => clearTimeout(t);
  }, [undoMail]);

  useEffect(() => {
    if (!lastAction) return;
    const t = setTimeout(() => setLastAction(null), 5000);
    return () => clearTimeout(t);
  }, [lastAction]);

  const inboxEmails = state.emails.filter(e => e.folder === folder).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredEmails = inboxEmails.filter(e => {
    const tabMatch = inboxTab === 'primary' ? ['important', 'business', 'none'].includes(e.category) : inboxTab === 'social' ? e.category === 'update' : e.category === 'finance' || e.category === 'update';
    const searchMatch = !searchTerm || e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || e.sender.toLowerCase().includes(searchTerm.toLowerCase()) || e.body.toLowerCase().includes(searchTerm.toLowerCase());
    const filterMatch = quickFilter === 'all' ? true : quickFilter === 'starred' ? e.starred : quickFilter === 'unread' ? !e.read : !!e.attachments?.length;
    return tabMatch && searchMatch && filterMatch;
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = (m: Email) => {
    setSelectedMail(m); setIsComposing(false); setActiveReply(m.id); setAiInstructions('');
    if (m.aiDraft) setDraftContent(m.aiDraft); else { setDraftContent(''); generateAiReply(m, 'professional'); }
    if (!m.read) updateState({ emails: state.emails.map(e => e.id === m.id ? { ...e, read: true } : e) });
  };

  const closeDetail = () => { setSelectedMail(null); setActiveReply(null); setDraftContent(''); };
  const moveMail = (id: string, toFolder: 'INBOX' | 'SENT' | 'ARCHIVE' | 'TRASH' | 'DRAFT') => {
    const mail = state.emails.find(e => e.id === id);
    if (mail && (toFolder === 'ARCHIVE' || toFolder === 'TRASH')) {
      setLastAction({ type: toFolder === 'ARCHIVE' ? 'archive' : 'trash', emails: [mail] });
    }
    updateState({ emails: state.emails.map(e => e.id === id ? { ...e, folder: toFolder } : e) });
    if (selectedMail?.id === id && toFolder !== 'INBOX') closeDetail();
  };

  const batchMove = (ids: string[], toFolder: 'ARCHIVE' | 'TRASH' | 'INBOX') => {
    const mails = state.emails.filter(e => ids.includes(e.id));
    if (mails.length && (toFolder === 'ARCHIVE' || toFolder === 'TRASH')) {
      setLastAction({ type: toFolder === 'ARCHIVE' ? 'archive' : 'trash', emails: mails });
    }
    updateState({ emails: state.emails.map(e => ids.includes(e.id) ? { ...e, folder: toFolder, read: toFolder === 'INBOX' ? false : e.read } : e) });
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const batchMarkRead = (ids: string[], read: boolean) => {
    updateState({ emails: state.emails.map(e => ids.includes(e.id) ? { ...e, read } : e) });
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const toggleStar = (e: React.MouseEvent, id: string) => { e.stopPropagation(); updateState({ emails: state.emails.map(m => m.id === id ? { ...m, starred: !m.starred } : m) }); };
  const toggleSelect = (id: string) => { setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };

  const handleCompose = () => { closeDetail(); setComposeData({ to: '', subject: '', body: '' }); setIsComposing(true); };

  const sendCompose = () => {
    const newMail: Email = { id: 'mail-' + Date.now(), sender: 'Moi', senderEmail: 'moi@domain.com', subject: composeData.subject || '(Sans objet)', body: composeData.body, date: new Date().toISOString(), read: true, starred: false, folder: 'SENT', category: 'none' };
    updateState({ emails: [newMail, ...state.emails] }); setIsComposing(false); setFolder('SENT');
  };

  const generateAiReply = async (mail: Email, mood: string) => {
    setAiDraftLoading(true); setActiveReply(mail.id);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", emailSubject: mail.subject, emailBody: mail.body, emailSender: mail.sender, mood, userInstructions: aiInstructions })
      });
      const data = await res.json();
      if (data.success) { setDraftContent(data.reply); await streamDraft(data.reply, 10); }
    } catch { /* ignore */ }
    finally { setAiDraftLoading(false); }
  };

  const refineDraftText = async () => {
    if (!draftContent) return; setRefining(true);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite", emailSubject: selectedMail?.subject || "", emailBody: selectedMail?.body || "", draftContent, userInstructions: aiInstructions || "Rendre plus professionnel et fluide." })
      });
      const data = await res.json();
      if (data.success) setDraftContent(data.reply);
    } catch { /* ignore */ } finally { setRefining(false); }
  };

  const sendReply = () => {
    if (!selectedMail) return;
    const newReply: Email = { id: 'mail-' + Date.now(), sender: 'Moi', senderEmail: 'moi@domain.com', subject: 'Re: ' + selectedMail.subject, body: draftContent, date: new Date().toISOString(), read: true, starred: false, folder: 'SENT', category: 'none' };
    updateState({ emails: [newReply, ...state.emails] });
    setUndoMail(newReply);
    setActiveReply(null); setDraftContent(''); setAiInstructions('');
    moveMail(selectedMail.id, 'ARCHIVE');
  };

  const handleForward = () => {
    if (!selectedMail) return;
    setComposeData({ to: '', subject: 'Fwd: ' + selectedMail.subject, body: '\n\n---------- Message transféré ----------\nDe: ' + selectedMail.sender + ' <' + selectedMail.senderEmail + '>\nDate: ' + new Date(selectedMail.date).toLocaleString('fr-FR') + '\nObjet: ' + selectedMail.subject + '\nÀ: Moi\n\n' + selectedMail.body });
    closeDetail(); setIsComposing(true);
  };

  return (
    <div className="h-full flex flex-col md:flex-row relative">
      <div className={`w-full md:w-[400px] lg:w-[440px] border-r border-[var(--border)] shrink-0 flex flex-col bg-[var(--bg)] ${(selectedMail || isComposing) ? 'hidden md:flex' : 'flex'}`}>
        <div className="shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg text-[var(--text)] tracking-tight">
                {folder === 'INBOX' ? 'Boîte de réception' : folder === 'SENT' ? 'Envoyés' : folder === 'DRAFT' ? 'Brouillons' : folder === 'ARCHIVE' ? 'Archives' : 'Corbeille'}
              </h2>
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                {filteredEmails.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg transition-all cursor-pointer ${showSearch ? 'bg-[var(--bg-hover)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => setShowShortcuts(!showShortcuts)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button onClick={handleCompose} className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-xs font-medium hover:bg-[var(--accent-hover)] transition-all cursor-pointer active:scale-95">
                <PenTool className="w-3.5 h-3.5" /> Nouveau
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input ref={searchRef} autoFocus type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un expéditeur, un sujet..." className="w-full bg-[var(--bg-hover)] rounded-lg pl-9 pr-8 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">✕</button>}
              </div>
            </div>
          )}

          {folder === 'INBOX' && !searchTerm && (
            <div className="flex px-4 gap-1 pb-2">
              {INBOX_TABS.map(tab => {
                const Icon = tab.icon;
                const count = inboxEmails.filter(e => tab.id === 'primary' ? ['important', 'business', 'none'].includes(e.category) : tab.id === 'social' ? e.category === 'update' : e.category === 'finance' || e.category === 'update').length;
                return (
                  <button key={tab.id} onClick={() => setInboxTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    inboxTab === tab.id ? 'bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={`text-[9px] font-mono ${inboxTab === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {[
              { id: 'INBOX' as const, label: 'Boîte', icon: Inbox, count: state.emails.filter(e => e.folder === 'INBOX' && !e.read).length },
              { id: 'SENT' as const, label: 'Envoyés', icon: Send },
              { id: 'DRAFT' as const, label: 'Brouillons', icon: FileText, count: state.emails.filter(e => e.folder === 'DRAFT').length },
              { id: 'ARCHIVE' as const, label: 'Archives', icon: Archive },
              { id: 'TRASH' as const, label: 'Corbeille', icon: Trash2 },
            ].map(f => {
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => { setFolder(f.id); closeDetail(); setInboxTab('primary'); setSearchTerm(''); setQuickFilter('all'); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    folder === f.id ? 'bg-[var(--bg-hover)] text-[var(--text)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}>
                  <Icon className="w-3 h-3" />
                  <span>{f.label}</span>
                  {f.count !== undefined && f.count > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text)]">{f.count}</span>}
                </button>
              );
            })}
          </div>

          {folder === 'INBOX' && !searchTerm && (
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
              {[
                { id: 'all' as const, label: 'Tous' },
                { id: 'unread' as const, label: 'Non lus' },
                { id: 'starred' as const, label: 'Star' },
                { id: 'attachments' as const, label: 'Pièces jointes' },
              ].map(f => (
                <button key={f.id} onClick={() => setQuickFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    quickFilter === f.id ? 'bg-[var(--bg-hover)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="shrink-0 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-hover)] flex items-center gap-3">
            <button onClick={() => { setSelectedIds(new Set()); setSelectionMode(false); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-[var(--text)]">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
            <div className="flex-1" />
            <button onClick={() => batchMove(Array.from(selectedIds), 'ARCHIVE')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer">
              <Archive className="w-3 h-3" /> Archiver
            </button>
            <button onClick={() => batchMove(Array.from(selectedIds), 'TRASH')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer">
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
            <button onClick={() => batchMarkRead(Array.from(selectedIds), true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer">
              <CheckCircle2 className="w-3 h-3" /> Lu
            </button>
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">Boîte de réception vide</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Appuyez sur <kbd className="px-1 py-0.5 rounded text-[9px] bg-[var(--bg-hover)]">N</kbd> pour composer</p>
            </div>
          ) : filteredEmails.map((m) => (
            <EmailRow
              key={m.id}
              mail={m}
              isSelected={selectedMail?.id === m.id}
              isSelectedMulti={selectedIds.has(m.id)}
              selectionMode={selectionMode}
              onSelect={() => handleSelect(m)}
              onToggleSelect={() => toggleSelect(m.id)}
              onToggleStar={(e) => toggleStar(e, m.id)}
              onArchive={() => moveMail(m.id, 'ARCHIVE')}
              onTrash={() => moveMail(m.id, 'TRASH')}
            />
          ))}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] px-4 py-2 flex items-center gap-3 text-[9px] text-[var(--text-muted)] font-mono bg-[var(--bg)]">
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text)]">N</kbd> Composer</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text)]">⌘K</kbd> Chercher</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text)]">E</kbd> Archiver</span>
          <span className="flex-1 text-right">{filteredEmails.length} messages</span>
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${(!selectedMail && !isComposing) ? 'hidden md:flex items-center justify-center bg-[var(--bg)]' : 'flex'}`}>
        {isComposing ? (
          <ComposeView
            composeData={composeData} setComposeData={setComposeData}
            onClose={() => setIsComposing(false)} onSend={sendCompose}
          />
        ) : !selectedMail ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text)]">Messagerie</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Sélectionnez un message pour lire et répondre.</p>
          </div>
        ) : (
          <DetailView
            mail={selectedMail}
            mailAnalysis={mailAnalysis[selectedMail.id]}
            activeReply={activeReply}
            draftContent={draftContent}
            setDraftContent={setDraftContent}
            aiDraftLoading={aiDraftLoading}
            draftStreaming={draftStreaming}
            streamedDraft={streamedDraft}
            aiInstructions={aiInstructions}
            setAiInstructions={setAiInstructions}
            onClose={closeDetail}
            onArchive={() => moveMail(selectedMail.id, 'ARCHIVE')}
            onTrash={() => moveMail(selectedMail.id, 'TRASH')}
            onForward={handleForward}
            onGenerateReply={(mood) => generateAiReply(selectedMail, mood)}
            onRefine={refineDraftText}
            onSendReply={sendReply}
            onSetReply={() => setActiveReply(selectedMail.id)}
          />
        )}
      </div>

      {undoMail && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-xs text-[var(--text)]">Message envoyé</span>
          <button onClick={() => { setUndoMail(null); }} className="text-xs font-medium text-[var(--accent)] cursor-pointer">Annuler</button>
        </div>
      )}

      {lastAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-xs text-[var(--text)]">
            {lastAction.emails.length > 1
              ? `${lastAction.emails.length} messages ${lastAction.type === 'archive' ? 'archivés' : 'supprimés'}`
              : `Message ${lastAction.type === 'archive' ? 'archivé' : 'supprimé'}`}
          </span>
          <button onClick={() => {
            updateState({ emails: state.emails.map(e => lastAction.emails.some(le => le.id === e.id) ? { ...e, folder: 'INBOX' } : e) });
            setLastAction(null);
          }} className="text-xs font-medium text-[var(--accent)] cursor-pointer">Annuler</button>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg max-w-sm w-full mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Raccourcis clavier</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: 'N', desc: 'Nouveau message' },
                { key: '⌘K', desc: 'Rechercher' },
                { key: 'E', desc: 'Archiver' },
                { key: '#', desc: 'Supprimer' },
                { key: 'U', desc: 'Marquer lu / non lu' },
                { key: '⌘⏎', desc: 'Envoyer la réponse' },
                { key: 'Esc', desc: 'Fermer le panneau' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-[var(--text-muted)]">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text)] font-mono text-[10px]">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!selectedMail && !isComposing && (
        <button onClick={handleCompose} className="md:hidden fixed right-4 bottom-4 w-12 h-12 bg-[var(--accent)] text-[var(--bg)] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all z-20 cursor-pointer">
          <PenTool className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function EmailRow({ mail, isSelected, isSelectedMulti, selectionMode, onSelect, onToggleSelect, onToggleStar, onArchive, onTrash }: {
  mail: Email; isSelected: boolean; isSelectedMulti: boolean; selectionMode: boolean;
  onSelect: () => void; onToggleSelect: () => void; onToggleStar: (e: React.MouseEvent) => void; onArchive: () => void; onTrash: () => void;
}) {
  const { offsetX, handlers, style } = useSwipe(onArchive, onTrash);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      {...handlers}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={selectionMode ? onToggleSelect : onSelect}
      className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-[var(--border)]/50 ${
        isSelected ? 'bg-[var(--bg-hover)] border-l-[3px] border-l-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'
      } ${!mail.read ? 'bg-[var(--bg-surface)]' : ''}`}
      style={{ ...style, transition: offsetX === 0 ? 'all 0.2s' : 'none' }}
    >
      {offsetX > 40 && <div className="absolute inset-y-0 left-0 w-[calc(100%+80px)] bg-[var(--bg-hover)] -z-10 flex items-center pl-4"><Archive className="w-5 h-5 text-[var(--text-muted)]" /></div>}
      {offsetX < -40 && <div className="absolute inset-y-0 right-0 w-[calc(100%+80px)] bg-[var(--bg-hover)] -z-10 flex items-center justify-end pr-4"><Trash2 className="w-5 h-5 text-[var(--text-muted)]" /></div>}

      {(hovering || selectionMode) && (
        <div className="shrink-0 pt-1" onClick={e => { e.stopPropagation(); onToggleSelect(); }}>
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelectedMulti ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
            {isSelectedMulti && <Check className="w-3 h-3 text-[var(--bg)]" />}
          </div>
        </div>
      )}

      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-medium ${getAvatarColor(mail.sender)}`}>
        {mail.sender.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-sm truncate ${!mail.read ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>
            {mail.sender}
            {!mail.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] ml-1.5 align-middle" />}
          </span>
          <span className={`text-[10px] shrink-0 font-mono ${!mail.read ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            {timeAgo(mail.date)}
          </span>
        </div>
        <div className={`text-sm truncate mt-0.5 ${!mail.read ? 'font-medium text-[var(--text)]' : 'text-[var(--text)]'}`}>{mail.subject}</div>
        <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">{mail.body.substring(0, 80)}</div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {getCategoryBadge(mail.category)}
          {mail.aiDraft && <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-[var(--bg-hover)] text-[var(--text-muted)]"><Sparkles className="w-2 h-2" /> IA</span>}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
        <button onClick={onToggleStar} className={`p-0.5 transition-all cursor-pointer ${mail.starred ? 'text-amber-400' : 'text-transparent group-hover:text-[var(--text-muted)]'} ${hovering ? 'text-[var(--text-muted)]' : ''}`}>
          <Star className={`w-3.5 h-3.5 ${mail.starred ? 'fill-amber-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function DetailView({ mail, mailAnalysis, activeReply, draftContent, setDraftContent, aiDraftLoading, draftStreaming, streamedDraft, aiInstructions, setAiInstructions, onClose, onArchive, onTrash, onForward, onGenerateReply, onRefine, onSendReply, onSetReply }: {
  mail: Email; mailAnalysis?: { sentiment: string; urgency: string; recommendedAction: string };
  activeReply: string | null;
  draftContent: string; setDraftContent: (s: string) => void;
  aiDraftLoading: boolean; draftStreaming: boolean; streamedDraft: string;
  aiInstructions: string; setAiInstructions: (s: string) => void;
  onClose: () => void; onArchive: () => void; onTrash: () => void;
  onForward: () => void; onGenerateReply: (mood: string) => void;
  onRefine: () => void; onSendReply: () => void; onSetReply: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] overflow-hidden">
      <div className="shrink-0 px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)] min-h-[48px]">
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
          <button onClick={onArchive} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer" title="Archiver (E)"><Archive className="w-4 h-4" /></button>
          <button onClick={onTrash} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer" title="Corbeille (#)"><Trash2 className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-[var(--border)] mx-1 hidden sm:block" />
          <button onClick={onForward} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer hidden sm:block" title="Transférer"><Forward className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          {getCategoryBadge(mail.category)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
          <h1 className="text-lg md:text-xl font-semibold text-[var(--text)] leading-tight">{mail.subject}</h1>

          <div className="flex items-start gap-3 pb-3 border-b border-[var(--border)]">
            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-medium ${getAvatarColor(mail.sender)}`}>
              {mail.sender.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm text-[var(--text)]">{mail.sender}</span>
                <button onClick={() => setShowDetails(!showDetails)} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer">
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{mail.senderEmail}</span>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{new Date(mail.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              {showDetails && (
                <div className="mt-2 bg-[var(--bg-hover)] rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">À</span><span className="text-[var(--text)]">moi</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date</span><span className="text-[var(--text)]">{new Date(mail.date).toLocaleString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Objet</span><span className="text-[var(--text)]">{mail.subject}</span></div>
                </div>
              )}
            </div>
          </div>

          {(mailAnalysis?.recommendedAction || mail.aiRecommendation) && (
            <div className="bg-[var(--bg-hover)] rounded-lg p-3 flex gap-3 items-start">
              <Sparkles className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Conseil</p>
                <p className="text-sm text-[var(--text)]">{mailAnalysis?.recommendedAction || mail.aiRecommendation}</p>
              </div>
            </div>
          )}

          <div className="text-sm text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
            {mail.body}
          </div>

          {mail.attachments && mail.attachments.length > 0 && (
            <div className="bg-[var(--bg-hover)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                <Paperclip className="w-3 h-3" />
                <span>{mail.attachments.length} pièce{mail.attachments.length > 1 ? 's' : ''} jointe{mail.attachments.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mail.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-all group">
                    <div className="w-7 h-7 rounded flex items-center justify-center text-[8px] font-medium bg-[var(--bg-hover)] text-[var(--text-muted)]">
                      {att.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">{att.name}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{att.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeReply !== mail.id && (
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Réponse rapide</div>
              <SmartReplyChips onSelect={(mood) => { onSetReply(); onGenerateReply(mood); }} loading={aiDraftLoading} />
            </div>
          )}

          {activeReply === mail.id && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              {draftStreaming && <div className="h-0.5 bg-[var(--accent)]" />}

              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <SmartReplyChips onSelect={(mood) => onGenerateReply(mood)} loading={aiDraftLoading} />
              </div>

              <div className="px-4 py-2 border-b border-[var(--border)] flex gap-2">
                <input type="text" value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} placeholder="Ajuster le ton..." className="flex-1 bg-transparent border-none text-xs text-[var(--text)] focus:outline-none placeholder:text-[var(--text-muted)]" />
                <button onClick={onRefine} disabled={!draftContent} className="text-[10px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-30 transition-all cursor-pointer shrink-0">Ajuster</button>
              </div>

              <textarea
                value={draftStreaming ? streamedDraft : draftContent}
                onChange={e => setDraftContent(e.target.value)}
                placeholder={aiDraftLoading ? "Hermes rédige..." : "Écrivez votre réponse..."}
                className="w-full min-h-[120px] bg-transparent text-sm text-[var(--text)] p-4 resize-none focus:outline-none leading-relaxed"
              />

              <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-hover)]">
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="text-[var(--text-muted)]"><kbd className="px-1 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">⌘</kbd>+<kbd className="px-1 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">⏎</kbd></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDraftContent('')} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer">Annuler</button>
                  <button onClick={onSendReply} className="px-4 py-1.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-xs font-medium hover:bg-[var(--accent-hover)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <Send className="w-3.5 h-3.5" /> Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeView({ composeData, setComposeData, onClose, onSend }: {
  composeData: { to: string; subject: string; body: string };
  setComposeData: (d: any) => void;
  onClose: () => void; onSend: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)]">
      <div className="shrink-0 px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
        <h2 className="text-sm font-semibold flex items-center gap-2"><PenTool className="w-4 h-4 text-[var(--text-muted)]" /> Nouveau message</h2>
        <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-2xl w-full mx-auto">
        <div className="space-y-3">
          <div className="border-b border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
            <input autoFocus type="text" value={composeData.to} onChange={e => setComposeData({ ...composeData, to: e.target.value })} className="w-full bg-transparent py-2 text-sm focus:outline-none text-[var(--text)] placeholder:text-[var(--text-muted)]" placeholder="À" />
          </div>
          <div className="border-b border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
            <input type="text" value={composeData.subject} onChange={e => setComposeData({ ...composeData, subject: e.target.value })} className="w-full bg-transparent py-2 text-sm focus:outline-none font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]" placeholder="Objet" />
          </div>
        </div>
        <textarea value={composeData.body} onChange={e => setComposeData({ ...composeData, body: e.target.value })} className="w-full min-h-[250px] bg-transparent text-sm resize-none focus:outline-none text-[var(--text)] leading-relaxed" placeholder="Écrivez votre message..." />
      </div>
      <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-hover)]">
        <button onClick={onSend} disabled={!composeData.to} className="px-5 py-2 bg-[var(--accent)] text-[var(--bg)] disabled:opacity-30 rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 cursor-pointer active:scale-95">
          <Send className="w-4 h-4" /> Envoyer
        </button>
        <span className="text-[9px] text-[var(--text-muted)] font-mono"><kbd className="px-1 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">⌘</kbd>+<kbd className="px-1 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">⏎</kbd></span>
      </div>
    </div>
  );
}