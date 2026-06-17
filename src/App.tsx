/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
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
import { AppState, AppFile } from "./types";
import { DEFAULT_STATE } from "./data";
import { Menu, X } from "lucide-react";

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only run on client
    const saved = localStorage.getItem('boubane_react_state');
    if (saved) {
      try { setState(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('boubane_react_state', JSON.stringify(state));
    if (state.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const toggleTheme = () => {
    updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const chatNavigate = () => {
    setActiveTab('activity');
  };

  const unreadConfig = state.emails.filter(e => !e.read && e.folder === 'INBOX').length;

  return (
    <div className="flex w-full h-screen bg-[var(--bg)] text-[var(--text)] font-sans overflow-hidden selection:bg-[var(--accent-glow)] selection:text-[var(--accent)]">
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(t) => {setActiveTab(t); setMobileMenuOpen(false);}} 
          theme={state.theme} 
          toggleTheme={toggleTheme}
          unreadCount={unreadConfig}
          filesCount={state.files.length}
          calendarCount={state.calendar.length}
         />
      </div>

      {/* Desktop Sidebar */}
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
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-bold">b</div>
            <span className="font-bold text-lg">boubane<span className="text-[var(--accent)]">.</span></span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-[var(--text)]">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard state={state} setActiveTab={setActiveTab} updateState={updateState} />}
          {activeTab === 'emails' && <Emails state={state} updateState={updateState} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'files' && <Files state={state} updateState={updateState} chatNavigate={chatNavigate} />}
          {activeTab === 'clients' && <Clients state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'kanban' && <Kanban state={state} updateState={updateState} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'activity' && <Activity state={state} />}
          {activeTab === 'web' && <Web state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'calendar' && <Calendar state={state} navigateToChat={() => setActiveTab('activity')} />}
          {activeTab === 'agents' && <Agents state={state} updateState={updateState} />}
          {activeTab === 'settings' && <Settings state={state} updateState={updateState} />}
          {activeTab === 'auto-reply' && <AutoReply state={state} updateState={updateState} />}
          {activeTab === 'business' && <Business state={state} />}
          {activeTab === 'site' && <Site state={state} />}
        </div>
      </main>
    </div>
  );
}
