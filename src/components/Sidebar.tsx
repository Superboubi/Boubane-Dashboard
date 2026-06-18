import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Mail,
  Zap,
  FolderOpen,
  Calendar,
  Trello,
  Globe,
  Briefcase,
  Users,
  Layout,
  Bot,
  Activity,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  unreadCount?: number;
  filesCount?: number;
  calendarCount?: number;
}

export function Sidebar({ activeTab, setActiveTab, theme, toggleTheme, unreadCount, filesCount, calendarCount }: SidebarProps) {
  // Collapsed state default loaded from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { group: 'Agent', items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { group: 'Outils', items: [
        { id: 'emails', icon: Mail, label: 'Emails', badge: unreadCount },
        { id: 'auto-reply', icon: Zap, label: 'Réponses auto' },
        { id: 'files', icon: FolderOpen, label: 'Fichiers', badge: filesCount },
        { id: 'calendar', icon: Calendar, label: 'Calendrier', badge: calendarCount },
        { id: 'kanban', icon: Trello, label: 'Kanban' },
        { id: 'web', icon: Globe, label: 'Web' }
      ]
    },
    { group: 'Business', items: [
        { id: 'business', icon: Briefcase, label: "Vue d'ensemble" },
        { id: 'clients', icon: Users, label: 'Clients' },
        { id: 'site', icon: Layout, label: 'Site web' },
        { id: 'agents', icon: Bot, label: 'Agents' }
      ]
    },
    { group: 'Système', items: [{ id: 'activity', icon: Activity, label: 'Activité' }, { id: 'settings', icon: Settings, label: 'Paramètres' }] },
  ];

  return (
    <div className={`${isCollapsed ? 'md:w-16' : 'md:w-64'} w-64 h-screen border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col shrink-0 flex-none overflow-y-auto overflow-x-hidden transition-all duration-300`}>
      
      {/* Header section (Logo and collapse/expand button) */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between'} shrink-0 transition-all`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold shrink-0">b</div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-[var(--text)] tracking-tight whitespace-nowrap animate-in fade-in duration-300">
              boubane<span className="text-[var(--accent)]">.</span>
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-1.5 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg transition-colors border border-[var(--border)] hidden md:block cursor-pointer focus:outline-none"
          title={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} pb-4 space-y-4 overflow-x-hidden`}>
        {navItems.map((group, i) => (
          <div key={i} className="space-y-1">
            {!isCollapsed ? (
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-3 whitespace-nowrap truncate animate-in fade-in duration-200">
                {group.group}
              </div>
            ) : (
              i > 0 && <div className="h-px bg-[var(--border)] my-3 mx-1" />
            )}
            
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'} text-sm font-medium rounded-lg transition-all relative group/item focus:outline-none cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-[var(--accent-glow)] text-[var(--accent)]' 
                      : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap truncate animate-in fade-in duration-300">
                        {item.label}
                      </span>
                    )}
                  </div>
                  
                  {/* Badges */}
                  {!isCollapsed && item.badge ? (
                    <span className="bg-[var(--accent)] text-[var(--bg)] text-[10px] shadow-sm font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                  {isCollapsed && item.badge ? (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-surface)] shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className={`p-4 border-t border-[var(--border)] flex ${isCollapsed ? 'justify-center' : 'justify-start'} shrink-0`}>
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === 'dark' ? 'Mode Clair' : 'Mode Sombre') : undefined}
          className={`flex items-center justify-center border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text)] rounded-lg transition-all focus:outline-none cursor-pointer ${
            isCollapsed ? 'p-2' : 'w-full gap-2 px-3 py-2 text-sm font-medium'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-in fade-in duration-300">
              {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
