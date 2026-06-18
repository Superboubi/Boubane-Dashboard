import { useState, useEffect } from "react";
import { AppState, Email } from "../types";
import { 
  Archive, Trash2, Reply, CheckCircle2, Sparkles, Inbox, Send, FileText, Mail, 
  Bot, PenTool, ThumbsUp, ThumbsDown, Zap, Edit3, X, Forward, Clock, MoreVertical, 
  Paperclip, MailPlus, ChevronDown, Check, AlertCircle, RefreshCw, Sparkle, Loader2, HelpCircle,
  Search, MessageSquare, ArrowLeft
} from "lucide-react";

export function Emails({ state, updateState, navigateToChat }: { state: AppState, updateState: (s: Partial<AppState>) => void, navigateToChat: () => void }) {
  const [folder, setFolder] = useState<'INBOX'|'SENT'|'ARCHIVE'|'TRASH'|'DRAFT'>('INBOX');
  const [selectedMail, setSelectedMail] = useState<Email | null>(null);
  
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [selectedAttachments, setSelectedAttachments] = useState<{name: string, size: string}[]>([]);

  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>('');

  // IA specific states
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mailSummaries, setMailSummaries] = useState<Record<string, string>>({});
  
  const [classifying, setClassifying] = useState(false);
  const [mailAnalysis, setMailAnalysis] = useState<Record<string, { sentiment: string; urgency: string; recommendedAction: string }>>({});
  
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
  const [refining, setRefining] = useState(false);

  // Search, category filtering, and copilot states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'important' | 'finance' | 'business' | 'update'>('all');

  // Background auto-processing state tracker to prevent redundant api calls
  const [processedIds, setProcessedIds] = useState<Record<string, boolean>>({});

  // Background processing of standard incoming/unclassified emails
  useEffect(() => {
    const unprocessed = state.emails.filter(e => !e.sentiment && !processedIds[e.id]);
    if (unprocessed.length === 0) return;

    unprocessed.forEach(async (mail) => {
      // Mark as processed immediately locally
      setProcessedIds(prev => ({ ...prev, [mail.id]: true }));

      try {
        const res = await fetch("/api/mail/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "auto-process",
            emailSubject: mail.subject,
            emailBody: mail.body,
            emailSender: mail.sender
          })
        });
        const data = await res.json();
        if (data.success) {
          updateState({
            emails: state.emails.map(e => e.id === mail.id ? {
              ...e,
              category: (data.category && data.category !== "none") ? data.category : e.category,
              sentiment: data.sentiment || "neutre",
              urgency: data.urgency || "moyenne",
              aiRecommendation: data.recommendedAction,
              aiSummary: data.aiSummary,
              aiDraft: data.aiDraft
            } : e)
          });
        }
      } catch (err) {
        console.error("Erreur tri / draft automatique pour l'email " + mail.id, err);
      }
    });
  }, [state.emails, processedIds, updateState]);

  // Synchronize auto draft if it loads or changes after selection
  useEffect(() => {
    if (selectedMail && selectedMail.aiDraft && !draftContent) {
      setDraftContent(selectedMail.aiDraft);
    }
  }, [selectedMail?.aiDraft, draftContent]);

  const emails = state.emails.filter(e => e.folder === folder).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredEmails = emails.filter(e => {
    const matchesSearch = 
      e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (m: Email) => {
    setSelectedMail(m);
    setIsComposing(false);
    setActiveReply(m.id);
    setAiInstructions('');
    
    if (m.aiDraft) {
      setDraftContent(m.aiDraft);
    } else {
      setDraftContent('');
      generateAiReply(m, 'professional');
    }
    
    if (!m.read) {
      updateState({
        emails: state.emails.map(e => e.id === m.id ? { ...e, read: true } : e)
      });
    }
  };

  const moveMail = (id: string, toFolder: 'INBOX'|'SENT'|'ARCHIVE'|'TRASH'|'DRAFT') => {
    updateState({
      emails: state.emails.map(e => e.id === id ? { ...e, folder: toFolder } : e)
    });
    if (selectedMail?.id === id && toFolder !== 'INBOX') {
       setSelectedMail(null);
       setActiveReply(null);
    }
  };

  const markUnread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateState({
      emails: state.emails.map(mail => mail.id === id ? { ...mail, read: false } : mail)
    });
    if (selectedMail?.id === id) {
       setSelectedMail(null);
    }
  };

  const handleCompose = () => {
    setSelectedMail(null);
    setActiveReply(null);
    setComposeData({ to: '', subject: '', body: '' });
    setSelectedAttachments([]);
    setAiInstructions('');
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
    updateState({ emails: [newMail, ...state.emails] });
    setIsComposing(false);
    setSelectedAttachments([]);
    setFolder('SENT');
  };

  // AI Functionality: SUMMARIZE
  const summarizeEmail = async (mail: Email) => {
    if (mailSummaries[mail.id]) return;
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize",
          emailSubject: mail.subject,
          emailBody: mail.body,
          emailSender: mail.sender
        })
      });
      const data = await res.json();
      if (data.success) {
        setMailSummaries(prev => ({ ...prev, [mail.id]: data.summary }));
      }
    } catch (err) {
      console.error("Erreur de résumé IA", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // AI Functionality: CLASSIFY
  const classifyEmail = async (mail: Email) => {
    setClassifying(true);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "classify",
          emailSubject: mail.subject,
          emailBody: mail.body
        })
      });
      const data = await res.json();
      if (data.success) {
        setMailAnalysis(prev => ({
          ...prev,
          [mail.id]: {
            sentiment: data.sentiment || "neutre",
            urgency: data.urgency || "moyenne",
            recommendedAction: data.recommendedAction || "Rédiger une réponse adéquate."
          }
        }));
        
        // Update the main state category
        if (data.category && data.category !== "none") {
          updateState({
            emails: state.emails.map(e => e.id === mail.id ? { ...e, category: data.category } : e)
          });
        }
      }
    } catch (err) {
      console.error("Erreur de qualification IA", err);
    } finally {
      setClassifying(false);
    }
  };

  // AI Functionality: REPLY GENERATOR
  const generateAiReply = async (mail: Email, mood: 'positive' | 'negative' | 'professional' | 'more_details') => {
    setAiDraftLoading(true);
    setActiveReply(mail.id);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          emailSubject: mail.subject,
          emailBody: mail.body,
          emailSender: mail.sender,
          mood,
          userInstructions: aiInstructions
        })
      });
      const data = await res.json();
      if (data.success) {
        setDraftContent(data.reply);
      }
    } catch (err) {
      console.error("Erreur génération de réponse IA", err);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const startAutomatedReply = () => {
    if (!selectedMail) return;
    generateAiReply(selectedMail, 'professional');
  };

  // AI Functionality: REWRITE DRAFT OR COMPOSE
  const refineDraftText = async (isComposeView: boolean) => {
    const textToRefine = isComposeView ? composeData.body : draftContent;
    if (!textToRefine) return;
    setRefining(true);
    try {
      const res = await fetch("/api/mail/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite",
          emailSubject: isComposeView ? composeData.subject : (selectedMail?.subject || ""),
          emailBody: isComposeView ? "" : (selectedMail?.body || ""),
          draftContent: textToRefine,
          userInstructions: aiInstructions || "Rendre le texte plus professionnel, impeccable, fluide et exempt de fautes d'orthographe."
        })
      });
      const data = await res.json();
      if (data.success) {
        if (isComposeView) {
          setComposeData(prev => ({ ...prev, body: data.reply }));
        } else {
          setDraftContent(data.reply);
        }
      }
    } catch (err) {
      console.error("Erreur de réécriture IA", err);
    } finally {
      setRefining(false);
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
    updateState({ emails: [newReply, ...state.emails] });
    setActiveReply(null);
    setDraftContent('');
    setAiInstructions('');
    moveMail(selectedMail.id, 'ARCHIVE');
  };

  const handleForward = () => {
    if (!selectedMail) return;
    setComposeData({ 
      to: '', 
      subject: 'Fwd: ' + selectedMail.subject, 
      body: '\n\n---------- Message transféré ----------\nDe: ' + selectedMail.sender + ' <' + selectedMail.senderEmail + '>\nDate: ' + new Date(selectedMail.date).toLocaleString('fr-FR') + '\nObjet: ' + selectedMail.subject + '\nÀ: Moi\n\n' + selectedMail.body 
    });
    setSelectedMail(null);
    setActiveReply(null);
    setIsComposing(true);
  };

  // Category labels helper French
  const getCategoryBadge = (cat: string) => {
    switch(cat) {
      case 'important': return <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-[var(--bg-surface-2)] text-[var(--text)] border border-[var(--border)] font-mono tracking-wider">Urgent</span>;
      case 'finance': return <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] font-mono tracking-wider">Finance</span>;
      case 'business': return <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] font-mono tracking-wider">Projet</span>;
      case 'update': return <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] font-mono tracking-wider">Notification</span>;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[var(--bg)] animate-in fade-in duration-300 relative font-sans">
      
      {/* List - Fully responsive */}
      <div className={`w-full md:w-80 lg:w-[400px] border-r border-[var(--border)] shrink-0 flex flex-col ${(selectedMail || isComposing) ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col bg-[var(--bg-surface)] shrink-0 border-b border-[var(--border)] z-10 pt-3 px-4 pb-0 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h2 className="font-bold text-[var(--text)] capitalize text-xl tracking-tight leading-none">
                {folder === 'INBOX' ? 'Boîte' : folder === 'SENT' ? 'Envoyés' : folder === 'DRAFT' ? 'Brouillons' : folder === 'ARCHIVE' ? 'Archives' : 'Corbeille'}
              </h2>
              <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1 font-mono">
                {filteredEmails.length} mails trouvés
              </span>
            </div>
            <button 
              onClick={handleCompose}
              className="hidden md:flex bg-[var(--text)] text-[var(--bg)] hover:opacity-90 px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher expéditeur, objet..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-8 pr-8 py-2 text-xs font-medium text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-semibold font-mono">✕</button>
            )}
          </div>

          {/* Categories (Urgences) - Centered */}
          <div className="flex gap-1.5 flex-wrap justify-center select-none pt-0.5">
            {[
              { id: 'all', label: 'Tous', color: 'border-transparent bg-[var(--bg-surface-2)]' },
              { id: 'important', label: 'Urgences', color: 'border-transparent bg-[var(--bg-surface-2)]' },
              { id: 'finance', label: 'Finance', color: 'border-transparent bg-[var(--bg-surface-2)]' },
              { id: 'business', label: 'Projet', color: 'border-transparent bg-[var(--bg-surface-2)]' },
              { id: 'update', label: 'Notifs', color: 'border-transparent bg-[var(--bg-surface-2)]' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1 text-[10px] font-bold border rounded-full shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)] shadow-sm' 
                    : `text-[var(--text-muted)] hover:text-[var(--text)] ${cat.color} hover:bg-[var(--bg-hover)]`
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-x-2 gap-y-1.5 select-none shrink-0 justify-center items-center pb-2 px-1 w-full">
            {[
              { id: 'INBOX', label: 'Boîte', icon: Inbox, count: state.emails.filter(e => e.folder === 'INBOX' && !e.read).length },
              { id: 'SENT', label: 'Envoyés', icon: Send },
              { id: 'DRAFT', label: 'Brouillons', icon: Edit3, count: state.emails.filter(e => e.folder === 'DRAFT').length },
              { id: 'ARCHIVE', label: 'Archives', icon: Archive },
              { id: 'TRASH', label: 'Corbeille', icon: Trash2 },
            ].map(f => {
              const Icon = f.icon;
              const isSelected = folder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { setFolder(f.id as any); setSelectedMail(null); setIsComposing(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer focus:outline-none ${
                    isSelected 
                      ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  {f.count !== undefined && f.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-0.5 ${isSelected ? 'bg-[var(--bg)] text-[var(--text)] font-bold' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] font-medium'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide w-full divide-y divide-[var(--border)] relative bg-[var(--bg)]">
          {filteredEmails.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)]">
              <Inbox className="w-10 h-10 text-[var(--border)] mb-4" />
              <div className="text-sm text-[var(--text-muted)] font-medium">Aucun email ne correspond.</div>
            </div>
          ) : filteredEmails.map(m => (
            <div 
              key={m.id} 
              onClick={() => handleSelect(m)}
              className={`p-4 cursor-pointer transition-colors relative group ${(selectedMail?.id === m.id && !isComposing) ? 'bg-[var(--bg-elevated)] border-l-2 border-l-[var(--accent)] -ml-[1px]' : 'hover:bg-[var(--bg-hover)]'} ${!m.read && selectedMail?.id !== m.id && !isComposing ? 'bg-[var(--accent)]/5' : ''}`}
            >
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {!m.read && <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0"></div>}
                  <span className={`text-sm truncate ${!m.read ? 'font-bold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.sender}</span>
                </div>
                <span className={`text-[10px] shrink-0 ${!m.read ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>{new Date(m.date).toLocaleDateString()}</span>
              </div>
              <div className={`text-sm mb-1 truncate ${!m.read ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'}`}>{m.subject}</div>
              <div className="text-xs text-[var(--text-muted)] truncate mb-2">{m.body.substring(0, 50)}...</div>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {getCategoryBadge(m.category)}
                {(mailAnalysis[m.id]?.sentiment || m.sentiment) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] capitalize">
                    {(mailAnalysis[m.id]?.sentiment || m.sentiment)}
                  </span>
                )}
                {m.aiDraft && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--bg-surface-2)] text-[var(--text)] border border-[var(--border)] flex items-center gap-0.5 font-semibold">
                    Brouillon
                  </span>
                )}
              </div>

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
      <div className={`flex-1 flex flex-col min-w-0 ${(!selectedMail && !isComposing) ? 'hidden md:flex bg-[var(--bg-surface)] items-center justify-center' : 'flex bg-[var(--bg)]'}`}>
        
        {isComposing ? (
          <div className="flex-1 flex flex-col h-full bg-[var(--bg)] animate-in slide-in-from-bottom-4 duration-300 md:animate-in md:fade-in">
             <div className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center justify-between bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-10">
               <h2 className="text-sm font-semibold flex items-center gap-2"><PenTool className="w-4 h-4 text-[var(--accent)]" /> Nouveau message</h2>
               <button onClick={() => setIsComposing(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-md hover:bg-[var(--bg-surface)] transition-all cursor-pointer"><X className="w-4 h-4"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 lg:p-8 space-y-5 max-w-3xl w-full mx-auto relative group">
               
               {/* Assistance d'écriture */}
               <div className="bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-xl p-4 md:p-5 space-y-4 relative overflow-hidden shadow-sm transition-all focus-within:shadow-md focus-within:border-[var(--text-muted)]">
                 {/* Subtle AI active background glow */}
                 <div className="absolute -top-16 -right-16 w-32 h-32 bg-[var(--text)] opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                 
                 <div className="flex items-start justify-between relative">
                   <div>
                     <h4 className="text-sm md:text-base font-bold text-[var(--text)] flex items-center gap-2 tracking-tight">
                       <Sparkles className="w-4 h-4 text-[var(--text)]" /> Assistant IA
                     </h4>
                     <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                       Rédigez quelques mots clés, on s'occupe du reste.
                     </p>
                   </div>
                   <span className="hidden sm:inline-flex px-2 py-1 bg-[var(--border)] text-[var(--text)] text-[10px] uppercase font-bold rounded-full font-mono">
                     Draft Magic
                   </span>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3 relative">
                   <input 
                     type="text" 
                     value={aiInstructions}
                     onChange={(e) => setAiInstructions(e.target.value)}
                     placeholder="Ex: 'Confirme le rdv de demain 10h', 'Traduis en anglais'..."
                     className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs md:text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--border)] shadow-sm transition-all border-dashed focus:border-solid"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') refineDraftText(true);
                     }}
                   />
                   <button 
                     disabled={refining}
                     onClick={() => refineDraftText(true)}
                     className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] disabled:opacity-40 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:-translate-y-0.5 active:scale-95"
                   >
                     {refining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
                     Générer
                   </button>
                 </div>
               </div>

               <div className="space-y-4 pt-2">
                 <div className="relative group/field border-b border-[var(--border)] focus-within:border-[var(--text)] transition-colors">
                   <input autoFocus type="email" value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})} className="w-full bg-transparent py-2 pl-8 pr-4 text-sm focus:outline-none text-[var(--text)] font-sans peer placeholder-transparent" placeholder="À" id="compose-to" />
                   <label htmlFor="compose-to" className="absolute left-0 top-2 text-[var(--text-muted)] text-sm font-semibold peer-focus:text-[var(--text)] transition-colors">À</label>
                 </div>
                 
                 <div className="relative group/field border-b border-[var(--border)] focus-within:border-[var(--text)] transition-colors">
                   <input type="text" value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})} className="w-full bg-transparent py-2 pl-[4.5rem] pr-4 text-sm focus:outline-none font-semibold text-[var(--text)] font-sans peer placeholder-transparent" placeholder="Objet" id="compose-subject" />
                   <label htmlFor="compose-subject" className="absolute left-0 top-2 text-[var(--text-muted)] text-sm font-semibold peer-focus:text-[var(--text)] transition-colors">Objet</label>
                 </div>
               </div>

               <div className="flex-1 flex flex-col min-h-[250px] relative group/textarea py-2">
                 <textarea 
                   value={composeData.body} 
                   onChange={e => setComposeData({...composeData, body: e.target.value})} 
                   className="flex-1 w-full bg-transparent text-sm resize-none focus:outline-none text-[var(--text)] leading-relaxed z-10 relative" 
                   placeholder="Écrivez votre message..." 
                 />
                 {!composeData.body && !refining && aiInstructions && (
                   <div className="absolute top-2 left-0 pointer-events-none text-[var(--text-muted)] z-0 opacity-40 font-mono text-sm">
                     ↵ Tab pour générer
                   </div>
                 )}
               </div>
               
               {/* Attachments Section */}
               {selectedAttachments.length > 0 && (
                 <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)] border-dashed">
                   {selectedAttachments.map((file, idx) => (
                     <div key={idx} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-xs animate-in zoom-in slide-in-from-left-2 duration-300">
                       <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                       <span className="font-medium text-[var(--text)] truncate max-w-[120px]">{file.name}</span>
                       <span className="text-[var(--text-muted)]">{file.size}</span>
                       <button onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded-full hover:bg-[var(--bg)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}

             </div>
             
             {/* Bottom toolbar */}
             <div className="p-3 md:p-4 flex items-center justify-between border-t border-[var(--border)] shrink-0 bg-[var(--bg-surface)] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
               <div className="flex items-center gap-1">
                 <button 
                  onClick={() => {
                    const mockFiles = [{name: 'document.pdf', size: '2.4 MB'}, {name: 'image.jpg', size: '1.1 MB'}];
                    setSelectedAttachments(prev => [...prev, mockFiles[Math.floor(Math.random() * 2)]]);
                  }}
                  className="p-2.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded-full transition-all cursor-pointer group/btn" 
                  title="Joindre depuis le Vault"
                 >
                   <Paperclip className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                 </button>
               </div>
               <div className="flex gap-3">
                 <button onClick={sendCompose} disabled={!composeData.to} className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] disabled:opacity-30 disabled:hover:translate-y-0 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shadow-md">
                   Envoyer <Send className="w-3.5 h-3.5" />
                 </button>
               </div>
             </div>
          </div>
        ) : !selectedMail ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-[var(--bg-surface)] max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] flex items-center justify-center animate-pulse">
              <Bot className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[var(--text)]">Messagerie Assistée par l'Intelligence Artificielle</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto font-sans">
                Chaque courriel entrant est automatiquement trié, catégorisé et pré-brouilloné par notre moteur d'analyse **Boubane-AI** basé sur l'importance et le ton de vos échanges.
              </p>
            </div>
            
            <div className="w-full flex justify-center pt-2">
              <button 
                onClick={() => { setSelectedCategory('important'); }}
                className="p-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:border-[var(--text-muted)] text-left transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-3 group w-full max-w-sm shrink-0"
              >
                <div className="p-2 rounded-lg bg-[var(--bg-surface-2)] text-[var(--text)] border border-[var(--border)] group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-[var(--text)] font-mono uppercase">Voir les urgences</h4>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-sans">Mails classés à haute priorité</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full animate-in fade-in bg-[var(--bg)]">
            {/* Header controls */}
            <div className="px-4 md:px-6 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)] min-h-[64px]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedMail(null)} className="md:hidden p-2 -ml-2 text-[var(--text)] rounded-md hover:bg-[var(--bg)] flex items-center gap-1" title="Retour">
                  <ArrowLeft className="w-5 h-5" /> <span className="text-sm font-medium">Retour</span>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => moveMail(selectedMail.id, 'ARCHIVE')} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors cursor-pointer" title="Archiver"><Archive className="w-4 h-4" /></button>
                  <button onClick={(e) => markUnread(e, selectedMail.id)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors cursor-pointer" title="Marquer non lu"><MailPlus className="w-4 h-4" /></button>
                  <button onClick={() => moveMail(selectedMail.id, 'TRASH')} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--error)] rounded transition-colors cursor-pointer" title="Supprimer (Corbeille)"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={handleForward} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors cursor-pointer" title="Transférer"><Forward className="w-4 h-4" /></button>
                <button className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] rounded transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
              <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
                
                {/* Meta details & Analysis dashboard */}
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(selectedMail.category)}
                  
                  {(mailAnalysis[selectedMail.id] || selectedMail.sentiment) ? (
                    <>
                      <span className="px-2 py-0.5 rounded-full text-xs font-sans font-medium flex items-center gap-1 bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] capitalize">
                        Ton : {mailAnalysis[selectedMail.id]?.sentiment || selectedMail.sentiment}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-sans font-medium flex items-center gap-1 bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)] capitalize">
                        Priorité : {mailAnalysis[selectedMail.id]?.urgency || selectedMail.urgency}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic font-sans flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-[var(--text-muted)] animate-spin" /> Tri en cours...
                    </span>
                  )}
                </div>

                {/* Header */}
                <div className="space-y-4">
                  <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] leading-tight">{selectedMail.subject}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
                        {selectedMail.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-x-2 w-full">
                          <span className="font-semibold text-[var(--text)] text-sm md:text-base break-words">{selectedMail.sender}</span>
                          <span className="text-xs text-[var(--text-muted)] break-all">&lt;{selectedMail.senderEmail}&gt;</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          À moi <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] md:text-xs text-[var(--text-muted)] flex items-center gap-1 sm:self-start shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(selectedMail.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Action recommandée */}
                {(mailAnalysis[selectedMail.id]?.recommendedAction || selectedMail.aiRecommendation) && (
                  <div className="bg-[var(--bg-surface-2)] border border-[var(--accent)]/30 rounded-xl p-4 flex gap-3 items-start animate-in slide-in-from-top-2 duration-300 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-[var(--accent)] opacity-10 rounded-full blur-xl pointer-events-none"></div>
                    <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5 relative z-10" />
                    <div className="space-y-1 relative z-10">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono flex items-center gap-2">
                        Conseil IA
                      </p>
                      <p className="text-sm text-[var(--text)] font-sans font-medium">{mailAnalysis[selectedMail.id]?.recommendedAction || selectedMail.aiRecommendation}</p>
                    </div>
                  </div>
                )}

                {/* Body Content */}
                <div className="text-[15px] md:text-base text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed border-t border-[var(--border)] pt-5 pb-8 md:pt-6 font-sans">
                  {selectedMail.body}
                </div>

                {/* Active Reply interface (Loaded natively, without unasked button blocks) */}
                {activeReply === selectedMail.id ? (
                  <div className="mt-8 border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--text)] transition-colors shadow-sm bg-[var(--bg-surface)] animate-in slide-in-from-bottom-3 duration-300">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-[var(--text-muted)] font-mono">
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-[var(--text-muted)]" /> Répondre à <span className="font-semibold text-[var(--text)] break-all">{selectedMail.senderEmail}</span>
                      </div>
                      {aiDraftLoading ? (
                        <span className="text-[10px] text-[var(--text-muted)] animate-pulse font-mono">Rédaction automatique en cours...</span>
                      ) : (
                        draftContent && (
                          <span className="text-[10px] text-[var(--text-muted)]">Proposition pré-chargée</span>
                        )
                      )}
                    </div>

                    {/* Speech tuning settings bar */}
                    <div className="p-3 md:p-4 bg-[var(--bg)] border-b border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                          Tonalité de la réponse :
                        </span>
                      </div>

                      {/* Tone selection chips */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          disabled={aiDraftLoading} 
                          onClick={() => generateAiReply(selectedMail, 'professional')}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Professionnel
                        </button>
                        <button 
                          disabled={aiDraftLoading} 
                          onClick={() => generateAiReply(selectedMail, 'positive')}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Accepter
                        </button>
                        <button 
                          disabled={aiDraftLoading} 
                          onClick={() => generateAiReply(selectedMail, 'more_details')}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Demander des précisions
                        </button>
                        <button 
                          disabled={aiDraftLoading} 
                          onClick={() => generateAiReply(selectedMail, 'negative')}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] disabled:opacity-40 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Décliner
                        </button>
                      </div>

                      {/* Prompt adjustment bar */}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={aiInstructions}
                          onChange={(e) => setAiInstructions(e.target.value)}
                          placeholder="Ajuster la proposition (ex: 'Reste très bref', 'Propose mardi')"
                          className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors"
                        />
                        <button 
                          onClick={() => refineDraftText(false)}
                          disabled={refining || !draftContent}
                          className="px-3.5 py-1.5 bg-[var(--text)] text-[var(--bg)] disabled:opacity-40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {refining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Ajuster
                        </button>
                      </div>
                    </div>

                    <textarea 
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder={aiDraftLoading ? "Génération de la proposition automatique en cours..." : "Modifiez la réponse ici ou tapez librement..."}
                      className="w-full min-h-[180px] bg-transparent text-sm text-[var(--text)] p-4 resize-none focus:outline-none leading-relaxed font-sans"
                    />

                    {selectedAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-[var(--border)] border-dashed bg-transparent">
                        {selectedAttachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-xs animate-in zoom-in slide-in-from-left-2 duration-300 shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="font-medium text-[var(--text)] truncate max-w-[120px]">{file.name}</span>
                            <span className="text-[var(--text-muted)]">{file.size}</span>
                            <button onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded-full hover:bg-[var(--bg)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="p-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface-2)]">
                      <div className="flex items-center gap-2">
                        <button 
                         onClick={() => {
                           const mockFiles = [{name: 'document.pdf', size: '2.4 MB'}, {name: 'image.jpg', size: '1.1 MB'}];
                           setSelectedAttachments(prev => [...prev, mockFiles[Math.floor(Math.random() * 2)]]);
                         }}
                         className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-full transition-all cursor-pointer group/btn" 
                         title="Joindre depuis le Vault"
                        >
                          <Paperclip className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        {draftContent && (
                          <button 
                            onClick={() => setDraftContent('')} 
                            className="text-xs text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)] px-3 py-1.5 rounded-md transition-all cursor-pointer font-sans"
                          >
                            Effacer la réponse
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <button 
                          onClick={() => { setActiveReply(null); setDraftContent(''); setAiInstructions(''); setSelectedMail(null); }} 
                          className="px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                        >
                          Fermer
                        </button>
                        <button onClick={sendReply} className="px-5 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow">
                          <Send className="w-4 h-4" /> Envoyer & Archiver
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t border-[var(--border)] border-dashed animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mr-1 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> Actions Rapides
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {[
                        { id: 'positive', label: 'Accepter / Valider', icon: Check },
                        { id: 'more_details', label: 'Plus de détails ?', icon: HelpCircle },
                        { id: 'negative', label: 'Décliner', icon: X },
                        { id: 'professional', label: 'Réponse courte', icon: MessageSquare }
                      ].map(chip => (
                        <button
                          key={chip.id}
                          onClick={() => {
                            setActiveReply(selectedMail.id);
                            generateAiReply(selectedMail, chip.id as 'professional'|'positive'|'negative'|'more_details');
                          }}
                          className="px-3.5 py-2 bg-[var(--bg-surface-2)] hover:bg-[var(--text)] hover:text-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:scale-95"
                        >
                          <chip.icon className="w-3.5 h-3.5 opacity-70" />
                          {chip.label}
                        </button>
                      ))}
                      
                      <div className="w-[1px] h-6 bg-[var(--border)] mx-1"></div>
                      
                      <button 
                        onClick={() => {
                          setActiveReply(selectedMail.id);
                          if (selectedMail.aiDraft) {
                            setDraftContent(selectedMail.aiDraft);
                          } else if (!draftContent) {
                            setDraftContent('');
                          }
                        }}
                        className="px-3 py-2 text-[var(--text)] hover:bg-[var(--bg-surface-2)] rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" /> Répondre
                      </button>
                      <button 
                        onClick={handleForward}
                        className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface-2)] rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Forward className="w-3.5 h-3.5" /> Transférer
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) for composing */}
      {!selectedMail && !isComposing && (
        <button 
          onClick={handleCompose}
          className="md:hidden fixed right-6 bottom-6 w-14 h-14 bg-[var(--text)] text-[var(--bg)] rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:opacity-90 transition-all z-20 cursor-pointer border border-[var(--border)]"
          title="Nouveau message"
        >
          <PenTool className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
