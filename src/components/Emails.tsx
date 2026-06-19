import { useState, useEffect, useCallback } from "react";
import { AppState, Email } from "../types";
import { Archive, Trash2, Reply, Sparkles, Inbox, Send, Mail, PenTool, Edit3, X, Forward, Clock, MoreVertical, Paperclip, MailPlus, ChevronDown, RefreshCw, Loader2 } from "lucide-react";

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
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>('');
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
          body: emailBodies[e.id] || '',
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

  // Auto-refresh every 60s
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
    setIsComposing(false);
    setActiveReply(null);
    setDraftContent('');
    const apiId = parseInt(m.id.replace('mail-', ''));
    if (!isNaN(apiId)) {
      await fetchEmailBody(apiId);
    }
    // Mark as read locally
    setEmails(prev => prev.map(e => e.id === m.id ? { ...e, read: true } : e));
  };

  const getSelectedMailBody = () => {
    if (!selectedMail) return '';
    const apiId = parseInt(selectedMail.id.replace('mail-', ''));
    return emailBodies[apiId] || selectedMail.body;
  };

  const moveMail = (id: string, toFolder: 'INBOX'|'SENT'|'ARCHIVE'|'TRASH'|'DRAFT') => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: toFolder } : e));
    if (selectedMail?.id === id && toFolder !== 'INBOX') {
      setSelectedMail(null);
      setActiveReply(null);
    }
  };

  const markUnread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails(prev => prev.map(mail => mail.id === id ? { ...mail, read: false } : mail));
    if (selectedMail?.id === id) setSelectedMail(null);
  };

  const handleCompose = () => {
    setSelectedMail(null);
    setActiveReply(null);
    setComposeData({ to: '', subject: '', body: '' });
    setIsComposing(true);
  };

  const sendCompose = () => {
    const newMail: Email = {
      id: 'mail-' + Date.now(),
      sender: 'Moi',
      senderEmail: 'moi@domain.com',
      subject: composeData.subject || '(Sans objet)',
      body: composeData.body,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'SENT',
      category: 'none'
    };
    setEmails(prev => [newMail, ...prev]);
    setIsComposing(false);
    setFolder('SENT');
  };

  const startAutomatedReply = async () => {
    if (!selectedMail) return;
    setActiveReply(selectedMail.id);
    setDraftContent('');
    try {
      const res = await fetch('/api/mail/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          emailSubject: selectedMail.subject,
          emailBody: getSelectedMailBody(),
          emailSender: selectedMail.sender,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setDraftContent(data.reply);
      } else {
        setDraftContent(`Bonjour ${selectedMail.sender.split(' ')[0] || ''},\n\nJ'ai bien pris connaissance de votre message concernant "${selectedMail.subject}".\n\nJe reviens vers vous rapidement.\n\nCordialement,\nLeo`);
      }
    } catch {
      setDraftContent(`Bonjour ${selectedMail.sender.split(' ')[0] || ''},\n\nJ'ai bien pris connaissance de votre message concernant "${selectedMail.subject}".\n\nJe reviens vers vous rapidement.\n\nCordialement,\nLeo`);
    }
  };

  const sendReply = () => {
    if (!selectedMail) return;
    const newReply: Email = {
      id: 'mail-' + Date.now(),
      sender: 'Moi',
      senderEmail: 'moi@domain.com',
      subject: 'Re: ' + selectedMail.subject,
      body: draftContent,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'SENT',
      category: 'none'
    };
    setEmails(prev => [newReply, ...prev]);
    setActiveReply(null);
    setDraftContent('');
    moveMail(selectedMail.id, 'ARCHIVE');
  };

  const handleForward = () => {
    if (!selectedMail) return;
    setComposeData({
      to: '',
      subject: 'Fwd: ' + selectedMail.subject,
      body: '\n\n---------- Message transféré ----------\nDe: ' + selectedMail.sender + ' <' + selectedMail.senderEmail + '>\nDate: ' + new Date(selectedMail.date).toLocaleString('fr-FR') + '\nObjet: ' + selectedMail.subject + '\nÀ: Moi\n\n' + getSelectedMailBody()
    });
    setSelectedMail(null);
    setActiveReply(null);
    setIsComposing(true);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[var(--bg)] animate-in fade-in duration-300 relative">

      {/* Folder sidebar (inner) */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--border)] shrink-0 p-4 space-y-4 bg-[var(--bg-surface)] flex flex-col justify-between">
        <div className="space-y-4">
          <button
            onClick={handleCompose}
            className="w-full flex items-center justify-center gap-2 bg-[var(--text)] text-[var(--bg)] px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <PenTool className="w-4 h-4" /> Nouveau message
          </button>

          <div className="space-y-1">
            <button onClick={() => {setFolder('INBOX'); setSelectedMail(null); setIsComposing(false)}} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${folder === 'INBOX' ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
              <div className="flex items-center gap-2"><Inbox className="w-4 h-4"/> Boîte de réception</div>
              {emails.filter(e => e.folder === 'INBOX' && !e.read).length > 0 && <span className="text-xs bg-[var(--accent)] text-[var(--bg)] px-1.5 rounded-full">{emails.filter(e => e.folder === 'INBOX' && !e.read).length}</span>}
            </button>
            <button onClick={() => {setFolder('SENT'); setSelectedMail(null); setIsComposing(false)}} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${folder === 'SENT' ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
              <Send className="w-4 h-4"/> Envoyés
            </button>
            <button onClick={() => {setFolder('DRAFT'); setSelectedMail(null); setIsComposing(false)}} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${folder === 'DRAFT' ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
              <div className="flex items-center gap-2"><Edit3 className="w-4 h-4"/> Brouillons</div>
              {emails.filter(e => e.folder === 'DRAFT').length > 0 && <span className="text-xs font-medium text-[var(--text-muted)]">{emails.filter(e => e.folder === 'DRAFT').length}</span>}
            </button>
            <button onClick={() => {setFolder('ARCHIVE'); setSelectedMail(null); setIsComposing(false)}} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${folder === 'ARCHIVE' ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
              <Archive className="w-4 h-4"/> Archives
            </button>
            <button onClick={() => {setFolder('TRASH'); setSelectedMail(null); setIsComposing(false)}} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${folder === 'TRASH' ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}>
              <Trash2 className="w-4 h-4"/> Corbeille
            </button>
          </div>
        </div>

        <button
          onClick={() => fetchEmails(folder)}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-[var(--border)] shrink-0 flex flex-col ${(selectedMail || isComposing) ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[var(--border)] shrink-0 flex items-center justify-between bg-[var(--bg-surface)] z-10">
          <h2 className="font-semibold text-[var(--text)] capitalize">
            {folder === 'INBOX' ? 'Boîte de réception' : folder === 'SENT' ? 'Envoyés' : folder === 'DRAFT' ? 'Brouillons' : folder === 'ARCHIVE' ? 'Archives' : 'Corbeille'}
          </h2>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />}
            <span className="text-xs font-medium px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text-muted)]">{emails.length}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto w-full divide-y divide-[var(--border)] relative bg-[var(--bg)]">
          {loading && emails.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
              <Loader2 className="w-10 h-10 text-[var(--border)] mb-4 animate-spin" />
              <div className="text-sm text-[var(--text-muted)] font-medium">Chargement des emails...</div>
            </div>
          ) : emails.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
              <Inbox className="w-10 h-10 text-[var(--border)] mb-4" />
              <div className="text-sm text-[var(--text-muted)] font-medium">C'est vide ici.</div>
            </div>
          ) : emails.map(m => (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`p-4 cursor-pointer transition-colors relative group ${(selectedMail?.id === m.id && !isComposing) ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--accent)] -ml-[1px]' : 'hover:bg-[var(--bg-hover)]'} ${!m.read && selectedMail?.id !== m.id && !isComposing ? 'bg-[var(--accent)]/5' : ''}`}
            >
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  {!m.read && <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0"></div>}
                  <span className={`text-sm truncate ${!m.read ? 'font-bold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.sender}</span>
                </div>
                <span className={`text-[10px] shrink-0 ml-2 ${!m.read ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>{new Date(m.date).toLocaleDateString()}</span>
              </div>
              <div className={`text-sm mb-1 truncate ${!m.read ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.subject}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{m.body ? m.body.substring(0, 50) + '...' : 'Chargement...'}</div>

              <button
                onClick={(e) => markUnread(e, m.id)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
                title="Marquer comme non lu"
              >
                <MailPlus className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detail or Compose */}
      <div className={`flex-1 flex flex-col min-w-0 ${(!selectedMail && !isComposing) ? 'hidden lg:flex bg-[var(--bg-surface)] items-center justify-center' : 'bg-[var(--bg)]'}`}>

        {isComposing ? (
          <div className="flex-1 flex flex-col h-full bg-[var(--bg)] animate-in fade-in">
             <div className="p-4 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
               <h2 className="text-lg font-semibold flex items-center gap-2"><PenTool className="w-5 h-5" /> Nouveau message</h2>
               <button onClick={() => setIsComposing(false)} className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)]"><X className="w-5 h-5"/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
               <div>
                 <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">À</label>
                 <input autoFocus type="email" value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="destinataire@exemple.com" />
               </div>
               <div>
                 <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Objet</label>
                 <input type="text" value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-[var(--accent)]" placeholder="Sujet de votre message" />
               </div>
               <div className="flex-1 flex flex-col h-full min-h-[300px]">
                 <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Message</label>
                 <textarea value={composeData.body} onChange={e => setComposeData({...composeData, body: e.target.value})} className="flex-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-[var(--accent)]" placeholder="Écrivez votre message ici..." />
               </div>
               <div className="pt-4 flex items-center justify-between border-t border-[var(--border)]">
                 <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"><Paperclip className="w-5 h-5" /></button>
                 <div className="flex gap-2">
                   <button onClick={() => setIsComposing(false)} className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg text-sm font-medium hover:bg-[var(--bg-surface)] transition-colors">Annuler</button>
                   <button onClick={sendCompose} disabled={!composeData.to} className="px-6 py-2 bg-[var(--text)] text-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                     <Send className="w-4 h-4" /> Envoyer
                   </button>
                 </div>
               </div>
             </div>
          </div>
        ) : !selectedMail ? (
          <div className="text-center text-[var(--text-muted)] flex flex-col items-center">
            <Mail className="w-12 h-12 mb-4 text-[var(--border)]" />
            <p className="text-sm font-medium">Sélectionnez un email pour le lire</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full animate-in fade-in">
            <div className="px-6 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)] min-h-[64px]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedMail(null)} className="lg:hidden p-2 -ml-2 text-[var(--text-muted)] rounded-md hover:bg-[var(--bg)]">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  <button onClick={() => moveMail(selectedMail.id, 'ARCHIVE')} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors" title="Archiver"><Archive className="w-4 h-4" /></button>
                  <button onClick={(e) => markUnread(e, selectedMail.id)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors" title="Marquer non lu"><MailPlus className="w-4 h-4" /></button>
                  <button onClick={() => moveMail(selectedMail.id, 'TRASH')} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--error)] rounded transition-colors" title="Supprimer (Corbeille)"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleForward} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors" title="Transférer"><Forward className="w-4 h-4" /></button>
                <button className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto relative">
              <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8">

                {/* Header */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-[var(--text)] leading-tight">{selectedMail.subject}</h1>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
                        {selectedMail.sender.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-[var(--text)]">{selectedMail.sender}</span>
                          <span className="text-xs text-[var(--text-muted)]">&lt;{selectedMail.senderEmail}&gt;</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          À moi <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedMail.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="text-[15px] text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                  {getSelectedMailBody() || 'Chargement du contenu...'}
                </div>

                {/* Reply section */}
                {activeReply === selectedMail.id ? (
                  <div className="mt-8 border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--text)] transition-colors shadow-sm bg-[var(--bg-surface)]">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Reply className="w-4 h-4" /> Répondre à <span className="font-medium text-[var(--text)]">{selectedMail.senderEmail}</span>
                    </div>
                    <textarea
                      autoFocus
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="w-full min-h-[150px] bg-transparent text-sm text-[var(--text)] p-4 resize-none focus:outline-none"
                    />
                    <div className="p-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface-2)]">
                      <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"><Paperclip className="w-4 h-4" /></button>
                      <div className="flex gap-2 items-center">
                        <button onClick={startAutomatedReply} className="px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> IA</button>
                        <button onClick={() => setActiveReply(null)} className="px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Ignorer</button>
                        <button onClick={sendReply} className="px-5 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                          <Send className="w-4 h-4" /> Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex gap-3 items-center">
                    <button
                      onClick={() => {
                        setActiveReply(selectedMail.id);
                        setDraftContent('');
                      }}
                      className="px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                    >
                      <Reply className="w-4 h-4" /> Répondre
                    </button>
                    <button
                      onClick={handleForward}
                      className="px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                    >
                      <Forward className="w-4 h-4" /> Transférer
                    </button>
                    <button
                      onClick={startAutomatedReply}
                      className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-full transition-colors opacity-50 hover:opacity-100 flex items-center gap-1"
                      title="Générer une réponse avec l'IA"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
