import { AppState } from "../types";
import { Clock, CheckCircle2, ChevronRight, Activity, Mail, FileText, Globe, Calendar as CalendarIcon, Bot, Sparkles, Zap } from "lucide-react";
import { useState, useEffect } from "react";

function HermesEnergyGauge({ state }: { state: AppState }) {
  const totalEmails = state.emails.filter(e => e.folder === 'INBOX').length;
  const processed = state.emails.filter(e => e.aiSummary || e.aiDraft).length;
  const ratio = totalEmails > 0 ? (processed / totalEmails) * 100 : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (ratio / 100) * circumference;

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 overflow-hidden relative group organic-card">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-glow)] rounded-full blur-3xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative shrink-0">
        <svg width="80" height="80" className="transform -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Bot className={`w-5 h-5 ${state.hermesStatus === 'thinking' ? 'text-[var(--hermes-amber)] animate-pulse' : 'text-[var(--accent)]'}`} />
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-sm font-bold text-[var(--text)]">Énergie Hermes</div>
        <div className="text-2xl font-bold text-[var(--accent)]">{Math.round(ratio)}%</div>
        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{processed}/{totalEmails} emails traités</div>
      </div>
    </div>
  );
}

function SplineChart() {
  const data = [30, 55, 42, 78, 63, 92, 70];
  const max = Math.max(...data);
  const width = 280;
  const height = 80;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (v / max) * (height - 8) - 4,
  }));

  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx1 = (prev.x + p.x) / 2;
      const cy1 = prev.y;
      const cx2 = (prev.x + p.x) / 2;
      const cy2 = p.y;
      return `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    })
    .join(' ');

  const areaD = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="splineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#splineFill)" className="transition-all duration-500" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="var(--bg)"
          stroke="var(--accent)"
          strokeWidth="2"
          className="transition-all duration-500 hover:r-4 cursor-pointer"
        />
      ))}
    </svg>
  );
}

export function Dashboard({ state, setActiveTab, updateState }: { state: AppState, setActiveTab: (t: string) => void, updateState: (s: Partial<AppState>) => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadMails = state.emails.filter(e => !e.read && e.folder === 'INBOX');
  const todayEvents = [...state.calendar].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 4);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-stream-in">
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
          { label: "Emails à traiter", val: unreadMails.length, icon: Mail, tab: "emails" },
          { label: "Réunions du jour", val: todayEvents.length, icon: CalendarIcon, tab: "calendar" },
          { label: "Documents", val: state.files.length, icon: FileText, tab: "files" },
          { label: "Veille Web", val: state.webHistory.length, icon: Globe, tab: "web" },
        ].map((s, i) => (
          <div
            key={i}
            onClick={() => setActiveTab(s.tab)}
            className="glass rounded-2xl p-5 cursor-pointer group organic-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors uppercase tracking-wider">{s.label}</span>
              <s.icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </div>
            <div className="text-3xl font-bold text-[var(--text)]">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HermesEnergyGauge state={state} />
        <div className="glass rounded-2xl p-5 organic-card md:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Flux emails 7 jours</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Lissé</span>
          </div>
          <SplineChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass rounded-2xl flex flex-col h-[400px] overflow-hidden organic-card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--text-muted)]" /> Emploi du temps
            </h3>
            <button onClick={() => setActiveTab('calendar')} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors font-semibold uppercase tracking-wider">
              Ouvrir
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
            {todayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Aucun événement prévu</p>
              </div>
            ) : (
              todayEvents.map((ev) => {
                const d = new Date(ev.start);
                return (
                  <div key={ev.id} className="p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-all flex items-start gap-4 cursor-pointer group/ev">
                    <div className="w-14 shrink-0 text-center">
                      <div className="text-sm font-bold text-[var(--accent)] font-mono">{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--text)] truncate group-hover/ev:text-[var(--accent)] transition-colors">{ev.title}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">{ev.location || 'Personnel'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl flex flex-col h-[400px] overflow-hidden organic-card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--text-muted)]" /> Boîte de réception
            </h3>
            <button onClick={() => setActiveTab('emails')} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors font-semibold uppercase tracking-wider flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] scrollbar-hide">
            {unreadMails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Boîte de réception vide</p>
              </div>
            ) : (
              unreadMails.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  onClick={() => setActiveTab('emails')}
                  className="p-4 flex items-start gap-4 hover:bg-[var(--bg-hover)] cursor-pointer transition-all group/mail"
                >
                  <div className="w-2 h-2 mt-2 rounded-full shrink-0 bg-[var(--accent)] animate-aura-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold truncate text-[var(--text)] group/mail:hover:text-[var(--accent)] transition-colors">{m.sender}</span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2 font-medium font-mono">
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-sm font-medium truncate text-[var(--text)]">{m.subject}</div>
                    <div className="text-xs truncate text-[var(--text-muted)] mt-0.5">{m.body.substring(0, 80)}...</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
