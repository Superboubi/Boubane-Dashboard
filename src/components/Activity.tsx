import { AppState } from "../types";
import { Activity as ActivityIcon, CheckCircle2, XCircle, Info, Bot, Sparkles } from "lucide-react";

export function Activity({ state }: { state: AppState }) {
  const allLogs = [
    ...state.liveLogs.map((l, i) => ({
      id: 'live-' + i,
      date: l.date,
      text: l.text,
      status: l.status as 'success' | 'error' | 'info',
    })),
    ...state.activityLogs,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-stream-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Journal d'activité</h1>
          <p className="text-sm text-[var(--text-muted)]">Flux vivant des actions d'Hermes et du système.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
          <div className={`w-2 h-2 rounded-full ${state.daemonConnected ? 'bg-[var(--hermes-emerald)] animate-pulse' : 'bg-[var(--error)]'}`} />
          {state.daemonConnected ? 'Connecté' : 'Déconnecté'}
        </div>
      </div>

      <div className="space-y-2">
        {allLogs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <ActivityIcon className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">Aucune activité pour le moment.</p>
          </div>
        ) : (
          allLogs.map((log) => (
            <div
              key={log.id}
              className="glass rounded-2xl p-4 flex gap-4 hover:bg-[var(--bg-hover)] transition-all organic-card"
            >
              <div
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] ${
                  log.status === 'success'
                    ? 'bg-[var(--hermes-emerald-glow)] text-[var(--hermes-emerald)]'
                    : log.status === 'error'
                    ? 'bg-[#422d2d]/50 text-[var(--error)]'
                    : 'bg-[var(--accent-glow)] text-[var(--accent)]'
                }`}
              >
                {log.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : log.status === 'error' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      log.status === 'success'
                        ? 'text-[var(--hermes-emerald)]'
                        : log.status === 'error'
                        ? 'text-[var(--error)]'
                        : 'text-[var(--accent)]'
                    }`}
                  >
                    {log.status === 'success' ? 'Succès' : log.status === 'error' ? 'Erreur' : 'Information'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {new Date(log.date).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-[var(--text)] leading-relaxed">{log.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
