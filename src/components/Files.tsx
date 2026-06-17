import { useState } from "react";
import { AppState, AppFile } from "../types";
import { FileText, Image as ImageIcon, Map, Search, Trash2, Eye, Bot, X } from "lucide-react";

export function Files({ state, updateState, chatNavigate }: { state: AppState, updateState: (s: Partial<AppState>) => void, chatNavigate: (file: AppFile) => void }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewingFile, setViewingFile] = useState<AppFile | null>(null);

  let files = state.files;
  if (filter !== 'all') files = files.filter(f => f.type === filter);
  if (search) files = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.content.toLowerCase().includes(search.toLowerCase()));

  const deleteFile = (id: string) => {
    updateState({ files: state.files.filter(f => f.id !== id) });
    if (viewingFile?.id === id) setViewingFile(null);
  };

  const getIcon = (type: string) => {
    if (type === 'pdf') return <FileText className="w-8 h-8 text-[var(--error)]" />;
    if (type === 'xlsx') return <Map className="w-8 h-8 text-[var(--success)]" />;
    if (type === 'image') return <ImageIcon className="w-8 h-8 text-blue-400" />;
    return <FileText className="w-8 h-8 text-[var(--text-muted)]" />;
  };

  if (viewingFile) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewingFile(null)} className="p-2 border border-[var(--border)] rounded-md hover:bg-[var(--bg-hover)] text-[var(--text)]">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">{viewingFile.name}</h2>
              <div className="text-sm text-[var(--text-muted)]">{viewingFile.size} &bull; {new Date(viewingFile.date).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => chatNavigate(viewingFile)} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <Bot className="w-4 h-4" /> Analyser par l'IA
            </button>
            <button onClick={() => deleteFile(viewingFile.id)} className="p-2 border border-[var(--border)] rounded-lg text-[var(--error)] hover:bg-[var(--bg-hover)]">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
           <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text)] rounded-lg bg-[var(--bg)] p-6 border border-[var(--border)]">
             {viewingFile.content}
           </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Fichiers indexés</h1>
           <p className="text-sm text-[var(--text-muted)]">Gérez les documents injectés dans la mémoire locale du VPS.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          {['all', 'pdf', 'xlsx', 'image', 'txt'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider ${filter === f ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              {f === 'all' ? 'Tout' : f}
            </button>
          ))}
        </div>
        <div className="relative">
           <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
           <input 
             type="text" 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors w-full sm:w-64"
             placeholder="Rechercher un fichier..."
           />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
            Aucun fichier trouvé.
          </div>
        ) : files.map(f => (
          <div key={f.id} className="bg-[var(--bg-surface)] border border-[var(--border)] p-5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors flex flex-col cursor-pointer" onClick={() => setViewingFile(f)}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-sm">
                 {getIcon(f.type)}
              </div>
              <div className="text-xs font-semibold px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)] uppercase">
                {f.type}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text)] line-clamp-2 md:truncate mb-1">{f.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">{f.size} &bull; {new Date(f.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
