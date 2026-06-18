import { AppState, AutoRule } from "../types";
import { useState } from "react";
import { Sparkles, Plus, Zap, Trash2, ToggleLeft, ToggleRight, Bot, ArrowRight, Mail, Tag, Brain } from "lucide-react";

export function AutoReply({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void }) {
  const [showNewRule, setShowNewRule] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');

  const config = state.autoConfig;
  const rules = config.rules || [];

  const toggleRule = (id: string) => {
    updateState({
      autoConfig: {
        ...config,
        rules: rules.map(r => r.id === id ? { ...r, active: !r.active } : r),
      },
    });
  };

  const addRule = () => {
    if (!newTrigger.trim()) return;
    const newRule: AutoRule = {
      id: 'rule-' + Date.now(),
      trigger: newTrigger,
      action: newAction || 'Classer et archiver automatiquement',
      active: true,
    };
    updateState({
      autoConfig: {
        ...config,
        rules: [...rules, newRule],
      },
    });
    setNewTrigger('');
    setNewAction('');
    setShowNewRule(false);
  };

  const deleteRule = (id: string) => {
    updateState({
      autoConfig: {
        ...config,
        rules: rules.filter(r => r.id !== id),
      },
    });
  };

  const toggleMain = () => {
    updateState({
      autoConfig: { ...config, enabled: !config.enabled },
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-stream-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Règles d'Automatisation</h1>
          <p className="text-sm text-[var(--text-muted)]">Configurez le flux de travail d'Hermes.</p>
        </div>
        <button
          onClick={toggleMain}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            config.enabled
              ? 'bg-[var(--hermes-emerald-glow)] text-[var(--hermes-emerald)] border border-[var(--hermes-emerald)]/30'
              : 'glass text-[var(--text-muted)]'
          }`}
        >
          {config.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {config.enabled ? 'Activé' : 'Désactivé'}
        </button>
      </div>

      {/* Visual Workflow */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">Flux Hermes</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2">
          {/* Trigger Node */}
          <div className="flex-1 w-full md:w-auto">
            <div className="glass-strong rounded-2xl p-4 border-l-4 border-l-[var(--accent)]">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Email entrant</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Nouveau message dans INBOX</p>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] hidden md:block shrink-0" />
          <div className="md:hidden w-px h-4 bg-[var(--border)] mx-auto" />

          {/* Analysis Node */}
          <div className="flex-1 w-full md:w-auto">
            <div className="glass-strong rounded-2xl p-4 border-l-4 border-l-[var(--hermes-emerald)]">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-[var(--hermes-emerald)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Analyse Hermes</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Classification & sentiment</p>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] hidden md:block shrink-0" />
          <div className="md:hidden w-px h-4 bg-[var(--border)] mx-auto" />

          {/* Rules Node */}
          <div className="flex-1 w-full md:w-auto">
            <div className="glass-strong rounded-2xl p-4 border-l-4 border-l-[var(--hermes-amber)]">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[var(--hermes-amber)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Règles ({rules.length})</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Correspondance & action</p>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] hidden md:block shrink-0" />
          <div className="md:hidden w-px h-4 bg-[var(--border)] mx-auto" />

          {/* Output Node */}
          <div className="flex-1 w-full md:w-auto">
            <div className="glass-strong rounded-2xl p-4 border-l-4 border-l-[var(--success)]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[var(--success)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Action automatique</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Brouillon, classement, archivage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text)]">Règles configurées</h2>
          <button
            onClick={() => setShowNewRule(!showNewRule)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] rounded-xl text-xs font-bold transition-all hover:bg-[var(--accent-hover)] cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        {showNewRule && (
          <div className="glass rounded-2xl p-5 space-y-3 animate-stream-in">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Mot déclencheur</label>
              <input
                autoFocus
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder="Ex: Facture, Contrat, Devis..."
                className="w-full glass border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter') addRule(); }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Action</label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full glass border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
              >
                <option value="">Choisir une action...</option>
                <option value="Classer en Finance et archiver automatiquement">Classer en Finance + Archiver</option>
                <option value="Classer Important & Générer brouillon IA">Classer Important + Brouillon IA</option>
                <option value="Transférer vers le cabinet associé">Transférer au cabinet</option>
                <option value="Marquer comme urgence et notifier">Urgence + Notification</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewRule(false)} className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer">Annuler</button>
              <button onClick={addRule} disabled={!newTrigger.trim()} className="px-4 py-1.5 bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95">
                <Sparkles className="w-3 h-3 inline mr-1" /> Ajouter la règle
              </button>
            </div>
          </div>
        )}

        {rules.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Zap className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">Aucune règle configurée.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`glass rounded-2xl p-4 flex items-center justify-between gap-4 transition-all organic-card ${
                !rule.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold text-[var(--accent)] font-mono`}>
                    {rule.trigger}
                  </span>
                  {!rule.active && (
                    <span className="text-[9px] text-[var(--text-muted)] font-mono">(Inactive)</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{rule.action}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    rule.active
                      ? 'text-[var(--hermes-emerald)] hover:bg-[var(--hermes-emerald-glow)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {rule.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[#422d2d]/50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-processing logs */}
      {(config.logs?.length || 0) > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-[var(--text)]">Journal d'exécution</h2>
          <div className="glass rounded-2xl divide-y divide-[var(--border)]">
            {config.logs.slice().reverse().map((log, i) => (
              <div key={i} className="p-3 flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  log.type === 'error' ? 'bg-[var(--error)]' : 'bg-[var(--hermes-emerald)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text)]">{log.text}</p>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(log.date).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
