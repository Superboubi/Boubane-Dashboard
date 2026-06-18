import { AppState } from "../types";
import { Zap, Bot, Plus, ArrowRight, Settings2, Power } from "lucide-react";
import { useState } from "react";

export function AutoReply({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void }) {
  const [rules, setRules] = useState([
    { id: 1, name: "Demande de facture", trigger: "Contient 'facture' ou 'invoice'", action: "Générer un brouillon avec la facture en PJ", active: true },
    { id: 2, name: "Prise de contact site web", trigger: "Formulaire de contact", action: "Réponse automatique + Tag 'Lead'", active: true },
    { id: 3, name: "Support technique", trigger: "Urgent + 'bug' ou 'problème'", action: "Notifier sur Slack + Brouillon de réassurance", active: false }
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Automatisation de messagerie</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Configurez les règles de réponse automatique de l'agent Hermes.</p>
        </div>
        <button className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle règle
        </button>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <h2 className="font-semibold text-[var(--text)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent)]" /> Règles actives
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text-muted)]">{rules.filter(r => r.active).length} / {rules.length} actives</span>
        </div>
        <div className="divide-y divide-[var(--border)] relative bg-[var(--bg)]">
          {rules.map(rule => (
            <div key={rule.id} className={`p-5 flex items-center gap-4 transition-colors hover:bg-[var(--bg-hover)]`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-sm font-semibold ${rule.active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{rule.name}</h3>
                  {!rule.active && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 border border-[var(--border)] text-[var(--text-muted)] rounded">Désactivé</span>}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span className="font-medium">SI</span> {rule.trigger}
                  </div>
                  <ArrowRight className="w-3 h-3 text-[var(--border)] hidden md:block" />
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--accent)]">ALORS</span> {rule.action}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${rule.active ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg)] shadow ring-0 transition duration-200 ease-in-out ${rule.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] rounded-md transition-colors ml-2">
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center shrink-0 border border-[var(--border)] text-[var(--text-muted)]">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-1">Capacités de l'agent</h4>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
            L'agent peut lire vos emails en temps réel, analyser les pièces jointes (PDF, Word), et interagir avec votre calendrier. Aucune donnée n'est envoyée à des serveurs tiers pour l'entraînement. 
          </p>
        </div>
      </div>
    </div>
  );
}
