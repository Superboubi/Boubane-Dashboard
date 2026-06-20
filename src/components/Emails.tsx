import { useState, useEffect, useCallback } from "react";
import { AppState, Email } from "../types";
import { Inbox, Send, Archive, Trash2, PenTool, Mail, RefreshCw, Loader2, X } from "lucide-react";
import { EmailDetail } from "./emails/EmailDetail";

interface ApiEmail {
  id: number;
  subject: string;
  from: { name?: string; email: string };
  date: string;
  flags: string[];
  folder: string;
}

export function Emails({ state, updateState, navigateToChat }: { state: AppState, updateState: (s: Partial<AppState>) => void, navigateToChat: () => void }) {
  const [folder, setFolder] = useState<'INBOX'|'SENT'|'ARCHIVE'|'TRASH'|'DRAFT'>('INBOX');
  const [selectedMail, setSelectedMail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [emailBodies, setEmailBodies] = useState<Record<number, string>>({});

  const fetchEmails = useCallback(async (currentFolder: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/emails?folder=${currentFolder}&limit=50`);
      const data = await res.json();
      if (data.success && data.emails) {
        const mapped: Email[] = data.emails.map((e: ApiEmail) => ({
          id: `mail-${e.id}`,
          sender: e.from.name || e.from.email,
          senderEmail: e.from.email,
          subject: e.subject || '(Sans objet)',
          body: emailBodies[e.id] ? emailBodies[e.id] : '',
          date: e.date,
          read: !e.flags.includes('\\Seen'),
          starred: e.flags.includes('\\Flagged'),
          folder: currentFolder as any,
          category: 'none'
        }));
        setEmails(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [emailBodies]);

  useEffect(() => {
    fetchEmails(folder);
  }, [folder]);

  useEffect(() => {
    const interval = setInterval(() => fetchEmails(folder, false), 60000);
    return () => clearInterval(interval);
  }, [folder, fetchEmails]);

  const fetchEmailBody = async (apiId: number) => {
    if (emailBodies[apiId]) return;
    try {
      const res = await fetch(`/api/emails/${apiId}`);
      const data = await res.json();
      if (data.success) {
        setEmailBodies(prev => ({ ...prev, [apiId]: data.body }));
      }
    } catch (err) {
      console.error('Failed to fetch email body:', err);
    }
  };

  const handleSelect = async (m: Email) => {
    setSelectedMail(m);
    const apiId = parseInt(m.id.replace('mail-', ''));
    if (!isNaN(apiId)) {
      await fetchEmailBody(apiId);
    }
    setEmails(prev => prev.map(e => e.id === m.id ? { ...e, read: true } : e));
  };

  const getSelectedMailBody = () => {
    if (!selectedMail) return '';
    const apiId = parseInt(selectedMail.id.replace('mail-', ''));
    return emailBodies[apiId] || selectedMail.body;
  };

  const handleMove = (id: string, toFolder: 'INBOX' | 'SENT' | 'ARCHIVE' | 'TRASH' | 'DRAFT') => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: toFolder } : e));
    if (selectedMail?.id === id && toFolder !== 'INBOX') {
      setSelectedMail(null);
    }
  };

  const handleMarkUnread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails(prev => prev.map(mail => mail.id === id ? { ...mail, read: false } : mail));
    if (selectedMail?.id === id) setSelectedMail(null);
  };

  const handleReply = (draft: string) => {
    if (!selectedMail) return;
    const newReply: Email = {
      id: 'mail-' + Date.now(),
      sender: 'Moi',
      senderEmail: 'moi@domain.com',
      subject: 'Re: ' + selectedMail.subject,
      body: draft,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'SENT',
      category: 'none'
    };
    setEmails(prev => [newReply, ...prev]);
    handleMove(selectedMail.id, 'ARCHIVE');
  };

  const folderLabels: Record<string, string> = {
    INBOX: 'Boite de reception',
    SENT: 'Envoyes',
    DRAFT: 'Brouillons',
    ARCHIVE: 'Archives',
    TRASH: 'Corbeille'
  };

  const folders = [
    { id: 'INBOX' as const, icon: Inbox },
    { id: 'SENT' as const, icon: Send },
    { id: 'DRAFT' as const, icon: PenTool },
    { id: 'ARCHIVE' as const, icon: Archive },
    { id: 'TRASH' as const, icon: Trash2 },
  ];

  return (
    <div className="h-full flex flex-col md:flex-row bg-[var(--bg)] animate-in fade-in duration-300 relative">
      {/* Folder sidebar */}
      <div className="w-full md:w-48 lg:w-56 border-b md:border-b-0 md:border-r border-[var(--border)] shrink-0 bg-[var(--bg-surface)] flex flex-col">
        <div className="p-2.5 space-y-1">
          {folders.map(f => {
            const Icon = f.icon;
            const count = f.id === 'INBOX' ? emails.filter(e => e.folder === 'INBOX' && !e.read).length : 0;
            return (
              <button key={f.id} onClick={() => { setFolder(f.id); setSelectedMail(null); }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                  folder === f.id ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{folderLabels[f.id]}</span>
                {count > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--bg)] font-bold">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-auto p-2 border-t border-[var(--border)]">
          <button
            onClick={() => fetchEmails(folder)}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className={`flex-1 md:w-80 lg:w-96 flex flex-col ${selectedMail ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center justify-between bg-[var(--bg-surface)]">
          <h2 className="font-semibold text-sm text-[var(--text)]">
            {folderLabels[folder]}
          </h2>
          <div className="flex items-center gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
            <span className="text-[10px] md:text-xs font-medium px-1.5 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text-muted)]">{emails.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {loading && emails.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
              <Loader2 className="w-10 h-10 text-[var(--border)] mb-4 animate-spin" />
              <div className="text-sm text-[var(--text-muted)] font-medium">Chargement des emails...</div>
            </div>
          ) : emails.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
              <Mail className="w-10 h-10 text-[var(--border)] mb-4" />
              <div className="text-sm text-[var(--text-muted)] font-medium">C'est vide ici.</div>
            </div>
          ) : emails.map(m => (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border)]/50 ${
                selectedMail?.id === m.id ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'
              } ${!m.read ? 'bg-[var(--accent)]/5' : ''}`}
            >
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                  {!m.read && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />}
                  <span className={`text-xs truncate ${!m.read ? 'font-bold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.sender}</span>
                </div>
                <span className={`text-[9px] md:text-[10px] shrink-0 font-mono ${!m.read ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                  {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className={`text-xs truncate mt-0.5 ${!m.read ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.subject}</div>
              <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 hidden sm:block">{m.body ? m.body.substring(0, 50) + '...' : 'Chargement...'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail */}
      <div className={`flex-1 min-w-0 ${!selectedMail ? 'hidden md:flex' : 'flex'} bg-[var(--bg)]`}>
        {selectedMail ? (
          <EmailDetail
            email={selectedMail}
            emailBody={getSelectedMailBody()}
            onBack={() => setSelectedMail(null)}
            onMove={handleMove}
            onMarkUnread={handleMarkUnread}
            onReply={handleReply}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--bg-surface)]">
            <div className="text-center text-[var(--text-muted)]">
              <Mail className="w-12 h-12 mx-auto mb-4 text-[var(--border)]" />
              <p className="text-sm font-medium">Selectionnez un email pour le lire</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
