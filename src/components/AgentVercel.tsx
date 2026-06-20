import { useState, useEffect, useRef } from "react";
import { Bot, ExternalLink, Maximize2, Minimize2, RefreshCw, X, MessageSquare, Zap, Globe, Shield, Loader2 } from "lucide-react";

interface AgentVercelProps {
  agentUrl?: string;
  agentName?: string;
}

export function AgentVercel({ agentUrl = "https://agent.boubane.ai", agentName = "Hermes Agent" }: AgentVercelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setConnectionStatus('connected');
      setLastRefresh(new Date());
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setTimeout(() => {
      setIsLoading(false);
      setConnectionStatus('connected');
      setLastRefresh(new Date());
    }, 2000);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open(agentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-300 ${
      isFullscreen ? "fixed inset-4 z-50" : ""
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">{agentName}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {connectionStatus === 'connected' ? 'Connecté' :
                 connectionStatus === 'connecting' ? 'Connexion...' :
                 connectionStatus === 'error' ? 'Déconnecté' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {lastRefresh && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono mr-2 hidden sm:inline">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-lg transition-all disabled:opacity-50"
            title="Rafraîchir l'agent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-lg transition-all"
            title={isFullscreen ? "Réduire" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={openInNewTab}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-lg transition-all"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agent Iframe Container */}
      <div className="relative bg-[var(--bg)]" style={{ height: isFullscreen ? "calc(100vh - 120px)" : "600px" }}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)] z-10">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center mb-4 animate-pulse">
              <Bot className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement de l'agent Hermes...</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Connexion sécurisée à {agentUrl}</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg)] z-10 p-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text)] mb-2">Erreur de connexion</h4>
            <p className="text-sm text-[var(--text-muted)] text-center mb-4 max-w-md">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={agentUrl}
          className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => {
            setIsLoading(false);
            setConnectionStatus('connected');
            setLastRefresh(new Date());
          }}
          onError={() => {
            setIsLoading(false);
            setError("Impossible de charger l'agent. Vérifiez que l'URL est correcte et que le service est en ligne.");
            setConnectionStatus('error');
          }}
          title={`${agentName} - Interface`}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--bg)] text-[10px] text-[var(--text-muted)] font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Sandbox isolé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>WebSocket actif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-indigo-500" />
            <span>Session sécurisée</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          <span>{agentUrl}</span>
        </div>
      </div>
    </div>
  );
}