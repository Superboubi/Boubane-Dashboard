import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Emails } from "./components/Emails";
import { Files } from "./components/Files";
import { Clients } from "./components/Clients";
import { Kanban } from "./components/Kanban";
import { Activity } from "./components/Activity";
import { Web } from "./components/Web";
import { Calendar } from "./components/Calendar";
import { Settings } from "./components/Settings";
import { Agents } from "./components/Agents";
import { AutoReply } from "./components/AutoReply";
import { Business } from "./components/Business";
import { Site } from "./components/Site";
import { AppState, WSMessage } from "./types";
import { DEFAULT_STATE } from "./data";
import { useWebSocket } from "./useWebSocket";
import { Menu, X, Sparkles, Bot, Mail } from "lucide-react";

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/hermes/ws`;

function useStreamingText(done: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stream = useCallback(async (text: string) => {
    setIsStreaming(true);
    setDisplayed('');
    let idx = 0;
    const charsPerTick = 3;
    intervalRef.current = setInterval(() => {
      idx += charsPerTick;
      if (idx >= text.length) {
        setDisplayed(text);
        setIsStreaming(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setDisplayed(text.slice(0, idx));
      }
    }, 20);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { displayed, isStreaming, stream };
}

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  const { isConnected, subscribe, send } = useWebSocket(WS_URL);
  const { displayed: streamedResponse, isStreaming, stream: streamText } = useStreamingText(false);

  useEffect(() => {
    const STATE_VERSION = 2;
    const saved = localStorage.getItem('boubane_react_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed._version === STATE_VERSION) {
          const { _version, ...cleanState } = parsed;
          setState((prev) => ({ ...prev, ...cleanState }));
        } else {
          localStorage.removeItem('boubane_react_state');
        }
      } catch (e) {
        localStorage.removeItem('boubane_react_state');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('boubane_react_state', JSON.stringify({ ...state, _version: 2 }));
    if (state.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [state]);

  useEffect(() => {
    setState((prev) => ({ ...prev, daemonConnected: isConnected }));
  }, [isConnected]);

  useEffect(() => {
    const unsub = subscribe((msg: WSMessage) => {
      if (msg.type === 'status') {
        setState((prev) => ({ ...prev, daemonConnected: msg.daemonConnected }));
      } else if (msg.type === 'log') {
        setState((prev) => ({
          ...prev,
          liveLogs: [{ text: msg.text, status: msg.status, date: msg.date }, ...prev.liveLogs].slice(0, 100),
          activityLogs: [
            { id: 'log-' + Date.now(), date: msg.date, text: msg.text, status: msg.status as any },
            ...prev.activityLogs,
          ].slice(0, 50),
        }));
      } else if (msg.type === 'task_alert' && msg.task) {
        setState((prev) => ({
          ...prev,
          kanban: [...prev.kanban, msg.task],
        }));
      } else if (msg.type === 'hermes_action') {
        setState((prev) => ({ ...prev, hermesStatus: 'thinking' }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, hermesStatus: 'ready' }));
        }, 2000);
      }
    });
    return unsub;
  }, [subscribe]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleTheme = () => {
    updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const chatNavigate = () => {
    setActiveTab('activity');
  };

  const unreadConfig = state.emails.filter((e) => !e.read && e.folder === 'INBOX').length;

  const handleCopilotSubmit = async () => {
    if (!copilotInput.trim() || copilotLoading) return;
    setCopilotLoading(true);
    setCopilotResponse('');
    try {
      const res = await fetch('/api/mail/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot',
          message: copilotInput,
          emails: state.emails.map((e) => ({
            id: e.id,
            sender: e.sender,
            subject: e.subject,
            body: e.body,
            date: e.date,
            category: e.category,
            urgency: e.urgency || 'moyenne',
            read: e.read,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await streamText(data.reply);
        setCopilotResponse(data.reply);
      }
    } catch (err) {
      setCopilotResponse("Désolé, je n'ai pas pu traiter votre demande.");
    } finally {
      setCopilotLoading(false);
    }
  };

  const renderCopilotActions = (text: string) => {
    const parts = text.split(/(\[Action:[^\]]+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[Action:\s*select-email\|([^\|]+)\|([^\]]+)\]/);
      if (match) {
        const mailId = match[1];
        return (
          <button
            key={i}
            onClick={() => {
              setCopilotOpen(false);
              setActiveTab('emails');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('boubane-select-mail', { detail: { id: mailId } }));
              }, 300);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer mx-1"
          >
            <Mail className="w-3 h-3" />
            {match[2]}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex w-full h-screen text-[var(--text)] font-sans overflow-hidden selection:bg-[var(--accent-glow)] selection:text-[var(--accent)]" style={{background: 'var(--bg)'}}>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-500 ease-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(t) => { setActiveTab(t); setMobileMenuOpen(false); }}
          theme={state.theme}
          toggleTheme={toggleTheme}
          unreadCount={unreadConfig}
          filesCount={state.files.length}
          calendarCount={state.calendar.length}
        />
      </div>

      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={state.theme}
          toggleTheme={toggleTheme}
          unreadCount={unreadConfig}
          filesCount={state.files.length}
          calendarCount={state.calendar.length}
        />
      </div>

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold shadow-lg shadow-[var(--accent-glow)]">b</div>
            <span className="font-bold text-lg">boubane<span className="text-[var(--accent)]">.</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] hover:text-[var(--text)] transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--text)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hermes Status Bar */}
        <div className="shrink-0 px-4 md:px-6 py-1.5 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-700 ${
              state.hermesStatus === 'thinking' ? 'bg-[var(--hermes-amber)] animate-pulse' :
              state.hermesStatus === 'error' ? 'bg-[var(--error)]' :
              'bg-[var(--hermes-emerald)]'
            }`} />
            <span className="text-[11px] font-semibold text-[var(--text-muted)] font-mono uppercase tracking-wider">
              Hermes
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {state.hermesStatus === 'thinking' ? 'Analyse en cours...' :
               state.hermesStatus === 'error' ? 'Attention requise' :
               'Prêt'}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--hermes-emerald)]' : 'bg-[var(--error)]'}`} />
            {isConnected ? 'Realtime' : 'Déconnecté'}
          </div>
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Copilot
          </button>
        </div>

        <div className={`flex-1 min-h-0 ${
          activeTab === 'emails' || activeTab === 'kanban' || activeTab === 'calendar' || activeTab === 'activity'
            ? 'flex flex-col h-full overflow-hidden'
            : 'overflow-y-auto'
        }`}>
          {activeTab === 'dashboard' && <Dashboard state={state} setActiveTab={setActiveTab} updateState={updateState} />}
          {activeTab === 'emails' && (
            <Emails
              state={state}
              updateState={updateState}
              navigateToChat={() => setActiveTab('activity')}
            />
          )}
          {activeTab === 'files' && <Files state={state} updateState={updateState} chatNavigate={chatNavigate} />}
          {activeTab === 'clients' && <Clients state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'kanban' && (
            <Kanban
              state={state}
              updateState={updateState}
              navigateToChat={() => setActiveTab('activity')}
            />
          )}
          {activeTab === 'activity' && <Activity state={state} />}
          {activeTab === 'web' && <Web state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'calendar' && <Calendar state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'agents' && <Agents state={state} updateState={updateState} />}
          {activeTab === 'settings' && <Settings state={state} updateState={updateState} />}
          {activeTab === 'auto-reply' && <AutoReply state={state} updateState={updateState} />}
          {activeTab === 'business' && <Business state={state} />}
          {activeTab === 'site' && <Site state={state} updateState={updateState} />}
        </div>
      </main>

      {/* Copilot Panel */}
      {copilotOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setCopilotOpen(false)}
          />
          <div className="fixed bottom-0 right-0 z-50 w-full max-w-lg h-[70vh] md:h-[80vh] md:bottom-4 md:right-4 md:rounded-2xl glass-strong shadow-2xl flex flex-col overflow-hidden animate-spring-up border border-[var(--border)]">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center text-xs font-bold">H</div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Hermes Copilot</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">Posez-moi une question sur vos données</p>
                </div>
              </div>
              <button onClick={() => setCopilotOpen(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {!copilotResponse && !copilotLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center mb-3 animate-float">
                    <Bot className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)] max-w-xs">
                    Demandez-moi de résumer votre boîte, lister les urgences, ou trouver une opportunité client.
                  </p>
                </div>
              ) : copilotLoading && !isStreaming ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--hermes-amber)] animate-pulse" />
                  <span className="text-sm text-[var(--text-muted)] font-mono">Hermes réfléchit...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-[var(--text)] prose-headings:text-[var(--text)] prose-strong:text-[var(--accent)] prose-p:text-[var(--text-muted)] space-y-2">
                  {renderCopilotActions(isStreaming ? streamedResponse : copilotResponse)}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCopilotSubmit(); } }}
                  placeholder="Parle à Hermes..."
                  className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
                  disabled={copilotLoading}
                />
                <button
                  onClick={handleCopilotSubmit}
                  disabled={copilotLoading || !copilotInput.trim()}
                  className="px-4 py-2.5 bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 rounded-xl text-sm font-bold transition-all hover:bg-[var(--accent-hover)] cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
