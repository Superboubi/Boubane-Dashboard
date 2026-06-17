import { AppState, KanbanTask } from "../types";
import { Plus, MoreVertical, LayoutGrid, Bot, Sparkles, AlertCircle, GripVertical, Calendar as CalendarIcon, User, X, CheckSquare, Square, Trash2, Edit3, Tag, Check, ArrowRight } from "lucide-react";
import { useState } from "react";

export function Kanban({ state, updateState, navigateToChat }: { state: AppState, updateState: (s: Partial<AppState>) => void, navigateToChat: () => void }) {
  const columns = ['todo', 'doing', 'done'] as const;
  const titles = { 'todo': 'À faire', 'doing': 'En cours', 'done': 'Terminé' };
  
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<'todo'|'doing'|'done'|null>(null);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  
  const [newTaskCol, setNewTaskCol] = useState<'todo'|'doing'|'done'|null>(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', desc: '' });

  // Selected card for Details Modal (Trello card detail view)
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, col: 'todo'|'doing'|'done') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverCol !== col) {
      setDraggedOverCol(col);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumn: 'todo'|'doing'|'done') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    
    updateState({
      kanban: state.kanban.map(t => t.id === id ? { ...t, column: targetColumn } : t)
    });
    setDraggedItem(null);
    setDraggedOverCol(null);
  };

  const generateAIStory = () => {
    setIsAgentThinking(true);
    setTimeout(() => {
      const newTasks: KanbanTask[] = [
        ...state.kanban,
        {
          id: 'task-' + Date.now(),
          title: 'Review des logs d\'erreur',
          desc: 'Analyser les erreurs de production remontées par le scan automatique de cette nuit.',
          column: 'todo',
          priority: 'high',
          origin: 'Agent Hermes',
          checklist: [
            { id: 'c1', text: 'Vérifier la connexion au serveur IMAP', done: true },
            { id: 'c2', text: 'Examiner le script d\'auto-restart', done: false },
            { id: 'c3', text: 'Informer le manager du correctif rédigé par Hermes', done: false }
          ]
        },
        {
          id: 'task-' + (Date.now() + 1),
          title: 'Préparer la réunion client',
          desc: 'Synthétiser les points clés pour le call de cet après-midi.',
          column: 'todo',
          priority: 'medium',
          origin: 'Agent Hermes'
        }
      ];
      updateState({ kanban: newTasks });
      setIsAgentThinking(false);
      setShowAgentPanel(false);
    }, 1500);
  };

  const addTask = (col: 'todo'|'doing'|'done') => {
    if (!newTaskData.title) {
        setNewTaskCol(null);
        return;
    }
    const newTask: KanbanTask = {
      id: 'task-' + Date.now(),
      title: newTaskData.title,
      desc: newTaskData.desc,
      column: col,
      priority: 'medium',
      checklist: []
    };
    updateState({
      kanban: [...state.kanban, newTask]
    });
    setNewTaskCol(null);
    setNewTaskData({ title: '', desc: '' });
  };

  const updateSelectedTask = (updated: KanbanTask) => {
    setSelectedTask(updated);
    updateState({
      kanban: state.kanban.map(t => t.id === updated.id ? updated : t)
    });
  };

  const deleteCard = (id: string) => {
    updateState({
      kanban: state.kanban.filter(t => t.id !== id)
    });
    setSelectedTask(null);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !selectedTask) return;
    const newItem = {
      id: 'chk-' + Date.now(),
      text: newChecklistItem.trim(),
      done: false
    };
    const updated = {
      ...selectedTask,
      checklist: [...(selectedTask.checklist || []), newItem]
    };
    updateSelectedTask(updated);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!selectedTask) return;
    const updated = {
      ...selectedTask,
      checklist: (selectedTask.checklist || []).map(item => 
        item.id === itemId ? { ...item, done: !item.done } : item
      )
    };
    updateSelectedTask(updated);
  };

  const removeChecklistItem = (itemId: string) => {
    if (!selectedTask) return;
    const updated = {
      ...selectedTask,
      checklist: (selectedTask.checklist || []).filter(item => item.id !== itemId)
    };
    updateSelectedTask(updated);
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col min-w-0 max-w-full mx-auto animate-in fade-in bg-[var(--bg)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
             <LayoutGrid className="w-6 h-6 text-[var(--accent)]" /> Trello Workspace
           </h1>
           <p className="text-sm text-[var(--text-muted)] mt-1">
             Gérez vos projets comme sur Trello avec drag-and-drop, checklists interactives et automatisation intelligente.
           </p>
         </div>
         <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowAgentPanel(!showAgentPanel)}
             className={`px-4 py-2 border border-[var(--accent)] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${showAgentPanel ? 'bg-[var(--accent)] text-[var(--bg)] font-semibold' : 'bg-[var(--accent-glow)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)]'}`}
           >
             <Bot className="w-4 h-4 text-xs" /> Agent intelligent Hermes
           </button>
           <button onClick={() => setNewTaskCol('todo')} className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm font-semibold">
             <Plus className="w-4 h-4" /> Créer une carte
           </button>
         </div>
      </div>

      {/* AI Assistant Banner */}
      {showAgentPanel && (
        <div className="mb-6 p-5 bg-[var(--bg-surface)] border border-[var(--accent)]/50 rounded-xl relative overflow-hidden animate-in slide-in-from-top-2 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-glow)] flex items-center justify-center shrink-0 border border-[var(--accent)]/30 text-[var(--accent)]">
             <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
             <h3 className="font-semibold text-[var(--text)] text-sm mb-1 flex items-center gap-2">
               Génération Auto-Magique par Hermes
             </h3>
             <p className="text-sm text-[var(--text-muted)] mb-3 max-w-3xl leading-relaxed">
               L'agent surveille en continu ce tableau ainsi que vos e-mails de travail. Il peut instantanément générer vos cartes, préparer vos sous-tâches ou attribuer les priorités pour vous délester du travail de gestion.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={generateAIStory}
                 disabled={isAgentThinking}
                 className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-md text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
               >
                 {isAgentThinking ? <span className="animate-pulse flex items-center gap-2"><Bot className="w-4 h-4 animate-bounce" /> Analyse opérationnelle...</span> : 'Générer des cartes de travail'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Trello Board Grid */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar select-none">
        {columns.map(col => {
          const tasks = state.kanban.filter(t => t.column === col);
          const isOver = draggedOverCol === col;
          
          return (
            <div 
              key={col} 
              onDragOver={(e) => handleDragOver(e, col)}
              onDragLeave={() => setDraggedOverCol(null)}
              onDrop={(e) => handleDrop(e, col)}
              className={`w-80 shrink-0 flex flex-col bg-[var(--bg-surface-2)] rounded-xl border-2 transition-all duration-200 ${isOver ? 'border-[var(--accent)] bg-[var(--bg-surface-2)]/90 scale-[1.01]' : 'border-[var(--border)] overflow-hidden'}`}
            >
              {/* List Header */}
              <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between cursor-default">
                 <h3 className="font-bold text-sm text-[var(--text)] flex items-center gap-2 capitalize">
                   <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                   {titles[col]}
                 </h3>
                 <span className="text-xs bg-[var(--bg)] border border-[var(--border)] px-2.5 py-0.5 rounded-full text-[var(--text-muted)] font-mono font-bold">
                   {tasks.length}
                 </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
                {tasks.map(task => {
                  const checklistTotal = task.checklist?.length || 0;
                  const checklistDone = task.checklist?.filter(item => item.done).length || 0;
                  const percentComplete = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
                  
                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-[var(--bg-surface)] p-4 rounded-lg shadow-sm border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow hover:-translate-y-0.5 relative group ${draggedItem === task.id ? 'opacity-30 border-dashed border-[var(--text-muted)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}`}
                    >
                       {/* Labels / Row 1 */}
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex flex-wrap gap-1.5 max-w-[80%]">
                           <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${
                             task.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                             task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                             'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                           }`}>{task.priority}</span>
                           {task.origin === 'Agent Hermes' && (
                             <span className="text-[10px] flex items-center gap-1 font-bold text-[var(--accent)] bg-[var(--accent-glow)] px-1.5 py-0.5 rounded border border-[var(--accent)]/30" title="Synchronisé de mon outil Hermes">
                               <Bot className="w-3 h-3 text-xs" /> IA
                             </span>
                           )}
                         </div>
                         <button className="text-[var(--border)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4"/></button>
                       </div>

                       {/* Title & Desc */}
                       <h4 className="font-bold text-sm text-[var(--text)] mb-1 leading-snug group-hover:text-[var(--accent)] transition-colors">{task.title}</h4>
                       {task.desc && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">{task.desc}</p>}
                       
                       {/* Checklist Indicator */}
                       {checklistTotal > 0 && (
                         <div className="mb-3">
                           <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1 font-medium">
                             <span>Checklist ({checklistDone}/{checklistTotal})</span>
                             <span className="font-mono">{percentComplete}%</span>
                           </div>
                           <div className="w-full bg-[var(--bg)] h-1.5 rounded-full border border-[var(--border)] overflow-hidden">
                             <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${percentComplete}%` }} />
                           </div>
                         </div>
                       )}

                       {/* Card Footer info */}
                       <div className="flex items-center justify-between border-t border-[var(--border)] pt-2.5 mt-2">
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-medium">
                            <CalendarIcon className="w-3 h-3" /> 
                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : "Aujourd'hui"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {task.assignedTo ? (
                              <div className="text-[10px] bg-[var(--bg)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-muted)] max-w-[80px] truncate" title={task.assignedTo}>{task.assignedTo}</div>
                            ) : null}
                            <div className="w-5 h-5 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                              <User className="w-3 h-3 text-[var(--text-muted)]" />
                            </div>
                          </div>
                       </div>
                    </div>
                  );
                })}
                
                {/* Inline Card Creation */}
                {newTaskCol === col ? (
                  <div className="bg-[var(--bg-surface)] p-3.5 rounded-lg border-2 border-[var(--accent)] shadow-sm animate-in zoom-in-95 duration-100">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Saisissez un titre..." 
                      className="w-full text-sm bg-transparent border-none focus:outline-none mb-2 font-bold text-[var(--text)] placeholder:font-normal"
                      value={newTaskData.title}
                      onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                      onKeyDown={e => { if(e.key==='Enter') addTask(col); else if(e.key==='Escape') setNewTaskCol(null); }}
                    />
                    <textarea 
                      placeholder="Détaillez la mission (optionnel)" 
                      className="w-full text-xs bg-transparent border-none focus:outline-none resize-none text-[var(--text-muted)] min-h-[40px]"
                      value={newTaskData.desc}
                      onChange={e => setNewTaskData({...newTaskData, desc: e.target.value})}
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                       <button onClick={() => setNewTaskCol(null)} className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1">Annuler</button>
                       <button onClick={() => addTask(col)} className="text-xs font-semibold bg-[var(--text)] text-[var(--bg)] px-3 py-1 rounded hover:opacity-90 transition-opacity">Ajouter</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setNewTaskCol(col)} className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all ease-out flex items-center gap-2 group justify-center border border-dashed border-[var(--border)]">
                    <Plus className="w-4.5 h-4.5 text-[var(--text-muted)] group-hover:text-[var(--text)]" /> Ajouter une carte
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trello Card Detail Modal overlay */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-surface-2)]">
               <div className="flex items-center gap-2.5 text-[var(--text)]">
                 <LayoutGrid className="w-4 h-4 text-[var(--accent)]" />
                 <span className="font-bold text-xs uppercase tracking-widest text-[var(--text-muted)]">Détail du ticket</span>
               </div>
               <button 
                 onClick={() => setSelectedTask(null)}
                 className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[var(--text)]">
               {/* Card Title */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Titre de la carte</label>
                 <input 
                   type="text" 
                   value={selectedTask.title} 
                   onChange={e => updateSelectedTask({ ...selectedTask, title: e.target.value })}
                   className="w-full text-lg font-bold bg-transparent border-b border-transparent focus:border-[var(--accent)] pb-1 focus:outline-none transition-colors"
                 />
               </div>

               {/* Priority & Group settings */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Priorité</label>
                   <select 
                     value={selectedTask.priority}
                     onChange={e => updateSelectedTask({ ...selectedTask, priority: e.target.value as any })}
                     className="bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1.5 px-3 text-xs w-full focus:outline-none focus:border-[var(--accent)] text-[var(--text)]"
                   >
                     <option value="low">Low (Basse)</option>
                     <option value="medium">Medium (Moyenne)</option>
                     <option value="high">High (Urgente)</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Colonne</label>
                   <select 
                     value={selectedTask.column}
                     onChange={e => updateSelectedTask({ ...selectedTask, column: e.target.value as any })}
                     className="bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1.5 px-3 text-xs w-full focus:outline-none focus:border-[var(--accent)] text-[var(--text)]"
                   >
                     <option value="todo">À faire</option>
                     <option value="doing">En cours</option>
                     <option value="done">Terminé</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Échéance</label>
                   <input 
                     type="date" 
                     value={selectedTask.dueDate || ""}
                     onChange={e => updateSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                     className="bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1 px-2.5 text-xs w-full focus:outline-none focus:border-[var(--accent)] text-[var(--text)]"
                   />
                 </div>

                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Assigné à</label>
                   <input 
                     type="text" 
                     placeholder="Prénom..." 
                     value={selectedTask.assignedTo || ""}
                     onChange={e => updateSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                     className="bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1.5 px-3 text-xs w-full focus:outline-none focus:border-[var(--accent)] text-[var(--text)]"
                   />
                 </div>
               </div>

               {/* Description */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Description de la tâche</label>
                 <textarea 
                   rows={3}
                   value={selectedTask.desc} 
                   onChange={e => updateSelectedTask({ ...selectedTask, desc: e.target.value })}
                   placeholder="Ajoutez des détails pour votre mission..."
                   className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 px-4 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none placeholder:text-xs"
                 />
               </div>

               {/* Interactive Checklist (Trello core feature!) */}
               <div className="space-y-3">
                 <div className="flex justify-between items-center pb-1 border-b border-[var(--border)]">
                   <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                     <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> Checklist de réalisation
                   </label>
                   <span className="text-xs text-[var(--text-muted)] font-mono">
                     {selectedTask.checklist?.filter(i => i.done).length || 0}/{selectedTask.checklist?.length || 0}
                   </span>
                 </div>

                 {/* Checklist Items list */}
                 <div className="space-y-2">
                   {selectedTask.checklist?.map(item => (
                     <div key={item.id} className="flex items-center justify-between p-2 rounded bg-[var(--bg)] border border-[var(--border)] text-sm">
                       <button 
                         onClick={() => toggleChecklistItem(item.id)}
                         className="flex items-center gap-3 text-left hover:text-[var(--accent)] transition-colors group flex-1"
                       >
                         {item.done ? (
                           <CheckSquare className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                         ) : (
                           <Square className="w-4.5 h-4.5 text-[var(--text-muted)] group-hover:text-[var(--text)] shrink-0" />
                         )}
                         <span className={item.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text)]"}>{item.text}</span>
                       </button>
                       <button 
                         onClick={() => removeChecklistItem(item.id)}
                         className="p-1 hover:bg-[var(--bg-surface-2)] text-[var(--error)] rounded"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ))}

                   {/* Add checklist item */}
                   <div className="flex gap-2 items-center mt-2">
                     <input 
                       type="text" 
                       placeholder="Ajouter un sous-tâche..." 
                       value={newChecklistItem}
                       onChange={e => setNewChecklistItem(e.target.value)}
                       onKeyDown={e => { if(e.key === 'Enter') addChecklistItem(); }}
                       className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-[var(--accent)] text-[var(--text)]"
                     />
                     <button 
                       onClick={addChecklistItem}
                       className="px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] font-semibold rounded-lg text-xs"
                     >
                       Ajouter
                     </button>
                   </div>
                 </div>
               </div>

               {/* Metadata & Origin */}
               {selectedTask.origin && (
                 <div className="p-3.5 bg-sky-500/5 border border-sky-500/10 rounded-xl flex items-center gap-3.5 text-xs text-sky-400">
                   <Bot className="w-5 h-5" />
                   <div>
                     <span className="font-bold">Provenance Hermes Daemon</span> - Cette carte a été automatiquement créée par l'agent à la suite d'une analyse d'email.
                   </div>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-surface-2)] flex justify-between items-center">
              <button 
                onClick={() => deleteCard(selectedTask.id)}
                className="px-4 py-2 text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer la carte
              </button>
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 text-xs font-bold bg-[var(--text)] text-[var(--bg)] rounded-xl hover:opacity-90 transition-opacity"
              >
                Fermer & Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
