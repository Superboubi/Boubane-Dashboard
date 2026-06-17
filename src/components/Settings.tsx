import { AppState } from "../types";
import { Settings2, Save, Calendar, CheckCircle2, Link2, RefreshCw, Shield, Bot, Layout, Bell, Globe } from "lucide-react";
import { useState } from "react";

export function Settings({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void }) {
  const [syncedCalendars, setSyncedCalendars] = useState<string[]>(['google']);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local state for complex settings before they might be saved to global (simulated)
  const [retention, setRetention] = useState('30');
  const [language, setLanguage] = useState('fr');

  const handleSync = (id: string) => {
    if (syncedCalendars.includes(id)) {
      setSyncedCalendars(syncedCalendars.filter(c => c !== id));
    } else {
      setIsSyncing(true);
      setTimeout(() => {
        setSyncedCalendars([...syncedCalendars, id]);
        setIsSyncing(false);
      }, 1000);
    }
  };

  const providers = [
    { id: 'google', name: 'Google Calendar', color: 'bg-white', text: 'text-[#4285F4]', icon: 'G' },
    { id: 'outlook', name: 'Microsoft Outlook', color: 'bg-[#0078D4]', text: 'text-white', icon: 'M' },
    { id: 'apple', name: 'Apple Calendar', color: 'bg-gray-100 dark:bg-zinc-800', text: 'text-black dark:text-white', icon: '' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in h-full overflow-y-auto">
      <div className="flex items-center justify-between shrink-0">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Paramètres</h1>
           <p className="text-sm text-[var(--text-muted)] mt-1">Configuration système, personnalisation et règles de l'agent.</p>
         </div>
         <button className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
           <Save className="w-4 h-4" /> Enregistrer tout
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Profile & General */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[var(--text)]" /> 
              Profil & Général
            </h2>
            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Nom d'affichage</label>
                <input 
                  type="text" 
                  value={state.user.name} 
                  onChange={e => updateState({ user: { ...state.user, name: e.target.value } })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--text-muted)]" /> Langue de l'interface & de l'agent
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="fr">Français</option>
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-[var(--accent)]" /> 
              Comportement de l'Agent Hermes
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="font-medium text-[var(--text)]">Rédaction automatique des brouillons</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Pré-rédaction de réponses basées sur le contexte des emails entrants importants.</div>
                </div>
                <button 
                  onClick={() => updateState({ autoConfig: { ...state.autoConfig, replyDraft: !state.autoConfig.replyDraft } })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${state.autoConfig.replyDraft ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.autoConfig.replyDraft ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="font-medium text-[var(--text)]">Archivage autonome</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">L'agent archive automatiquement les reçus, newsletters inutiles et spam évidents.</div>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none bg-[var(--accent)]">
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="font-medium text-[var(--text)]">Ton de rédaction par défaut</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Le style d'écriture utilisé pour générer les réponses.</div>
                </div>
                <select className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-[var(--accent)] transition-colors w-32">
                  <option>Professionnel</option>
                  <option>Concis</option>
                  <option>Amical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--text)]" />
              Intégrations Liées
            </h2>
            <div className="space-y-4">
              {providers.map(provider => {
                 const isConnected = syncedCalendars.includes(provider.id);
                 return (
                   <div key={provider.id} className="flex items-center justify-between border-b border-[var(--border)] last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm ${provider.color} ${provider.text} shadow-sm border border-black/10 dark:border-white/10`}>
                          {provider.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-[var(--text)]">{provider.name}</h3>
                          <div className={`text-xs flex items-center gap-1 ${isConnected ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                            {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                            {isConnected ? 'Actif' : 'Non connecté'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSync(provider.id)}
                        disabled={isSyncing && !isConnected}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${isConnected ? 'bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10' : 'bg-[var(--text)] text-[var(--bg)] border-transparent hover:opacity-90'}`}
                      >
                        {isSyncing && isConnected ? '...' : isConnected ? 'Déconnecter' : 'Connecter'}
                      </button>
                   </div>
                 )
              })}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Appearance */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Layout className="w-5 h-5 text-[var(--text)]" />
              Apparence & Interface
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text)]">Thème sombre</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Activer ou désactiver le mode nuit.</div>
                </div>
                <button 
                  onClick={() => updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${state.theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text)]">Animations réduites</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Désactive la majorité des transitions et flous.</div>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none bg-[var(--border)]">
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--text)]" />
              Sécurité & Données
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="font-medium text-[var(--text)]">Chiffrement de bout en bout (E2EE)</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Les données stockées localement sont chiffrées. Requis pour le traitement IA local.</div>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none bg-[var(--accent)]">
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                </button>
              </div>
              
              <div>
                <div className="font-medium text-[var(--text)] mb-2">Rétention de l'historique d'activité</div>
                <select 
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">3 mois</option>
                  <option value="365">1 an</option>
                  <option value="infinity">Conserver indéfiniment</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                 <button className="w-full flex justify-center px-4 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--error)] hover:bg-[#ff000010] hover:border-red-500/30 rounded-lg text-sm font-medium transition-colors">
                   Effacer les données en cache
                 </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--text)]" />
              Notifications
            </h2>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text)]">Alertes sonores</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Sons lors de la réception d'emails importants.</div>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none bg-[var(--border)]">
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
                </button>
              </div>
               <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text)]">Rapport Quotidien Hermes</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Recevoir un résumé du travail de l'agent en fin de journée.</div>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none bg-[var(--accent)]">
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

