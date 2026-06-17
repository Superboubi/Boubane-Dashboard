import { AppState } from "../types";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

export function Calendar({ state, navigateToChat }: { state: AppState, navigateToChat: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Adjust so Monday is the first day of week instead of Sunday
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (day: number) => {
    const todayDate = new Date();
    return day === todayDate.getDate() && 
           currentDate.getMonth() === todayDate.getMonth() && 
           currentDate.getFullYear() === todayDate.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    return state.calendar.filter(ev => {
      const evDate = new Date(ev.start);
      return evDate.getDate() === day && 
             evDate.getMonth() === currentDate.getMonth() && 
             evDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
         <div>
           <h1 className="text-2xl font-bold text-[var(--text)]">Calendrier</h1>
           <p className="text-sm text-[var(--text-muted)]">Vue de vos événements planifiés pour le mois.</p>
         </div>
         <div className="flex items-center gap-3">
           <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg overflow-hidden">
             <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button onClick={today} className="px-4 py-2 text-sm font-medium hover:bg-[var(--bg)] transition-colors border-x border-[var(--border)]">
               Aujourd'hui
             </button>
             <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
               <ChevronRight className="w-5 h-5" />
             </button>
           </div>
           <button onClick={() => navigateToChat()} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
             <Plus className="w-4 h-4" /> Nouvel événement
           </button>
         </div>
      </div>

      <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden min-h-[600px]">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] capitalize">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] bg-[var(--border)] gap-px overflow-hidden">
          {/* Header Row */}
          {daysOfWeek.map((day, i) => (
            <div key={day} className="bg-[var(--bg-surface)] py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Grid Cells */}
          {Array.from({ length: 42 }).map((_, i) => {
            const dayNumber = i - firstDayIndex + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const dayEvents = isCurrentMonth ? getEventsForDay(dayNumber) : [];
            const isCurrentDay = isCurrentMonth && isToday(dayNumber);

            return (
              <div 
                key={i} 
                className={`bg-[var(--bg)] min-h-[120px] p-2 transition-colors hover:bg-[var(--bg-surface)] ${!isCurrentMonth ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {isCurrentMonth && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isCurrentDay ? 'bg-[var(--accent)] text-[var(--bg)]' : 'text-[var(--text)]'}`}>
                        {dayNumber}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(ev => (
                        <div 
                          key={ev.id} 
                          className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] text-[var(--text)] rounded truncate cursor-pointer hover:border-[var(--accent)] transition-colors"
                          title={ev.title}
                        >
                          <span className="font-semibold text-[var(--text-muted)] mr-1">
                            {new Date(ev.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
