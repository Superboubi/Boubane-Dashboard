import { AppState } from "../types";
import { Activity as ActivityIcon, CheckCircle2, ChevronRight, XCircle, Info } from "lucide-react";

export function Activity({ state }: { state: AppState }) {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Journal d'activité</h1>
           <p className="text-sm text-[var(--text-muted)]">Historique complet des actions de l'agent et du système.</p>
         </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
         <div className="divide-y divide-[var(--border)]">
           {state.activityLogs.map((log) => (
             <div key={log.id} className="p-5 flex gap-4 hover:bg-[var(--bg-hover)] transition-colors">
               <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--bg-surface)] ${
                 log.status === 'success' ? 'bg-[#2d4234] text-[var(--success)]' : 
                 log.status === 'error' ? 'bg-[#422d2d] text-[var(--error)]' : 
                 'bg-[var(--accent-glow)] text-[var(--accent)]'
               }`}>
                 {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                  log.status === 'error' ? <XCircle className="w-4 h-4" /> : 
                  <Info className="w-4 h-4" />}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-sm font-medium text-[var(--text)]">{log.status === 'success' ? 'Succès' : log.status === 'error' ? 'Erreur' : 'Information'}</span>
                   <span className="text-xs text-[var(--text-muted)] font-mono">{new Date(log.date).toLocaleString('fr-FR')}</span>
                 </div>
                 <div className="text-sm text-[var(--text-muted)]">{log.text}</div>
               </div>
             </div>
           ))}
           {state.activityLogs.length === 0 && (
             <div className="p-8 text-center text-[var(--text-muted)]">Aucune activité récente.</div>
           )}
         </div>
      </div>
    </div>
  );
}
