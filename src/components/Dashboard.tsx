import { AppState } from "../types";
import { Clock, CheckCircle2, ChevronRight, Activity, Mail, FileText, Globe, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";

export function Dashboard({ state, setActiveTab, updateState }: { state: AppState, setActiveTab: (t: string) => void, updateState: (s: Partial<AppState>) => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadMails = state.emails.filter(e => !e.read && e.folder === 'INBOX');
  const todayActions = state.activityLogs.slice(0, 5);
  
  // Sort upcoming events
  const todayEvents = [...state.calendar].sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 4);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] mb-1">Bonjour, {state.user.name}.</h1>
          <p className="text-[var(--text-muted)] text-sm">Prêt à débuter la journée ? Voici votre résumé.</p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-2xl md:text-3xl font-mono tracking-tighter text-[var(--text)]">{now.toLocaleTimeString('fr-FR')}</div>
          <div className="text-sm text-[var(--text-muted)] font-medium capitalize">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Emails à traiter", val: unreadMails.length, icon: Mail, c: "text-[var(--text)]", tab: "emails" },
          { label: "Réunions du jour", val: todayEvents.length, icon: CalendarIcon, c: "text-[var(--text)]", tab: "calendar" },
          { label: "Documents", val: state.files.length, icon: FileText, c: "text-[var(--text)]", tab: "files" },
          { label: "Veille Web", val: state.webHistory.length, icon: Globe, c: "text-[var(--text)]", tab: "web" }
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--text-muted)] transition-colors cursor-pointer group" onClick={() => setActiveTab(s.tab)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">{s.label}</span>
              <s.icon className={`w-4 h-4 text-[var(--text-muted)]`} />
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar / Schedule */}
        <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-[var(--text-muted)]"/> Emploi du temps</h3>
            <button onClick={() => setActiveTab('calendar')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Ouvrir</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {todayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Aucun événement prévu</p>
              </div>
            ) : todayEvents.map(ev => {
              const d = new Date(ev.start);
              return (
                <div key={ev.id} className="p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors flex items-start gap-4">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-sm font-bold text-[var(--text)]">{d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text)] truncate">{ev.title}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{ev.location || 'Personnel'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Inbox */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2"><Mail className="w-4 h-4 text-[var(--text-muted)]"/> Boîte de réception</h3>
            <button onClick={() => setActiveTab('emails')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1">Voir tout <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {unreadMails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Boîte de réception vide</p>
              </div>
            ) : unreadMails.slice(0, 5).map(m => (
              <div key={m.id} className="p-4 flex items-start gap-4 hover:bg-[var(--bg)] cursor-pointer transition-colors group" onClick={() => setActiveTab('emails')}>
                <div className="w-2 h-2 mt-2 rounded-full shrink-0 bg-[var(--accent)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-semibold truncate text-[var(--text)] group-hover:underline">{m.sender}</span>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2 font-medium">{new Date(m.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}</span>
                  </div>
                  <div className="text-sm font-medium truncate text-[var(--text)]">{m.subject}</div>
                  <div className="text-xs truncate text-[var(--text-muted)] mt-1">{m.body.substring(0, 80)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
