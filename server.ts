import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for live telemetry coming from raw VPS webhook posts (no simulation loops)
  let latestMetrics = {
    cpu: 0,
    ram: 0,
    disk: 0,
    services: [] as string[],
    timestamp: null as string | null
  };

  // Helper middleware to verify custom security secret if set by the user
  function verifyWebhookSecret(req: express.Request, res: express.Response, next: express.NextFunction) {
    const requiredSecret = process.env.API_WEBHOOK_SECRET;
    // Only enforce if the secret is explicitly configured and is not the default env setup token
    if (!requiredSecret || requiredSecret === "change_me_to_a_secure_token" || requiredSecret.trim() === "") {
      return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autorisation requise : jeton Bearer manquant dans l'en-tête Authorization." });
    }
    const token = authHeader.substring(7).trim();
    if (token !== requiredSecret.trim()) {
      return res.status(403).json({ error: "Accès refusé : Jeton d'autorisation invalide." });
    }
    next();
  }

  // ==========================================
  // REAL-TIME REST WEBHOOK ENDPOINTS (COMPLIANT WITH HERMES / FastAPIs)
  // ==========================================

  // 1. Webhook to add real Kanban tickets from standard curl / Python requests
  app.post("/api/webhooks/task", verifyWebhookSecret, (req, res) => {
    const { title, desc, priority, checklist, assignedTo, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Le champ 'title' est obligatoire." });
    }

    const task = {
      id: "task-" + Date.now(),
      title,
      desc: desc || "",
      column: "todo",
      priority: priority || "medium",
      origin: "VPS Webhook",
      checklist: Array.isArray(checklist) 
        ? checklist.map((item, idx) => typeof item === "string" ? { id: `c-${idx}-${Date.now()}`, text: item, done: false } : item)
        : [],
      assignedTo: assignedTo || "",
      dueDate: dueDate || ""
    };

    // Broadcast the task as JSON payload to all connected frontend clients
    const payload = JSON.stringify({
      type: "task_alert",
      task
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    console.log(`🎯 Real webhook task received & broadcast: ${title}`);
    return res.json({ 
      success: true, 
      message: "Tâche poussée instantanément sur le tableau de bord web.", 
      task 
    });
  });

  // 2. Webhook to stream active bash logs from cron jobs (like boubane-auto-mail) or python logs
  app.post("/api/webhooks/log", verifyWebhookSecret, (req, res) => {
    const { text, status } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Le champ 'text' est obligatoire." });
    }
    
    const logStatus = status === "success" || status === "error" || status === "info" ? status : "info";
    broadcastLog(text, logStatus);
    
    console.log(`📝 Log received via Webhook: ${text}`);
    return res.json({ success: true, message: "Log retransmis au terminal du dashboard." });
  });

  // 3. Webhook to update real server metrics
  app.post("/api/webhooks/metrics", verifyWebhookSecret, (req, res) => {
    const { cpu, ram, disk, services } = req.body;
    latestMetrics = {
      cpu: typeof cpu === 'number' ? cpu : 0,
      ram: typeof ram === 'number' ? ram : 0,
      disk: typeof disk === 'number' ? disk : 0,
      services: Array.isArray(services) ? services : [],
      timestamp: new Date().toISOString()
    };

    // Broadcast to connected web clients
    const payload = JSON.stringify({
      type: "metrics_update",
      metrics: latestMetrics
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    console.log(`📊 Remote host telemetry updated via Webhook: CPU=${latestMetrics.cpu}%, RAM=${latestMetrics.ram}%`);
    return res.json({ success: true, metrics: latestMetrics });
  });

  // 4. Retrieve latest telemetry cache
  app.get("/api/webhooks/metrics", (req, res) => {
    return res.json(latestMetrics);
  });

  // Create HTTP server to share Port between Express and WebSockets
  const httpServer = http.createServer(app);

  // Set up WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Store active sessions
  const clients = new Set<WebSocket>();
  const daemons = new Set<WebSocket>();

  // Lazy initialize Gemini API helper to avoid startup crashes if key is missing
  let ai: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!ai && process.env.GEMINI_API_KEY) {
      try {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("🟢 Gemini SDK successfully initialized in server.");
      } catch (err) {
        console.error("🔴 Failed to initialize Gemini SDK:", err);
      }
    }
    return ai;
  }

  // helper to multicast status to all connected dashboards
  function broadcastStatus() {
    const statusPayload = JSON.stringify({
      type: "status",
      daemonConnected: daemons.size > 0
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusPayload);
      }
    });
  }

  // helper to send logs to all dashboard clients
  function broadcastLog(text: string, status: 'info' | 'success' | 'error' = 'info') {
    const logPayload = JSON.stringify({
      type: "log",
      text,
      status,
      date: new Date().toISOString()
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(logPayload);
      }
    });
  }

  wss.on("connection", (ws, request) => {
    // Parse query parameters
    const urlObj = new URL(request.url || "", `http://localhost:${PORT}`);
    const role = urlObj.searchParams.get("role");

    if (role === "daemon") {
      daemons.add(ws);
      console.log("🔌 New Hermes Linux daemon connected.");
      broadcastLog("🔌 Connexion entrante du daemon Hermes détectée.", "success");
      broadcastStatus();

      ws.on("message", (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          // Proxy logs directly from Daemon to the Frontend Clients
          if (parsed.type === "log" || parsed.type === "task_alert") {
            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
              }
            });
          }
        } catch (err) {
          // Send raw message
          broadcastLog(`[Daemon raw]: ${msg.toString()}`, "info");
        }
      });

      ws.on("close", () => {
        daemons.delete(ws);
        console.log("🔌 Hermes Daemon connection closed.");
        broadcastLog("⚠️ Connexion avec le daemon Hermes interrompue.", "error");
        broadcastStatus();
      });

    } else {
      // Browser Client
      clients.add(ws);
      console.log("🖥️ New Dashboard web client connected.");
      
      // Send immediate connection and pairing status
      ws.send(JSON.stringify({
        type: "status",
        daemonConnected: daemons.size > 0
      }));

      ws.on("message", async (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === "command") {
            console.log(`Command received from web client: ${parsed.command}`);
            
            // If we have a real daemon connected, forward the command to it!
            if (daemons.size > 0) {
              broadcastLog(`Relais de la commande vers l'hôte VPS : ${parsed.command}`, "info");
              daemons.forEach(daemon => {
                if (daemon.readyState === WebSocket.OPEN) {
                  daemon.send(msg.toString());
                }
              });
              return;
            }

            // Fallback: If no real daemon, our Express backend executes an intelligent, simulated execution
            handleSimulatedCommand(parsed.command);
          }
        } catch (err) {
          console.error("Failed to parse client WS message:", err);
        }
      });

      ws.on("close", () => {
        clients.delete(ws);
        console.log("🖥️ Dashboard web client disconnected.");
      });
    }
  });

  // Simulated commands for local preview
  async function handleSimulatedCommand(command: string) {
    const cmdClean = command.trim().toLowerCase();
    
    if (cmdClean === "scan_imap") {
      broadcastLog("📡 [Simulateur] Initialisation de la connexion sécurisée IMAP ssl://imap.gmail.com:993...", "info");
      setTimeout(() => broadcastLog("🔍 [Simulateur] Recherche de courriels récents non-lus ou de pièces jointes...", "info"), 800);
      setTimeout(() => broadcastLog("📂 [Simulateur] Fichier 'Facture-2026-F98.pdf' identifié.", "info"), 1600);
      setTimeout(() => {
        broadcastLog("✅ [Simulateur] Courriels scannés. 1 tâche urgente détectée : 'Vérifier Facture-2026-F98'", "success");
        broadcastStatus();
      }, 2500);

    } else if (cmdClean === "index_docs") {
      broadcastLog("📂 [Simulateur] Lecture récursive du dossier local /documents...", "info");
      setTimeout(() => broadcastLog("🧠 [Simulateur] Calcul des embeddings pour 'Guide-Contrat-Client.txt'...", "info"), 600);
      setTimeout(() => broadcastLog("🧠 [Simulateur] Calcul des embeddings pour 'Planning-Strategique.xlsx'...", "info"), 1300);
      setTimeout(() => broadcastLog("💾 [Simulateur] Enregistrement de 45 vecteurs dans la base vectorielle locale.", "info"), 2000);
      setTimeout(() => broadcastLog("✅ [Simulateur] Indexation complétée avec succès.", "success"), 2600);

    } else if (cmdClean === "diagnostics") {
      broadcastLog("🖥️ [Simulateur] Vérification de l'intégrité de l'hôte distant...", "info");
      setTimeout(() => broadcastLog("📊 [Simulateur] Utilisation CPU : 12.4% | Mémoire RAM libre : 4.2 Go", "info"), 800);
      setTimeout(() => broadcastLog("🔗 [Simulateur] Connexion Socket Web : EXCELLENTE (ping 14ms)", "success"), 1500);

    } else {
      // Language-based user instruction! Let's leverage Gemini if available, otherwise beautiful response
      broadcastLog(`🤖 Hermes étudie votre consigne : "${command}"`, "info");
      const gemini = getGeminiClient();

      if (gemini) {
        try {
          const modelName = 'gemini-3.5-flash';
          console.log(`Calling Gemini (${modelName}) to process natural command: ${command}`);
          const prompt = `L'utilisateur donne à son agent de travail virtuel nommé "Hermes" la consigne suivante : "${command}".
          Tu es le cerveau de l'agent. Rédige une réponse très brève, motivante, montrant que tu comprends la tâche, et liste 2 ou 3 actions techniques concrètes de fond que tu réalises en tâche d'arrière plan en français. Réponds en 1 simple paragraphe court.`;
          
          const response = await gemini.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          const reply = response.text || "Consigne reçue. Tâche configurée de manière autonome.";
          setTimeout(() => {
            broadcastLog(`🤖 ${reply}`, "success");
          }, 1200);
        } catch (err) {
          console.error("Gemini call failed, falling back to static:", err);
          genericFallbackReply(command);
        }
      } else {
        genericFallbackReply(command);
      }
    }
  }

  function genericFallbackReply(command: string) {
    setTimeout(() => {
      broadcastLog(`🤖 Hermes (Simulé) : J'ai bien intégré votre consigne : "${command}". J'analyse vos outils, prépare un script opérationnel et je crée une nouvelle carte correspondante dans votre tableau Kanban.`, "success");
    }, 1500);
  }

  // Handle server routing upgrades
  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, "http://localhost").pathname : '';
    if (pathname === "/api/hermes/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // ==========================================
  // VITE & FRONTEND MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode (VPS / Cloud Run)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP and WebSocket server together on Port 3000
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur combiné Dashboard & Agent démarré sur http://localhost:${PORT}`);
  });
}

startServer();
