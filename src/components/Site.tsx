import { AppState } from "../types";
import { Layout, Palette, Settings as SettingsIcon, ExternalLink } from "lucide-react";

export function Site({ state }: { state: AppState }) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Site Web</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Gestion du site vitrine et du portail client.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] rounded-lg text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Configuration
          </button>
          <button className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Voir le site
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        {/* Sidebar settings */}
        <div className="w-64 shrink-0 space-y-4 hidden lg:block">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
             <h3 className="font-semibold text-sm text-[var(--text)] mb-3 pb-3 border-b border-[var(--border)] flex items-center gap-2">
               <Palette className="w-4 h-4" /> Apparence
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Thème principal</label>
                 <select className="w-full bg-[var(--bg)] border border-[var(--border)] text-sm rounded-md py-1.5 px-2">
                   <option>Minimaliste (défaut)</option>
                   <option>Moderne (sombre)</option>
                   <option>Corporatif</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Couleur d'accentuation</label>
                 <div className="flex gap-2">
                   <div className="w-6 h-6 rounded-full bg-blue-500 cursor-pointer border-2 border-[var(--bg)] ring-1 ring-blue-500"></div>
                   <div className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer border-2 border-transparent"></div>
                   <div className="w-6 h-6 rounded-full bg-purple-500 cursor-pointer border-2 border-transparent"></div>
                   <div className="w-6 h-6 rounded-full bg-orange-500 cursor-pointer border-2 border-transparent"></div>
                 </div>
               </div>
             </div>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
             <Layout className="w-8 h-8 text-[var(--text-muted)] mt-2" />
             <div className="text-sm font-medium text-[var(--text)]">Éditeur de pages</div>
             <button className="w-full py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium hover:border-[var(--text-muted)] transition-colors">Ouvrir le builder</button>
          </div>
        </div>

        {/* Live Preview Window */}
        <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden">
          <div className="h-10 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-md px-4 py-1 text-xs text-[var(--text-muted)] min-w-[200px] text-center font-mono">
                https://boubane-workspace.com
              </div>
            </div>
          </div>
          <div className="flex-1 bg-[var(--bg)] p-8 overflow-y-auto">
             <div className="max-w-2xl mx-auto text-center mt-20">
               <h2 className="text-4xl font-bold font-sans tracking-tight mb-4 text-[var(--text)]">Bienvenue chez Boubane.</h2>
               <p className="text-lg text-[var(--text-muted)] mb-8">Votre partenaire de confiance pour des solutions techniques innovantes.</p>
               <button className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors">Découvrir nos services</button>
             </div>
             
             <div className="max-w-4xl mx-auto mt-24 grid grid-cols-3 gap-8">
               <div className="h-32 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
                 <div className="w-8 h-8 rounded bg-[var(--bg)] border border-[var(--border)] mb-3"></div>
                 <div className="h-2 w-1/2 bg-[var(--border)] rounded mb-2"></div>
                 <div className="h-2 w-full bg-[var(--border)] rounded mb-1"></div>
                 <div className="h-2 w-2/3 bg-[var(--border)] rounded"></div>
               </div>
               <div className="h-32 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
                 <div className="w-8 h-8 rounded bg-[var(--bg)] border border-[var(--border)] mb-3"></div>
                 <div className="h-2 w-1/2 bg-[var(--border)] rounded mb-2"></div>
                 <div className="h-2 w-full bg-[var(--border)] rounded mb-1"></div>
                 <div className="h-2 w-2/3 bg-[var(--border)] rounded"></div>
               </div>
               <div className="h-32 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
                 <div className="w-8 h-8 rounded bg-[var(--bg)] border border-[var(--border)] mb-3"></div>
                 <div className="h-2 w-1/2 bg-[var(--border)] rounded mb-2"></div>
                 <div className="h-2 w-full bg-[var(--border)] rounded mb-1"></div>
                 <div className="h-2 w-2/3 bg-[var(--border)] rounded"></div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
