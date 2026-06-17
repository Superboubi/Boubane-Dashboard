import { AppState } from "../types";
import { Globe, Search, ArrowRight, ExternalLink } from "lucide-react";

export function Web({ state, navigateToChat }: { state: AppState, navigateToChat: () => void }) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Recherche Web & Veille</h1>
           <p className="text-sm text-[var(--text-muted)]">L'agent indexe et résume les URL que vous lui confiez.</p>
         </div>
         <button onClick={() => navigateToChat()} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
           <Search className="w-4 h-4" /> Nouvelle requête
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.webHistory.map((item) => (
          <div key={item.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col hover:border-[var(--accent)] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-blue-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-[var(--text)]" title={item.url}>{item.url.replace('https://', '')}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(item.date).toLocaleString('fr-FR')}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--bg)] border border-[var(--border)] px-2 py-1 rounded text-[var(--text-muted)]">
                {item.type}
              </span>
            </div>
            <div className="flex-1 text-sm text-[var(--text-muted)] mb-4 leading-relaxed line-clamp-4">
              {item.result}
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
               <button onClick={() => navigateToChat()} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium">
                 Relancer l'analyse <ArrowRight className="w-3 h-3" />
               </button>
               <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text)]" title="Ouvrir le lien">
                 <ExternalLink className="w-4 h-4" />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
