import { AppState } from "../types";
import { TrendingUp, Users, DollarSign, Activity, Bot } from "lucide-react";

function SplineChart() {
  const data = [40, 65, 52, 88, 73, 95, 80];
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
      return `C ${(prev.x + p.x) / 2} ${prev.y}, ${(prev.x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');

  const areaD = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="splineFillBiz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#splineFillBiz)" className="transition-all duration-500" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" className="transition-all duration-500" />
      ))}
    </svg>
  );
}

export function Business({ state }: { state: AppState }) {
  const mrrTotal = state.clients.filter(c => c.status === 'active').reduce((sum, c) => sum + c.mrr, 0);
  const stats = [
    { label: "Revenu du mois", value: `${mrrTotal.toFixed(0)} €`, change: "+12.5%", icon: DollarSign, positive: true },
    { label: "Clients actifs", value: `${state.clients.filter(c => c.status === 'active').length}`, change: "+4", icon: Users, positive: true },
    { label: "Taux de conversion", value: "4.8%", change: "-0.2%", icon: Activity, positive: false },
    { label: "Énergie Hermes", value: `${state.emails.filter(e => e.aiDraft).length}`, change: "mails traités", icon: Bot, positive: true },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-stream-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Vue d'ensemble</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Métriques principales de votre activité.</p>
        </div>
        <select className="glass border border-[var(--border)] text-[var(--text)] rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-all">
          <option>Ce mois-ci</option>
          <option>Le mois dernier</option>
          <option>Cette année</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 organic-card">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
              <div className="p-2 glass rounded-xl text-[var(--accent)]">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text)]">{stat.value}</div>
            <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${stat.positive ? 'text-[var(--hermes-emerald)]' : 'text-[var(--error)]'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 flex flex-col organic-card">
          <h3 className="font-bold text-[var(--text)] mb-4 shrink-0 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" /> Chiffre d'Affaires
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            <SplineChart />
            <div className="flex justify-between mt-3 text-[10px] text-[var(--text-muted)] font-mono">
              <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 flex flex-col organic-card">
          <h3 className="font-bold text-[var(--text)] mb-4 shrink-0">Objectifs du trimestre</h3>
          <div className="flex-1 space-y-4">
            {[
              { label: "Nouveaux leads qualifiés", progress: 75 },
              { label: "Déploiement V2 du site", progress: 40 },
              { label: "Réduction taux d'attrition", progress: 90 },
            ].map((obj, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-[var(--text)]">{obj.label}</span>
                  <span className="text-[var(--text-muted)] font-mono">{obj.progress}%</span>
                </div>
                <div className="h-2 w-full glass rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-700" style={{ width: `${obj.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
