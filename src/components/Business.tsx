import { AppState } from "../types";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { useState } from "react";

export function Business({ state }: { state: AppState }) {
  const stats = [
    { label: "Revenu du mois", value: "14 230 €", change: "+12.5%", icon: DollarSign, positive: true },
    { label: "Nouveaux clients", value: "32", change: "+4", icon: Users, positive: true },
    { label: "Taux de conversion", value: "4.8%", change: "-0.2%", icon: Activity, positive: false },
    { label: "Croissance", value: "+22%", change: "+2%", icon: TrendingUp, positive: true },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Vue d'ensemble</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Métriques principales de votre activité.</p>
        </div>
        <select className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
          <option>Ce mois-ci</option>
          <option>Le mois dernier</option>
          <option>Cette année</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</span>
              <div className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)]">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text)]">{stat.value}</div>
            <div className={`text-xs font-medium mt-2 flex items-center gap-1 ${stat.positive ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {stat.change} par rapport au mois précédent
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 h-80 flex flex-col">
           <h3 className="font-semibold text-[var(--text)] mb-4 shrink-0">Chiffre d'Affaires</h3>
           <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-muted)] text-sm">
             [Espace graphique en cours d'intégration]
           </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 h-80 flex flex-col">
           <h3 className="font-semibold text-[var(--text)] mb-4 shrink-0">Objectifs du trimestre</h3>
           <div className="flex-1 space-y-4">
              {[
                { label: "Nouveaux leads qualifiés", progress: 75 },
                { label: "Déploiement V2 du site", progress: 40 },
                { label: "Réduction taux d'attrition", progress: 90 },
              ].map((obj, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[var(--text)]">{obj.label}</span>
                    <span className="text-[var(--text-muted)] font-mono">{obj.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text)]" style={{ width: `${obj.progress}%` }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
