import { AppState } from "../types";
import { Users, TrendingUp, AlertCircle, Building2 } from "lucide-react";

export function Clients({ state, navigateToChat }: { state: AppState, navigateToChat: () => void }) {
  const mrr = state.clients.filter(c => c.status === 'active').reduce((sum, c) => sum + c.mrr, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Base clients</h1>
           <p className="text-sm text-[var(--text-muted)]">Gérez vos abonnés et suivez vos revenus récurrents.</p>
         </div>
         <button onClick={() => navigateToChat()} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
           + Ajouter
         </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-[var(--accent-glow)] text-[var(--accent)]"><Users className="w-5 h-5"/></div>
             <div className="text-sm font-medium text-[var(--text-muted)]">Clients actifs</div>
           </div>
           <div className="text-2xl font-bold">{state.clients.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-[#2d4234] text-[var(--success)]"><TrendingUp className="w-5 h-5"/></div>
             <div className="text-sm font-medium text-[var(--text-muted)]">MRR (Mensuel)</div>
           </div>
           <div className="text-2xl font-bold">{mrr.toFixed(2)} €</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-[#422d2d] text-[var(--error)]"><AlertCircle className="w-5 h-5"/></div>
             <div className="text-sm font-medium text-[var(--text-muted)]">Taux de churn</div>
           </div>
           <div className="text-2xl font-bold">3.5%</div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
         <table className="w-full text-left text-sm whitespace-nowrap">
           <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
             <tr>
               <th className="px-6 py-4 font-medium">Client</th>
               <th className="px-6 py-4 font-medium">Entreprise</th>
               <th className="px-6 py-4 font-medium">Plan</th>
               <th className="px-6 py-4 font-medium">Statut</th>
               <th className="px-6 py-4 font-medium text-right">MRR</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[var(--border)]">
             {state.clients.map(c => (
               <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                 <td className="px-6 py-4">
                   <div className="font-medium text-[var(--text)]">{c.name}</div>
                   <div className="text-[10px] text-[var(--text-muted)]">{c.email}</div>
                 </td>
                 <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-[var(--text-muted)]">
                     <Building2 className="w-4 h-4" /> {c.company}
                   </div>
                 </td>
                 <td className="px-6 py-4">
                   <span className="capitalize">{c.plan}</span>
                 </td>
                 <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                     c.status === 'active' ? 'bg-[#2d4234] text-[var(--success)]' :
                     c.status === 'churned' ? 'bg-[#422d2d] text-[var(--error)]' :
                     'bg-[var(--accent-glow)] text-[var(--accent)]'
                   }`}>
                     {c.status}
                   </span>
                 </td>
                 <td className="px-6 py-4 text-right font-mono font-medium">
                   {c.mrr.toFixed(2)} €
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
