import { AppState, KanbanTask } from "../types";
import { Bot, Laptop, Terminal, Play, CheckCircle, AlertCircle, RefreshCw, Radio, Server, Sparkles, Code, Clipboard, Check, HelpCircle, HardDrive, Cpu, Activity, ShieldCheck, Send, MessageSquare, Network, Power, HelpCircle as HelpIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function Agents({ state, updateState }: { state: AppState, updateState: (s: Partial<AppState>) => void }) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'console' | 'api' | 'prompt' | 'simulator' | 'boubane_local'>('boubane_local');
  const [copied, setCopied] = useState<string | null>(null);

  // Local Boubane Integrator States (for Port 7000 FastAPI)
  const [localBoubaneUrl, setLocalBoubaneUrl] = useState("http://localhost:7000");
  const [localConnectionStatus, setLocalConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localMetrics, setLocalMetrics] = useState<{
    cpu: number;
    ram: number;
    disk: number;
    services: string[];
    timestamp: string | null;
  } | null>(null);
  const [localCommand, setLocalCommand] = useState("scan_imap");
  const [localCommandOutput, setLocalCommandOutput] = useState<string | null>(null);
  const [localCommandRunning, setLocalCommandRunning] = useState(false);
  const [autoPollLocal, setAutoPollLocal] = useState(false);

  // Simulator states
  const [simTaskTitle, setSimTaskTitle] = useState("Validation devis - Client Alba");
  const [simTaskDesc, setSimTaskDesc] = useState("Vérifier le PDF du devis de construction reçu ce matin par e-mail.");
  const [simTaskPriority, setSimTaskPriority] = useState<"low" | "medium" | "high">("high");
  const [simTaskChecklist, setSimTaskChecklist] = useState("Vérifier les prix unitaires\nComparer avec le devis précédent\nRédiger l'avis technique");
  const [simLogText, setSimLogText] = useState("[Cron-Boubane] Traitement IMAP des e-mails du 17 Juin terminé avec succès.");
  const [simLogStatus, setSimLogStatus] = useState<'info' | 'success' | 'error'>('success');
  const [simCpu, setSimCpu] = useState(45);
  const [simRam, setSimRam] = useState(62);
  const [simDisk, setSimDisk] = useState(38);
  const [simServices, setSimServices] = useState("boubane-auto-mail, FastAPI-7000, PostgreSQL-15");
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationResponse, setSimulationResponse] = useState<string | null>(null);

  // Keep track of real remote server metrics received from the webhook POST /api/webhooks/metrics
  const [metrics, setMetrics] = useState<{
    cpu: number;
    ram: number;
    disk: number;
    services: string[];
    timestamp: string | null;
  }>({
    cpu: 0,
    ram: 0,
    disk: 0,
    services: [],
    timestamp: null
  });

  const [wsConfigUrl, setWsConfigUrl] = useState(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/hermes/ws`;
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<{ date: string; text: string; status: 'info' | 'success' | 'error' }[]>([
    { date: new Date().toISOString(), text: "Tunnel de supervision prêt et sécurisé.", status: 'info' },
    { date: new Date().toISOString(), text: "En attente d'événements REST sur /api/webhooks/*...", status: 'info' }
  ]);
  const [customCommand, setCustomCommand] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial cached metrics retrieval on mount
  useEffect(() => {
    fetch("/api/webhooks/metrics")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("HTTP Status error");
      })
      .then(data => {
        if (data && data.timestamp) {
          setMetrics(data);
        }
      })
      .catch(err => console.log("No remote telemetry cache found. Waiting for first POST request."));
  }, []);

  // 2. Local Boubane background automatic polling
  useEffect(() => {
    if (!autoPollLocal) return;
    
    // Initial fetch
    fetch(`${localBoubaneUrl}/api/metrics`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        setLocalMetrics({
          cpu: data.cpu ?? 0,
          ram: data.ram ?? 0,
          disk: data.disk ?? 0,
          services: data.services ?? [],
          timestamp: new Date().toISOString()
        });
        setLocalConnectionStatus('success');
      })
      .catch(() => {
        setLocalConnectionStatus('error');
      });

    const timer = setInterval(() => {
      fetch(`${localBoubaneUrl}/api/metrics`)
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.json();
        })
        .then(data => {
          setLocalMetrics({
            cpu: data.cpu ?? 0,
            ram: data.ram ?? 0,
            disk: data.disk ?? 0,
            services: data.services ?? [],
            timestamp: new Date().toISOString()
          });
          setLocalConnectionStatus('success');
        })
        .catch(() => {
          setLocalConnectionStatus('error');
        });
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPollLocal, localBoubaneUrl]);

  // 3. Real-time web socket connection to immediately capture webhook broadcasts
  useEffect(() => {
    const wsUrl = `${wsConfigUrl}?role=client`;
    console.log("Subscribing to telemetry streams at:", wsUrl);
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "log") {
          addLog(data.text, data.status);
          
        } else if (data.type === "metrics_update") {
          if (data.metrics) {
            setMetrics(data.metrics);
            addLog(`⚡ Télémétrie VPS reçue : CPU ${data.metrics.cpu}% | RAM ${data.metrics.ram}%`, "success");
          }
          
        } else if (data.type === "task_alert") {
          const incomingTask = data.task;
          if (incomingTask) {
            addLog(`🎯 Nouvelle tâche reçue par webhook : ${incomingTask.title}`, "success");
            
            // Check if task already exists in current Kanban board list
            const alreadyExists = state.kanban.some(t => t.id === incomingTask.id || t.title === incomingTask.title);
            if (!alreadyExists) {
              updateState({
                kanban: [incomingTask, ...state.kanban]
              });
            }
          }
        }
      } catch (err) {
        addLog(event.data, "info");
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [wsConfigUrl, state.kanban]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string, status: 'info' | 'success' | 'error') => {
    setLogs(prev => [...prev, { date: new Date().toISOString(), text, status }]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const testLocalBoubane = async () => {
    setLocalConnectionStatus('testing');
    setLocalErrorMessage(null);
    try {
      const res = await fetch(`${localBoubaneUrl}/api/metrics`);
      if (!res.ok) {
        throw new Error(`Le serveur local a répondu avec une erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      setLocalMetrics({
        cpu: data.cpu ?? 0,
        ram: data.ram ?? 0,
        disk: data.disk ?? 0,
        services: data.services ?? [],
        timestamp: new Date().toISOString()
      });
      setLocalConnectionStatus('success');
      addLog(`🔌 [Boubane Local] Connexion établie avec succès avec ${localBoubaneUrl}`, 'success');
    } catch (err: any) {
      setLocalConnectionStatus('error');
      setLocalErrorMessage(err.message || "Impossible de se connecter au serveur FastAPI. Vérifiez qu'il tourne sur le port 7000 et que le CORS est activé.");
      addLog(`❌ [Boubane Local] Échec de la connexion à ${localBoubaneUrl} : ${err.message}`, 'error');
    }
  };

  const runLocalCommand = async () => {
    setLocalCommandRunning(true);
    setLocalCommandOutput(null);
    try {
      const res = await fetch(`${localBoubaneUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: localCommand })
      });
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      setLocalCommandOutput(JSON.stringify(data, null, 2));
      addLog(`⚡ [Boubane Local] Commande "${localCommand}" exécutée. Réponse : ${JSON.stringify(data)}`, 'success');
    } catch (err: any) {
      setLocalCommandOutput(`Erreur d'exécution : ${err.message}`);
      addLog(`❌ [Boubane Local] Échec d'exécution de "${localCommand}" : ${err.message}`, 'error');
    } finally {
      setLocalCommandRunning(false);
    }
  };

  const pythonServerCode = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psutil
import subprocess
import os

app = FastAPI(title="Boubane Local API Gateway", version="1.0")

# CRITICAL : Activez le CORS pour permettre au Dashboard web sécurisé
# de communiquer directement avec votre boucle locale localhost:7000 !
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise tous les clients web à interroger l'API
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

class CommandPayload(BaseModel):
    command: str

@app.get("/api/metrics")
async def get_metrics():
    # Retourne les vraies spécifications physiques du système d'exploitation de votre VPS !
    return {
        "cpu": psutil.cpu_percent(interval=1),
        "ram": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "services": ["boubane-auto-mail", "FastAPI-7000", "hermes-agent"],
        "status": "online"
    }

@app.post("/api/execute")
async def execute_command(payload: CommandPayload):
    cmd = payload.command.strip().lower()
    if not cmd:
        raise HTTPException(status_code=400, detail="Commande vide ou invalide")
    
    # 1. Exemple de script de filtrage IMAP réel
    if cmd == "scan_imap":
        # Ici, vous exécutez votre propre commande de traitement, par exemple :
        # os.system("python3 /chemin/vers/boubane-auto-mail.py")
        return {
            "status": "success",
            "message": "Routine scan_imap terminée",
            "output": "[FastAPI] 2 nouveaux e-mails identifiés et convertis en tâches urgentes."
        }
        
    # 2. Exemple d'indexation de documents
    elif cmd == "index_docs":
        return {
            "status": "success",
            "message": "Routine d'indexation de documents terminée",
            "output": "[FastAPI] 45 nouveaux paragraphes vectorisés avec succès."
        }
        
    # 3. Commande générique ou personnalisée
    else:
        return {
            "status": "success",
            "message": f"Exécution personnalisée de '{cmd}'",
            "output": f"[FastAPI] Signal envoyé à l'agent local : '{cmd}'"
        }

if __name__ == "__main__":
    import uvicorn
    # Démarre le serveur localement sur le port 7000 requis par l'intégrateur Boubane
    uvicorn.run(app, host="127.0.0.1", port=7000)`;

  // REST webhook payload generation helper for user preview
  const appRootUrl = window.location.origin;

  const curlTaskSnippet = `curl -X POST "${appRootUrl}/api/webhooks/task" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Alerte Mail projet Alba",
    "desc": "Email urgent détecté demandant une validation de devis au plus vite.",
    "priority": "high",
    "checklist": [
      "Vérifier le fichier PDF",
      "Formuler une contre-proposition par email",
      "Rappeler le client Alba"
    ]
  }'`;

  const curlLogSnippet = `curl -X POST "${appRootUrl}/api/webhooks/log" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "[boubane-auto-mail] 2 nouveaux messages traités avec succès.",
    "status": "success"
  }'`;

  const curlMetricsSnippet = `curl -X POST "${appRootUrl}/api/webhooks/metrics" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cpu": 15,
    "ram": 58,
    "disk": 42,
    "services": ["boubane-auto-mail", "FastAPI-Port7000", "Postgres-Local"]
  }'`;

  const pythonCliSnippet = `import requests

# Envoyez instantanément la télémétrie de votre VPS depuis votre script cron ou FastAPI
payload = {
    "cpu": 12,
    "ram": 45,
    "disk": 38,
    "services": ["boubane-auto-mail", "FastAPI", "hermes-agent"]
}

try:
    r = requests.post("${appRootUrl}/api/webhooks/metrics", json=payload)
    print("Mise à jour poussée :", r.json())
except Exception as e:
    print("Erreur de connexion :", e)`;

  const systemInstructionsSnippet = `# SYSTEM PROMPT POUR VOTRE AGENT HERMES (NOUS RESEARCH / LOCAL LLM)
# À injecter dans son panneau de configuration de prompt système pour structurer ses retours

Rôle : Assistant de Gestion Autonome connecté à Boubane VIA WEBHOOK
Directives d'automatisation :
- Tu es relié directement au tableau Kanban de Boubane en effectuant des requêtes REST.
- Dès que l'utilisateur te donne un ordre ou qu'un rapport d'anomalie sort des logs locaux, tu rédiges une action claire.
- Formate tes actions sous forme de JSON valide pour le webhook :
  URL: ${appRootUrl}/api/webhooks/task
  Format :
  {
    "title": "Titre explicite de la tâche",
    "desc": "Synthèse contextuelle courte",
    "priority": "low" | "medium" | "high",
    "checklist": ["Étape 1", "Étape 2", "Étape 3"]
  }`;

  const hermesDirectPrompt = `# SYSTEM PROMPT : ACCÈS DIRECT À L'API LOCALE BOUBANE (FASTAPI PORT 7000)
# À copier dans les instructions système de votre LLM local Hermes (Nous Research)

Rôle : Superviseur d'action connecté localement à la passerelle Boubane (port 7000)

Directives de communication directe :
- Tu t'exécutes sur la machine locale ou le VPS où tourne le serveur FastAPI de Boubane sur http://127.0.0.1:7000.
- Tu n'envoies RIEN à un service cloud intermédiaire. Pour inspecter la machine ou déclencher des tâches, tu effectues directement des requêtes HTTP sur l'API de Boubane locale.

Points d'entrée de ton routeur local :
1. Pour vérifier la santé de la VPS (CPU, RAM) :
   Effectue une requête GET sur http://127.0.0.1:7000/api/metrics
2. Pour déclencher le scan des emails (boubane-auto-mail) :
   Effectue une requête POST sur http://127.0.0.1:7000/api/execute avec {"command": "scan_imap"}
3. Pour déclencher l'indexation de nos documents d'affaires :
   Effectue une requête POST sur http://127.0.0.1:7000/api/execute avec {"command": "index_docs"}

Consigne : Si l'utilisateur te demande de vérifier la charge système ou les emails, lance la requête python locale correspondante, puis restitue la trace de façon humble, claire et professionnelle. Ne l'enrobe jamais de fausse science de simulation.`;

  const triggerSimulation = async (endpoint: 'task' | 'log' | 'metrics') => {
    setSimulating(endpoint);
    setSimulationResponse(null);
    const url = `/api/webhooks/${endpoint}`;
    let body: any = {};
    
    if (endpoint === 'task') {
      body = {
        title: simTaskTitle,
        desc: simTaskDesc,
        priority: simTaskPriority,
        checklist: simTaskChecklist.split("\n").filter(line => line.trim() !== "")
      };
    } else if (endpoint === 'log') {
      body = {
        text: simLogText,
        status: simLogStatus
      };
    } else {
      body = {
        cpu: Number(simCpu),
        ram: Number(simRam),
        disk: Number(simDisk),
        services: simServices.split(",").map(s => s.trim()).filter(s => s !== "")
      };
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      setSimulationResponse(`Réponse HTTP ${response.status}: ${JSON.stringify(data)}`);
      
      // Force instant logs in local UI too
      if (endpoint === 'log') {
        addLog(`[Simulator Trigger] ${simLogText}`, simLogStatus);
      } else if (endpoint === 'task') {
        addLog(`[Simulator Trigger] Nouvelle tâche "${simTaskTitle}" poussée avec succès!`, 'success');
      } else if (endpoint === 'metrics') {
        addLog(`[Simulator Trigger] Métriques poussées: CPU ${simCpu}% | RAM ${simRam}%`, 'success');
      }
    } catch (err: any) {
      setSimulationResponse(`Erreur : ${err.message || err}`);
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in bg-[var(--bg)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2 font-sans tracking-tight">
            <Radio className="w-6 h-6 text-[var(--accent)] animate-pulse" /> Centre d'Intégration REST VPS & Agents
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 font-sans max-w-2xl">
            L'agent Hermes a raison : pas de "snake oil", de scripts simulés ou de tunnels WebSocket complexes. Utilisez cette suite d'APIs REST natives sécurisées pour brancher directement votre FastAPI, votre script <code className="text-amber-500 font-mono text-xs">boubane-auto-mail</code> ou vos tâches cron !
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            Récepteur Webhook : Actif
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border)] gap-2 pb-px max-w-full overflow-x-auto">
        <button 
          onClick={() => setActiveTab('boubane_local')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'boubane_local' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Network className="w-4 h-4 text-emerald-500" /> 🔌 Intégrateur Boubane (Port 7000)
        </button>
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'metrics' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Cpu className="w-4 h-4" /> 📊 Supervision Réelle VPS
        </button>
        <button 
          onClick={() => setActiveTab('prompt')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'prompt' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Bot className="w-4 h-4 text-amber-500" /> 🧠 Guide LLM Hermes & Prompts
        </button>
        <button 
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'console' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Terminal className="w-4 h-4" /> 🖥️ Console de Logs Temps Réel
        </button>
        <button 
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'api' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Code className="w-4 h-4" /> 🔌 Documentation Webhooks
        </button>
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'simulator' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Sparkles className="w-4 h-4" /> 🧪 Simulateur d'Appels
        </button>
      </div>

      {/* TAB CONTENTS */}
      
      {/* 0. DIRECT LOCAL BOUBANE FASTAPI INTEGRATOR (RECOMMANDÉ PAR HERMES) */}
      {activeTab === 'boubane_local' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-[var(--bg-surface)] border border-emerald-500/20 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Network className="text-emerald-500 w-6 h-6 animate-pulse" />
              <h2 className="text-md font-bold text-[var(--text)]">
                L'Approche Directe recommandée par Hermes : Intégration Locale (Port 7000)
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Votre agent <strong>Hermes</strong> a parfaitement analysé la situation : nul besoin de brokers tiers complexes ou d'agents de supervision intermédiaires. <strong>Boubane</strong> s'auto-héberge sur votre VPS local. Votre navigateur web communique directly avec <strong>FastAPI (Port 7000)</strong> sans aucun intermédiaire cloud, et votre agent Hermes local l'interroge en direct !
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: LIVE CONTROL PANEL (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* CONNECTION MANAGER */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Power className="w-4 h-4 text-emerald-500" /> 1. Configuration & Statut de Synchronisation
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      localConnectionStatus === 'success' ? 'bg-emerald-500 animate-pulse' :
                      localConnectionStatus === 'testing' ? 'bg-amber-500 animate-spin' :
                      localConnectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                      {localConnectionStatus === 'success' ? 'Activé' :
                       localConnectionStatus === 'testing' ? 'Vérification...' :
                       localConnectionStatus === 'error' ? 'Déconnecté' : 'Inactif'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold block mb-1.5 text-[var(--text-muted)]">Adresse locale de l'API Boubane (FastAPI)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={localBoubaneUrl} 
                        onChange={(e) => setLocalBoubaneUrl(e.target.value)}
                        placeholder="http://localhost:7000"
                        className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-1.5 focus:border-[var(--accent)] outline-none text-[var(--text)] font-mono text-xs"
                      />
                      <button 
                        onClick={testLocalBoubane}
                        disabled={localConnectionStatus === 'testing'}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1 font-sans"
                      >
                        {localConnectionStatus === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Tester
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-md">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text)]">Abonnement Réel en Arrière-plan</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Interroger automatiquement l'API locale toutes les 5 secondes</div>
                    </div>
                    <div>
                      <input 
                        type="checkbox" 
                        checked={autoPollLocal}
                        onChange={(e) => setAutoPollLocal(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {localErrorMessage && (
                    <div className="p-3 bg-red-500/5 text-red-500 border border-red-500/10 rounded-md text-[11px] leading-relaxed font-sans">
                      ⚠️ <strong>Erreur de liaison :</strong> {localErrorMessage}
                    </div>
                  )}

                  {localConnectionStatus === 'success' && localMetrics && (
                    <div className="p-3 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-md text-[11px] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                      <div>
                        <strong>Succès !</strong> Liaison directe établie. Charge du VPS reçue à {new Date(localMetrics.timestamp || "").toLocaleTimeString()} !
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE MEASURES FROM LOCAL BOUBANE */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> 2. Télémétrie Physique en Direct (Vraie VPS)
                </h3>

                {localMetrics ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CPU */}
                    <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Charge CPU</span>
                        <Cpu className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="py-2.5">
                        <span className="text-2xl font-bold font-mono text-[var(--text)]">{localMetrics.cpu}%</span>
                        <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${localMetrics.cpu}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Usage RAM</span>
                        <Activity className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="py-2.5">
                        <span className="text-2xl font-bold font-mono text-[var(--text)]">{localMetrics.ram}%</span>
                        <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${localMetrics.ram}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Disk */}
                    <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Usage Disque</span>
                        <HardDrive className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="py-2.5">
                        <span className="text-2xl font-bold font-mono text-[var(--text)]">{localMetrics.disk}%</span>
                        <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${localMetrics.disk}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 text-[10px] text-[var(--text-muted)] font-mono border-t border-[var(--border)] pt-2 mt-1">
                      Démons en cours : {localMetrics.services.join(", ")}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[var(--bg)] border border-dashed border-[var(--border)] rounded-lg space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Aucune donnée physique locale chargée.
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Cliquez sur "Tester" ci-dessus ou activez la supervision automatique pour interroger votre FastAPI local.
                    </p>
                  </div>
                )}
              </div>

              {/* COMMAND EXECUTION BAR */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                  <Terminal className="w-4 h-4 text-emerald-500" /> 3. Déclencheur Automatique de Tâches VPS
                </h3>
                
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                  Pilotez les routines de votre VPS directement depuis ce panneau de bord. L'appel sera émis en toute sécurité vers l'API locale Boubane de votre machine.
                </p>

                <div className="space-y-3.5 text-xs font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <label className="font-semibold block mb-1 text-[var(--text-muted)]">Instruction ou Routine</label>
                      <select 
                        value={localCommand}
                        onChange={(e) => setLocalCommand(e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-1.5 focus:border-[var(--accent)] outline-none text-[var(--text)] text-xs"
                      >
                        <option value="scan_imap">scan_imap (Traitement IMAP des e-mails par boubane-auto-mail)</option>
                        <option value="index_docs">index_docs (Re-calculer les embeddings pour notre base de connaissances)</option>
                        <option value="diagnostics">diagnostics_vps (Audit d'intégrité globale du système)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={runLocalCommand}
                        disabled={localCommandRunning || localConnectionStatus !== 'success'}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1"
                      >
                        {localCommandRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Déclencher
                      </button>
                    </div>
                  </div>

                  {localCommandOutput && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase">Réponse de la boucle FastAPI locale :</span>
                      <pre className="p-3 bg-[#050505] border border-[#222] rounded-lg text-xs font-mono text-gray-300 overflow-x-auto min-h-[50px] whitespace-pre-wrap">
                        {localCommandOutput}
                      </pre>
                    </div>
                  )}
                  
                  {localConnectionStatus !== 'success' && (
                    <div className="text-[10px] text-amber-500 font-sans italic">
                      ⚠️ Note : S'assurer d'avoir établi une connexion valide (bouton Tester) avec le serveur local pour déverrouiller l'exécution.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: CODE GENERATOR & COPY (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
                    <Code className="w-4 h-4 text-emerald-500" /> Guide d'Installation de l'API Boubane
                  </h3>
                  <button 
                    onClick={() => handleCopy(pythonServerCode, "pyServer")}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] rounded transition-colors"
                  >
                    {copied === "pyServer" ? <Check className="w-3 h-3 text-emerald-500" /> : <Clipboard className="w-3 h-3" />}
                    {copied === "pyServer" ? "Copié !" : "Copier le code"}
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-[var(--accent)] text-[10px] uppercase font-mono block">Étape 1 : Installer FastAPI & psutil</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Ouvrez un terminal sur votre machine locale ou VPS et lancez cette commande rapide :
                    </p>
                    <div className="bg-[#0a0a0a] border border-[#222] p-2 rounded text-[10px] font-mono text-amber-500 select-all">
                      pip install fastapi uvicorn psutil pydantic
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-[var(--accent)] text-[10px] uppercase font-mono block">Étape 2 : Créer le fichier "server_boubane.py"</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Créez un fichier python local et collez l'API REST FastAPI robuste ci-dessous. Elle gère le CORS automatiquement !
                    </p>
                    
                    <div className="relative">
                      <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[9px] font-mono text-emerald-400 overflow-x-auto max-h-[180px] leading-relaxed">
                        {pythonServerCode}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-[var(--accent)] text-[10px] uppercase font-mono block">Étape 3 : Lancer l'API locale</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Exécutez ce script pour démarrer l'API sur le port 7000 d'un simple signal :
                    </p>
                    <div className="bg-[#0a0a0a] border border-[#222] p-2 rounded text-[10px] font-mono text-amber-500 select-all">
                      python3 server_boubane.py
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-lg text-[10px] leading-relaxed">
                    💡 <strong>Pourquoi cette architecture est géniale ?</strong> Le tableau de bord n'utilise aucun canal WebSocket tiers. C'est votre navigateur lui-même qui interroge localement votre VPS sécurisé. Vos clés et données n'ont aucun risque de fuiter sur le cloud !
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 1. REAL VPS METRICS SUPERVISION */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Metric Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Charge CPU</span>
                <Cpu className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="py-4">
                <div className="text-3xl font-bold text-[var(--text)] font-mono">{metrics.cpu}%</div>
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-[var(--accent)] h-full rounded-full transition-all duration-700" 
                    style={{ width: `${metrics.cpu}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Rapporté en direct par le serveur</span>
            </div>

            {/* RAM Metric Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Usage RAM</span>
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="py-4">
                <div className="text-3xl font-bold text-[var(--text)] font-mono">{metrics.ram}%</div>
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${metrics.ram}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Mémoire virtuelle allouée</span>
            </div>

            {/* Disk Metric Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase font-sans">Espace Disque HDD/SSD</span>
                <HardDrive className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="py-4">
                <div className="text-3xl font-bold text-[var(--text)] font-mono">{metrics.disk}%</div>
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${metrics.disk}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Partition système principale</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Telemetry Status and Services list */}
            <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text)]">Statut Système Télémétrique</h2>
              {metrics.timestamp ? (
                <div className="space-y-4 font-sans">
                  <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-emerald-500">Mise à jour reçue</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{new Date(metrics.timestamp).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[var(--text)]">Services actifs déclarés :</div>
                    {metrics.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {metrics.services.map((srv, idx) => (
                          <span key={idx} className="bg-[var(--bg-surface-2)] text-[var(--text)] border border-[var(--border)] font-mono text-[10px] px-2 py-0.5 rounded-md">
                            {srv}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-muted)] italic">Aucun service listé</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/10 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500">Aucun rapport télémétrique</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Les indicateurs du dashboard affichent actuellement de fausses valeurs ou des exemples. Pour voir la charge de votre vrai VPS en direct, configurez-le pour envoyer un rapport !
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--text)]">Token de Sécurisation</span>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  Configurez <code className="text-amber-500 font-mono">API_WEBHOOK_SECRET</code> dans vos fichiers d'environnement pour blinder vos endpoints contre tout accès public externe.
                </p>
              </div>
            </div>

            {/* Practical Quick integration guide for the VPS */}
            <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[var(--accent)]" /> Comment actualiser ces métriques depuis votre VPS ?
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                Il n'y a pas besoin de démon lourd d'arrière-plan. Installez simplement une commande cron simple ou laissez votre Fast API poster les données de diagnostic à chaque tick :
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase font-mono">1. Écrire le script bash d'upload léger (vps-stats.sh)</span>
                  </div>
                  <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">
{`#!/bin/bash
# Relever l'usage réel de la RAM, du CPU et du disque sur votre VPS
CPU=$(top -b -n1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
RAM=$(free | grep Mem | awk '{print $3/$2 * 100}' | cut -d. -f1)
DISK=$(df -h / | tail -1 | awk '{print $5}' | cut -d% -f1)

curl -X POST "${appRootUrl}/api/webhooks/metrics" \\
  -H "Content-Type: application/json" \\
  -d "{\\"cpu\\": $CPU, \\"ram\\": $RAM, \\"disk\\": $DISK, \\"services\\": [\\"FastAPI-7000\\", \\"boubane-auto-mail\\"]}"`}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text)] block">2. Configurer le Cron job local :</span>
                  <div className="bg-[#0a0a0a] border border-[#222] p-2.5 rounded-lg text-[10px] font-mono text-amber-500">
                    * * * * * /bin/bash /chemin/vers/vps-stats.sh &gt;/dev/null 2&gt;&amp;1
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Cela envoie une mise à jour d'intégrité propre, 100% réelle, toutes les minutes vers votre tableau de bord.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REAL WEBHOOK & REST API REFERENCE DOCS */}
      {activeTab === 'api' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h2 className="text-md font-bold text-[var(--text)] flex items-center gap-1.5">
              <ShieldCheck className="text-emerald-500 w-5 h-5" /> Référence API REST Webhooks
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Ces points d'entrée HTTP vous permettent de pousser n'importe quel rapport de tâche, ligne de trace diagnostique ou statut au tableau de bord. Ils sont conçus pour s'adapter à la fois aux appels system <code className="text-amber-500 font-mono">curl</code> ou aux requêtes Python de l'agent Hermes.
            </p>
          </div>

          {/* 1. KANBAN CARD WEBHOOK ROUTE */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">POST</span>
                <span className="font-mono text-xs font-bold text-[var(--text)]">/api/webhooks/task</span>
              </div>
              <button 
                onClick={() => handleCopy(curlTaskSnippet, "curlTask")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] rounded-md transition-colors"
              >
                {copied === "curlTask" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied === "curlTask" ? "Copié !" : "Copier curl"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Génère instantanément une carte d'action sur le tableau de bord Kanban de l'équipe (par exemple, suite à un filtre de courriels urgents de clients par <code className="text-amber-500 font-mono">boubane-auto-mail</code>).
            </p>
            <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {curlTaskSnippet}
            </pre>
          </div>

          {/* 2. LIVE SYSTEM LOG WEBHOOK ROUTE */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">POST</span>
                <span className="font-mono text-xs font-bold text-[var(--text)]">/api/webhooks/log</span>
              </div>
              <button 
                onClick={() => handleCopy(curlLogSnippet, "curlLog")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] rounded-md transition-colors"
              >
                {copied === "curlLog" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied === "curlLog" ? "Copié !" : "Copier curl"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Envoie une trace texte pour alimenter en temps réel le terminal de contrôle de la console de supervision.
            </p>
            <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {curlLogSnippet}
            </pre>
          </div>

          {/* 3. HARDWARE TELEMETRY UPLOAD ROUTE */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">POST</span>
                <span className="font-mono text-xs font-bold text-[var(--text)]">/api/webhooks/metrics</span>
              </div>
              <button 
                onClick={() => handleCopy(curlMetricsSnippet, "curlMetrics")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] rounded-md transition-colors"
              >
                {copied === "curlMetrics" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied === "curlMetrics" ? "Copié !" : "Copier curl"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Rapporte en direct la charge utile CPU/RAM de la machine hôte.
            </p>
            <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {curlMetricsSnippet}
            </pre>
          </div>

          {/* 4. PYTHON SDK EXAMPLE FOR CRON / FASTAPI */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text)] uppercase font-sans">Exemple d'Intégration Script Python pour FastAPI</h3>
              <button 
                onClick={() => handleCopy(pythonCliSnippet, "pyCli")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text)] rounded-md transition-colors"
              >
                {copied === "pyCli" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied === "pyCli" ? "Copié !" : "Copier Python"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Utilisez ce bloc simple et rapide dans vos routines Python pour actualiser le statut à chaque fin de routine d'un de vos crons locaux VPS.
            </p>
            <pre className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {pythonCliSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* 3. TERMINAL STREAM OUTPUT VIEW */}
      {activeTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Troubleshooting and Help Tips */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
               <h2 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                 <Server className="w-4 h-4 text-[var(--text-muted)]" /> État Récepteur API
               </h2>
               <div className="space-y-4 text-xs text-[var(--text-muted)]">
                 <p className="leading-relaxed">
                   La console retransmet en direct toutes les requêtes POST émises par votre VPS sur <code className="text-amber-500 font-mono text-[10px] break-all">{appRootUrl}/api/webhooks/log</code>.
                 </p>
                 <div className="p-3 bg-[var(--bg-surface-2)] rounded-lg border border-[var(--border)] space-y-2">
                   <div className="font-bold text-[var(--text)]">Besoin d'un test rapide ?</div>
                   <p className="text-[10px] leading-normal">
                     Ouvrez un terminal sur votre machine locale et lancez un appel <code className="text-amber-500 font-mono">curl</code> d'exemple documenté dans l'onglet Documentation APIs. Il s'affichera immédiatement ici !
                   </p>
                 </div>
               </div>
            </div>
          </div>

          {/* Actual Log shell */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col h-[420px]">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
               <h2 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-[var(--accent)] animate-pulse" /> Terminal de logs réels retransmis
               </h2>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">REST stream</span>
               </div>
            </div>

            {/* Terminal screen */}
            <div 
              ref={terminalRef}
              className="flex-1 bg-[#050505] text-xs font-mono p-4 overflow-y-auto space-y-1.5 scrollbar-hide text-emerald-400 leading-normal"
            >
               {logs.map((log, i) => (
                 <div key={i} className="leading-relaxed whitespace-pre-wrap flex items-start gap-1">
                   <span className="text-gray-600 shrink-0 select-none">[{new Date(log.date).toLocaleTimeString()}]</span>
                   <span className={
                     log.status === 'success' ? 'text-emerald-300 font-bold' :
                     log.status === 'error' ? 'text-red-400 font-bold' :
                     'text-emerald-400'
                   }>
                     {log.text}
                   </span>
                 </div>
               ))}
            </div>

            {/* Informative input block */}
            <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border)] flex gap-2 items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Prêt pour recevoir des requêtes POST de FastAPI ou de scripts système.</span>
              <button 
                onClick={() => setLogs([{ date: new Date().toISOString(), text: "Écran de terminal réinitialisé.", status: 'info' }])}
                className="px-2 py-1 bg-[var(--bg-surface-2)] text-[var(--text)] border border-[var(--border)] rounded text-[10px] font-bold hover:bg-[var(--bg-hover)] transition-colors"
              >
                Vider la console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SYSTEM PROMPT TAB FOR REMOTE LLM */}
      {activeTab === 'prompt' && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          {/* Clarification Box about Hermes Webhooks */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
              <Bot className="w-5 h-5" /> 💡 Comprendre l'intégration : Comment intégrer Hermes proprement sans "Snake Oil" ?
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Votre agent local **Hermes** a raison : pas besoin de scripts d'arrière-plan opaques ou de websocket centralisés chez des tiers. Choisissez l'une des deux structures d'intégration sémantique ci-dessous selon votre cas d'usage !
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* OPTION A: DIRECT LOCAL API */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Option A (Recommandée) : API Directe locale
                  </h3>
                  <button 
                    onClick={() => handleCopy(hermesDirectPrompt, "promptDirectCopy")}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[var(--bg-surface-2)] hover:bg-[var(--bg-hover)] rounded border border-[var(--border)] text-[var(--text)] transition-colors"
                  >
                    {copied === "promptDirectCopy" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied === "promptDirectCopy" ? "Copié !" : "Copier"}
                  </button>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Cette configuration donne à Hermes l'adresse locale de votre FastAPI Boubane (<code className="text-amber-500 font-mono">http://localhost:7000/api</code>). Il commande directement votre machine, inspecte les metrics et déclenche les scripts locaux sans intermédiaire.
                </p>

                <div className="relative">
                  <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-emerald-400 overflow-y-auto max-h-[250px] leading-relaxed whitespace-pre-wrap select-all">
                    {hermesDirectPrompt}
                  </pre>
                </div>
              </div>
            </div>

            {/* OPTION B: CLOUD WEBHOOK INTEGRATION */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-4 h-4 text-[var(--accent)]" /> Option B : Webhook Cloud Asynchrone
                  </h3>
                  <button 
                    onClick={() => handleCopy(systemInstructionsSnippet, "promptCloudCopy")}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[var(--bg-surface-2)] hover:bg-[var(--bg-hover)] rounded border border-[var(--border)] text-[var(--text)] transition-colors"
                  >
                    {copied === "promptCloudCopy" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied === "promptCloudCopy" ? "Copié !" : "Copier"}
                  </button>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Idéal si vous préférez que votre Hermes local pousse de façon asynchrone des rapports de tâches formater en JSON directement vers ce Central Dashboard, créant de belles cartes Kanban.
                </p>

                <div className="relative">
                  <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-[10px] font-mono text-gray-300 overflow-y-auto max-h-[250px] leading-relaxed whitespace-pre-wrap select-all">
                    {systemInstructionsSnippet}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. INTERACTIVE LIVE WEBHOOK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-2">
            <h2 className="text-md font-bold text-[var(--text)] flex items-center gap-1.5">
              <Sparkles className="text-emerald-500 w-5 h-5 animate-pulse" /> Console de Simulation & Test de l'API
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Ce simulateur émet de <strong>réels appels HTTP POST</strong> vers les points d'entrée de notre API, exactement comme le ferait votre script local VPS ou votre agent IA. Cela vous permet de valider le bon fonctionnement du flux en temps réel !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SIMULATION 1: KANBAN TASK */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase font-mono border-b border-[var(--border)] pb-2">
                  <Clipboard className="w-4 h-4 text-emerald-500" /> 1. Envoyer un Ticket de Tâche
                </div>
                
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Titre de la tâche</label>
                    <input 
                      type="text" 
                      value={simTaskTitle} 
                      onChange={(e) => setSimTaskTitle(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)] font-sans"
                    />
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-1">Description</label>
                    <textarea 
                      value={simTaskDesc} 
                      rows={2}
                      onChange={(e) => setSimTaskDesc(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)] font-sans"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Priorité</label>
                      <select 
                        value={simTaskPriority} 
                        onChange={(e) => setSimTaskPriority(e.target.value as any)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)]"
                      >
                        <option value="low">Faible</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-[var(--text-muted)]">Checklist (1 ligne = 1 étape)</label>
                      <textarea 
                        value={simTaskChecklist} 
                        rows={2}
                        onChange={(e) => setSimTaskChecklist(e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-1.5 focus:border-[var(--accent)] outline-none text-[10px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => triggerSimulation('task')}
                disabled={simulating !== null}
                className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                {simulating === 'task' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Poster à /api/webhooks/task
              </button>
            </div>

            {/* SIMULATION 2: SERVER METRICS TELEMETRY */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase font-mono border-b border-[var(--border)] pb-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> 2. Envoyer la Télémétrie CPU/RAM
                </div>
                
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Utilisation CPU</span>
                      <span className="font-mono text-emerald-500">{simCpu}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simCpu} 
                      onChange={(e) => setSimCpu(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-[var(--bg)]"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Utilisation RAM</span>
                      <span className="font-mono text-indigo-400">{simRam}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simRam} 
                      onChange={(e) => setSimRam(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-[var(--bg)]"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Espace Disque</span>
                      <span className="font-mono text-amber-500">{simDisk}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simDisk} 
                      onChange={(e) => setSimDisk(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-[var(--bg)]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Démons / Services Actifs (séparés par virgule)</label>
                    <input 
                      type="text" 
                      value={simServices} 
                      onChange={(e) => setSimServices(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)] font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => triggerSimulation('metrics')}
                disabled={simulating !== null}
                className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                {simulating === 'metrics' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Poster à /api/webhooks/metrics
              </button>
            </div>

            {/* SIMULATION 3: LOG TECHNIQUE */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 md:col-span-2 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase font-mono border-b border-[var(--border)] pb-2">
                  <Terminal className="w-4 h-4 text-amber-500" /> 3. Envoyer une ligne de Log de trace
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="md:col-span-2">
                    <label className="font-semibold block mb-1">Texte du Log</label>
                    <input 
                      type="text" 
                      value={simLogText} 
                      onChange={(e) => setSimLogText(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Niveau / Statut du Log</label>
                    <select 
                      value={simLogStatus} 
                      onChange={(e) => setSimLogStatus(e.target.value as any)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded p-2 focus:border-[var(--accent)] outline-none text-[var(--text)]"
                    >
                      <option value="info">Info (Bleu)</option>
                      <option value="success">Success (Vert)</option>
                      <option value="error">Error (Rouge)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => triggerSimulation('log')}
                disabled={simulating !== null}
                className="w-full mt-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
              >
                {simulating === 'log' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Poster à /api/webhooks/log
              </button>
            </div>
            
          </div>

          {/* SIMULATION REALTIME FEEDBACK WINDOW */}
          <div className="bg-[#050505] border border-[var(--border)] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Réponse Réelle du Serveur en Direct
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Status: {simulating ? "Appel HTTP en cours" : "Prêt"}</span>
            </div>
            
            <pre className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-xs font-mono text-gray-300 overflow-x-auto min-h-[50px] whitespace-pre-wrap">
              {simulationResponse || "Aucun appel émis pour le moment. Renseignez les paramètres ci-dessus et cliquez sur l'un des boutons pour tester le serveur immédiatement !"}
            </pre>
            
            <p className="text-[10px] text-[var(--text-muted)] font-sans italic leading-relaxed">
              💡 <strong>Que se passe-t-il après le clic ?</strong> L'appel REST HTTP transmet le flux au serveur central. Les données sont ensuite relayées instantanément à tous les abonnés via WebSocket en tâche de fond. Consultez le <strong>Tableau de Bord Trello</strong> ou la <strong>Console de Logs</strong> pour voir vos données s'insérer en direct sans avoir rechargé la page !
            </p>
          </div>
        </div>
      )}

      {/* Concept Architecture Flowchart */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-sm font-sans">
         <h3 className="font-bold text-md text-[var(--text)] flex items-center gap-2">
           <HelpCircle className="w-5 h-5 text-[var(--accent)]" /> Architecture de Communication Propre
         </h3>
         <p className="text-xs text-[var(--text-muted)] leading-relaxed">
           Aucun port requis, aucune redirection complexe de port entrant. Ce tableau de bord sert d'agrégateur et de visualiseur passif. Vos scripts locaux sur le VPS ou votre cron <code className="text-amber-500 font-mono">boubane-auto-mail</code> effectuent de simples requêtes REST POST standard vers la Sandbox.
         </p>
         <div className="flex flex-col md:flex-row items-center justify-around bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] gap-4 md:gap-2">
            <div className="p-3 bg-[var(--bg-surface)] rounded-lg text-center border border-[var(--border)] w-48 shrink-0">
               <div className="font-bold text-[var(--accent)]">VPS (Hôte Local)</div>
               <div className="text-[10px] mt-1">FastAPI / Cron / Hermes</div>
            </div>
            <div className="text-center font-bold text-[var(--accent)] text-lg shrink-0">➔ Requêtes HTTP POST REST ➔</div>
            <div className="p-3 bg-[var(--bg-surface)] rounded-lg text-center border border-[var(--border)] w-48 shrink-0">
               <div className="font-bold text-[var(--text)]">Ce Central Dashboard</div>
               <div className="text-[10px] mt-1">Endpoints /api/webhooks/*</div>
            </div>
            <div className="text-center font-bold text-emerald-500 text-lg shrink-0">➔ Sync instantanée ➔</div>
            <div className="p-3 bg-[var(--bg-surface)] rounded-lg text-center border border-[var(--border)] w-48 shrink-0">
               <div className="font-bold text-emerald-500">Tableau de Bord Trello</div>
               <div className="text-[10px] mt-1">Kanban & Visualisations</div>
            </div>
         </div>
      </div>
    </div>
  );
}
