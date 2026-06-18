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
  ChevronRight,
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
    {
      group: 'Outils',
      items: [
        { id: 'emails', icon: Mail, label: 'Emails', badge: unreadCount },
        { id: 'auto-reply', icon: Zap, label: 'Réponses auto' },
        { id: 'files', icon: FolderOpen, label: 'Fichiers', badge: filesCount },
        { id: 'calendar', icon: Calendar, label: 'Calendrier', badge: calendarCount },
        { id: 'kanban', icon: Trello, label: 'Kanban' },
        { id: 'web', icon: Globe, label: 'Web' },
      ],
    },
    {
      group: 'Business',
      items: [
        { id: 'business', icon: Briefcase, label: "Vue d'ensemble" },
        { id: 'clients', icon: Users, label: 'Clients' },
        { id: 'site', icon: Layout, label: 'Site web' },
        { id: 'agents', icon: Bot, label: 'Agents' },
      ],
    },
    {
      group: 'Système',
      items: [
        { id: 'activity', icon: Activity, label: 'Activité' },
        { id: 'settings', icon: Settings, label: 'Paramètres' },
      ],
    },
  ];

  return (
    <div
      className={`${
        isCollapsed ? 'md:w-[4.25rem]' : 'md:w-64'
      } w-64 h-screen border-r border-[var(--border)] flex flex-col shrink-0 flex-none overflow-y-auto overflow-x-hidden transition-all duration-500 ease-out bg-[var(--bg-surface)] backdrop-blur-md`}
    >
      <div
        className={`p-4 flex items-center ${
          isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between'
        } shrink-0 transition-all duration-500`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold shrink-0 shadow-lg shadow-[var(--accent-glow)]">
            b
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-[var(--text)] tracking-tight whitespace-nowrap animate-in fade-in duration-300">
              boubane<span className="text-[var(--accent)]">.</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg transition-all border border-[var(--border)] hidden md:block cursor-pointer focus:outline-none hover:scale-105 active:scale-95"
          title={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} pb-4 space-y-4 overflow-x-hidden`}>
        {navItems.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {!isCollapsed ? (
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 px-2.5 whitespace-nowrap truncate animate-in fade-in duration-200">
                {group.group}
              </div>
            ) : (
              i > 0 && <div className="h-px bg-[var(--border)] my-3 mx-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => (
                <div key={item.id} className="relative group/item">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                    } text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-[var(--accent-glow)] text-[var(--accent)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover/item:scale-110" />
                      {!isCollapsed && (
                        <span className="whitespace-nowrap truncate animate-in fade-in duration-300 font-medium">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[var(--accent)] text-[var(--bg)] text-[10px] shadow-sm font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-surface)] shrink-0" />
                    )}
                  </button>

                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl glass-strong text-xs font-medium text-[var(--text)] whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 translate-x-2 group-hover/item:translate-x-0 z-50 pointer-events-none shadow-xl border border-[var(--border)]">
                      {item.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`p-4 border-t border-[var(--border)] flex ${isCollapsed ? 'justify-center' : 'justify-start'} shrink-0`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text)] rounded-xl transition-all duration-300 focus:outline-none cursor-pointer ${
            isCollapsed ? 'p-2.5 hover:scale-105 active:scale-95' : 'w-full gap-2 px-3 py-2.5 text-sm font-medium'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-in fade-in duration-300 font-medium">
              {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
