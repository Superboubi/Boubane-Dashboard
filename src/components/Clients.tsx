import { AppState } from "../types";
import { Users, TrendingUp, AlertCircle, Building2, Bot } from "lucide-react";

export function Clients({ state, navigateToChat }: { state: AppState, navigateToChat: () => void }) {
  const mrr = state.clients.filter(c => c.status === 'active').reduce((sum, c) => sum + c.mrr, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-stream-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Base clients</h1>
          <p className="text-sm text-[var(--text-muted)]">Gérez vos abonnés et suivez vos revenus récurrents.</p>
        </div>
        <button onClick={() => navigateToChat()} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer active:scale-95">
          + Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 organic-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]"><Users className="w-5 h-5" /></div>
            <div className="text-sm font-semibold text-[var(--text-muted)]">Clients actifs</div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)]">{state.clients.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="glass rounded-2xl p-5 organic-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[var(--hermes-emerald-glow)] text-[var(--hermes-emerald)]"><TrendingUp className="w-5 h-5" /></div>
            <div className="text-sm font-semibold text-[var(--text-muted)]">MRR (Mensuel)</div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)]">{mrr.toFixed(2)} €</div>
        </div>
        <div className="glass rounded-2xl p-5 organic-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[#422d2d]/50 text-[var(--error)]"><AlertCircle className="w-5 h-5" /></div>
            <div className="text-sm font-semibold text-[var(--text-muted)]">Taux de churn</div>
          </div>
          <div className="text-2xl font-bold text-[var(--text)]">3.5%</div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Entreprise</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Statut</th>
              <th className="px-6 py-4 font-semibold text-right">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {state.clients.map(c => (
              <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-all">
                <td className="px-6 py-4">
                  <div className="font-semibold text-[var(--text)]">{c.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{c.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Building2 className="w-4 h-4" /> {c.company}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="capitalize text-[var(--text)]">{c.plan}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    c.status === 'active' ? 'bg-[var(--hermes-emerald-glow)] text-[var(--hermes-emerald)] border border-[var(--hermes-emerald)]/30' :
                    c.status === 'churned' ? 'bg-[#422d2d]/50 text-[var(--error)] border border-[var(--error)]/30' :
                    'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--text)]">
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
