import {
  LayoutDashboard,
  MessageSquare,
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
  Moon
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
        { id: 'agents', icon: Bot, label: 'Agents IA' }
      ]
    },
    { group: 'Système', items: [{ id: 'activity', icon: Activity, label: 'Activité' }, { id: 'settings', icon: Settings, label: 'Paramètres' }] },
  ];

  return (
    <div className="w-64 h-screen border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col shrink-0 flex-none overflow-y-auto hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold">b</div>
        <span className="font-bold text-lg text-[var(--text)] tracking-tight">boubane<span className="text-[var(--accent)]">.</span></span>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-6">
        {navItems.map((group, i) => (
          <div key={i}>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-3">{group.group}</div>
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'text-[var(--text)] hover:bg-[var(--bg-hover)]'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.badge ? (
                    <span className="bg-[var(--accent)] text-[var(--bg)] text-[10px] shadow-sm font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)] relative">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors border border-[var(--border)]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          Mode {theme === 'dark' ? 'Clair' : 'Sombre'}
        </button>
      </div>
    </div>
  );
}
