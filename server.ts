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

  // ==========================================
  // REAL-TIME INTEGRATED EMAIL AI ENDPOINT (GEMINI-POWERED)
  // ==========================================
  app.post("/api/mail/ai", async (req, res) => {
    const { action, emailSubject, emailBody, emailSender, mood, draftContent, userInstructions, emails, message } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: "L'action est requise." });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      console.log("⚠️ GEMINI_API_KEY non configurée pour l'IA d'emails. Utilisation du fallback.");
      
      if (action === "summarize") {
        const bulletPoints = [
          `Sujet principal : "${emailSubject || 'Sans objet'}"`,
          `Expéditeur ciblé : ${emailSender || 'Inconnu'}`,
          `Synthèse : Ce courriel requiert une lecture attentive pour identifier les livrables d'affaires associés.`,
          `Statut : À traiter prochainement.`
        ];
        return res.json({ 
          success: true, 
          summary: `**[Mode d'évaluation hors-ligne]** Clé Gemini non configurée.\n\n- ${bulletPoints.join('\n- ')}\n\n*Configurez votre clé d'API dans Settings > Secrets pour activer l'IA de production !*`,
          simulated: true 
        });
      } else if (action === "reply") {
        const text = `Bonjour,\n\nJ'accuse bonne réception de votre message concernant "${emailSubject || 'notre projet'}".\n\nJ'analyse l'ensemble des points mentionnés et reviendrai vers vous pour fixer un créneau d'échange.\n\nTrès cordialement,\nLeo`;
        return res.json({ 
          success: true, 
          reply: text,
          simulated: true 
        });
      } else if (action === "classify") {
        return res.json({
          success: true,
          category: "important",
          sentiment: "neutre",
          urgency: "moyenne",
          recommendedAction: "Vérifier les priorités et rédiger une réponse rapide d'ici demain.",
          simulated: true
        });
      } else if (action === "rewrite") {
        const cleanedDraft = draftContent ? `${draftContent}\n\nCordialement,\nLeo` : "Brouillon indisponible.";
        return res.json({
          success: true,
          reply: cleanedDraft,
          simulated: true 
        });
      } else if (action === "copilot") {
        const msgClean = (message || "").toLowerCase();
        let replyText = "";
        
        if (msgClean.includes("résum") || msgClean.includes("synthè") || msgClean.includes("boîte")) {
          replyText = `### Synthèse globale de votre boîte de réception

Voici un résumé automatique des courriels marquants actuellement dans votre boîte :

1. **Lucas (Contrat de maintenance VPS)** ([Action: select-email|mail-1|Contrat VPS]) : Clauses de week-end modifiées, retour attendu d'ici demain.
2. **Sophie Martin (Devis refactoring)** ([Action: select-email|mail-2|Devis Refactoring]) : Prospect chaud demandant une refonte de landing page d'ici fin juillet + demande de point téléphonique.
3. **Support Technique (Confirmation Virement)** ([Action: select-email|mail-3|Virement mensuel]) : Reçu annuel pour le plan Pro.
4. **GitHub Security Alerts (Alerte Vulnérabilité)** ([Action: select-email|mail-4|GitHub Security]) : Alerte de vulnérabilité de dépendances nécessitant un correctif.

Astuce : Cliquez sur les boutons ci-dessus pour ouvrir le mail et consulter la proposition de réponse automatique pré-rédigée.`;
        } else if (msgClean.includes("urg") || msgClean.includes("lucas") || msgClean.includes("action") || msgClean.includes("prior")) {
          replyText = `### Actions de priorité haute détectées

D’après l’analyse, vous avez **2 dossiers** exigeant une intervention rapide :

*   **Lucas (Contrat VPS)** : Il attend une validation sur le support d'ici demain. 
    [Action: select-email|mail-1|Ouvrir le mail de Lucas]
*   **Vérification de Sécurité (GitHub)** : Alerte de vulnérabilité de dépendance.
    [Action: select-email|mail-4|Ouvrir l'alerte GitHub]

Vous pouvez cliquer sur ces boutons pour accéder directement aux courriels concernés.`;
        } else if (msgClean.includes("prospect") || msgClean.includes("devis") || msgClean.includes("business") || msgClean.includes("argent")) {
          replyText = `### Opportunités Client & Business

Nous avons détecté une opportunité commerciale très intéressante de **Sophie Martin** :
*   Elle souhaite effectuer la refonte de leur landing page d'ici fin juillet.
*   Elle propose d'en discuter ce vendredi par téléphone.

[Action: select-email|mail-2|Ouvrir l'opportunité de Sophie Martin]
La proposition de réponse automatique est prête pour lui confirmer votre disponibilité.`;
        } else {
          replyText = `Bonjour Leo ! Je suis votre assistant de messagerie.

Je parcours vos e-mails pour vous aider à piloter votre activité sans effort.

Voici ce que vous pouvez me demander :
*   « Fais-moi un résumé de ma boîte »
*   « Quelles sont mes actions urgentes ? »
*   « Ai-je des opportunités de devis de la part de clients ? »

Comment puis-je vous assister aujourd'hui ?`;
        }
        
        return res.json({
          success: true,
          reply: replyText,
          simulated: true
        });
      } else if (action === "auto-process") {
        const sub = (emailSubject || "").toLowerCase();
        let category = "none";
        let urgency = "moyenne";
        let sentiment = "neutre";
        let recommendedAction = "Prendre connaissance du mail et répondre.";
        let aiSummary = "";
        let aiDraft = "";

        if (sub.includes("contrat") || sub.includes("maintenance")) {
          category = "important";
          urgency = "haute";
          sentiment = "neutre";
          recommendedAction = "Valider les heures de support de week-end avec Lucas.";
          aiSummary = "**Points clés :**\n- Analyse du contrat de maintenance VPS modifié.\n- Clauses sur les horaires de week-end.\n- Lucas attend une approbation rapide.";
          aiDraft = "Bonjour Lucas,\n\nMerci pour l'envoi du contrat VPS modifié.\n\nJe vais examiner attentivement les clauses concernant les heures de support le week-end et je reviens vers toi rapidement d'ici demain pour te confirmer si tout est en ordre.\n\nCordialement,\nLeo";
        } else if (sub.includes("virement") || sub.includes("mensuel") || sub.includes("facture") || sub.includes("reçu")) {
          category = "finance";
          urgency = "basse";
          sentiment = "positif";
          recommendedAction = "Classer le reçu pour l'abonnement Boubane Pro. Aucune autre action requise.";
          aiSummary = "**Points clés :**\n- Confirmation de réception de virement pour le plan Pro de Boubane.\n- Aucune action supplémentaire requise de notre part.";
          aiDraft = "Bonjour Support Boubane,\n\nC'est parfait, je vous remercie pour cette confirmation de réception de notre paiement mensuel.\n\nCordialement,\nLeo";
        } else if (sub.includes("devis") || sub.includes("refactoring") || sub.includes("site")) {
          category = "business";
          urgency = "haute";
          sentiment = "positif";
          recommendedAction = "Préparer l'estimation budgétaire et confirmer le rendez-vous téléphonique du vendredi.";
          aiSummary = "**Points clés :**\n-Sophie Martin souhaite une refonte complète de leur landing page d'ici fin juillet.\n-Elle propose un rendez-vous téléphonique ce vendredi pour caler les modalités.";
          aiDraft = "Bonjour Sophie,\n\nC'est avec grand plaisir que je prends note de votre demande de devis pour le refactoring de votre site.\n\nAméliorer votre landing page d'ici fin juillet est tout à fait faisable. Je serai disponible ce vendredi pour notre appel de cadrage afin d'affiner votre cahier des charges.\n\nBien cordialement,\nLeo";
        } else if (sub.includes("security") || sub.includes("alert") || sub.includes("vulnerability") || sub.includes("dependenc")) {
          category = "update";
          urgency = "haute";
          sentiment = "négatif";
          recommendedAction = "Entrer dans le terminal et exécuter 'npm audit fix' pour corriger les alertes de dépendances.";
          aiSummary = "**Points clés :**\n- Alerte de sécurité de GitHub pour une vulnérabilité critique.\n- Nécessité d'appliquer 'npm audit fix' rapidement.";
          aiDraft = "Bonjour,\n\nJ'accuse réception de cette notification de sécurité.\n\nJe vais planifier le correctif aujourd'hui même avec un audit npm pour sécuriser nos dépendances.\n\nCordialement,\nLeo";
        } else {
          category = "update";
          urgency = "moyenne";
          sentiment = "neutre";
          recommendedAction = "Lire le message et répondre de manière appropriée.";
          aiSummary = `**Points clés :**\n- Message reçu de ${emailSender || 'Inconnu'}.\n- Objet : "${emailSubject || 'Sans objet'}".`;
          aiDraft = `Bonjour,\n\nJ'accuse réception de votre courriel concernant "${emailSubject || 'notre projet'}".\n\nJe vais analyser vos retours et j'y répondrai de manière complète dans les meilleurs délais.\n\nCordialement,\nLeo`;
        }

        return res.json({
          success: true,
          category,
          sentiment,
          urgency,
          recommendedAction,
          aiSummary,
          aiDraft,
          simulated: true
        });
      }
      return res.status(400).json({ error: "Action inconnue." });
    }

    try {
      let prompt = "";
      if (action === "summarize") {
        prompt = `Tu es un assistant de gestion d'emails hautement performant.
Analyse le message ci-dessous et rédige un résumé très clair, synthétique, structuré sous forme de liste à puces (max 4 points clés courts en français, chaque point ayant un titre en gras et une phrase).
Identifie également s'il y a une action urgente requise ou une date butoir mentionnée.

Sujet : ${emailSubject}
Expéditeur : ${emailSender || 'Inconnu'}
Message :
${emailBody}`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: "Tu es un synthétiseur d'emails professionnel et précis. Réponds de manière claire et structurée avec du markdown propre."
          }
        });
        return res.json({ success: true, summary: response.text });

      } else if (action === "reply") {
        let contextMood = "professionnel, bienveillant, et concis";
        if (mood === "positive") {
          contextMood = "très positif, enthousiaste, acceptant chaleureusement la proposition";
        } else if (mood === "negative") {
          contextMood = "poli, courtois mais déclinant de manière constructive et professionnelle";
        } else if (mood === "more_details") {
          contextMood = "curieux, demandant poliment plus de précisions techniques ou opérationnelles";
        }

        prompt = `Rédige une réponse d'email en français complète, soignée et professionnelle.
L'email d'origine est de : ${emailSender || 'Inconnu'}
Sujet d'origine : ${emailSubject}
Message d'origine :
${emailBody}

Le ton de la réponse doit être : ${contextMood}.
${userInstructions ? `Instructions spécifiques de l'utilisateur : "${userInstructions}"` : ""}

Rédige directement l'intégralité du corps de l'email prêt à l'envoi, signé par "Leo". Ne rajoute aucun commentaire méta, seulement le courriel.`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: "Tu es un impeccable rédacteur d'emails d'affaires. Génère directement le corps final de l'email, prêt à être copié."
          }
        });
        return res.json({ success: true, reply: response.text });

      } else if (action === "classify") {
        prompt = `Analyse l'email ci-dessous et renvoie un objet JSON valide contenant l'analyse de classification.
L'objet JSON doit respecter exactement cette structure TypeScript :
{
  "category": "important" | "finance" | "business" | "update" | "none",
  "sentiment": "positif" | "neutre" | "négatif",
  "urgency": "basse" | "moyenne" | "haute",
  "recommendedAction": string // une phrase courte d'action recommandée
}

Email à analyser :
Sujet : ${emailSubject}
Message :
${emailBody}`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: "Tu es un classificateur d'emails automatisé. Renvoie strictement l'objet JSON sous forme compacte sans balise markdown triple backtick."
          }
        });

        let textJson = response.text || "{}";
        // Clean markdown backticks if returned anyway
        textJson = textJson.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(textJson);
        return res.json({ success: true, ...data });

      } else if (action === "rewrite") {
        prompt = `Optimise et polit le brouillon de réponse ci-dessous de manière impeccable en français.
Conserve l'idée principale mais améliore grandiosement la clarté, l'orthographe, le style et le professionnalisme.

Email d'origine reçu :
Sujet : ${emailSubject}
Message reçu : ${emailBody}

Notre brouillon de réponse actuel :
${draftContent}

${userInstructions ? `Instructions spécifiques de réécriture : "${userInstructions}"` : "Rend le email impeccable, fluide et correctement structuré."}

Fournis directement le texte réécrit d'email optimal, signé par "Leo".`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: "Tu es un relecteur de haut niveau. Fournis uniquement le courriel réécrit de manière fluide."
          }
        });
        return res.json({ success: true, reply: response.text });
      } else if (action === "auto-process") {
        prompt = `Analyse le courriel électronique ci-dessous et renvoie un unique objet JSON valide contenant l'analyse complète de tri automatique et la suggestion d'un brouillon automatique de réponse.

L'objet JSON doit respecter exactement la structure TypeScript suivante :
{
  "category": "important" | "finance" | "business" | "update" | "none",
  "sentiment": "positif" | "neutre" | "négatif",
  "urgency": "basse" | "moyenne" | "haute",
  "recommendedAction": string, // Action concrète conseillée en français (ex: "Valider les clauses de week-end")
  "aiSummary": string, // Un résumé très synthétique sous forme d'une liste à puces (max 3 puces clés, formaté en markdown propre en français)
  "aiDraft": string // Un brouillon de réponse d'email complet, poli, professionnel, chaleureux et bien rédigé en français, prêt à être envoyé, adapté au message, signé par "Leo"
}

Données du courriel :
Sujet : ${emailSubject}
Expéditeur : ${emailSender || 'Inconnu'}
Contenu :
${emailBody}`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: "Tu es un trieur d'emails d'affaires et un rédacteur automatique de brouillons d'élite en français. Tu ne dois JAMAIS inclure d'émoji dans tes réponses, brouillons ou résumés. Le ton doit être professionnel et sobre."
          }
        });

        let textJson = response.text || "{}";
        textJson = textJson.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(textJson);
        return res.json({ success: true, ...data });
      } else if (action === "copilot") {
        const emailListStr = Array.isArray(emails) 
          ? emails.map(e => `[ID: ${e.id}] Expéditeur: ${e.sender} | Sujet: ${e.subject} | Date: ${e.date} | Catégorie: ${e.category} | Priorité: ${e.urgency} | Lu: ${e.read ? 'Oui' : 'Non'} | Contenu: ${e.body.substring(0, 150)}...`).join("\n---\n")
          : "Aucun email disponible dans la boîte.";

        const prompt = `Tu es l'assistant de messagerie pour l'utilisateur Léo.
Tu as un accès direct et temps réel à l'intégralité de sa boîte de réception.

Voici la liste des courriels disponibles actuellement :
${emailListStr}

Voici la demande ou l'instruction de l'utilisateur Léo :
"${message}"

Consigne cruciale de syntaxe (Actions cliquables) :
Si tu fais référence à un ou plusieurs emails spécifiques dans ton message, tu DOIS TOUJOURS insérer la syntaxe exacte suivante dans ton texte : [Action: select-email|ID-DU-MAIL|Sujet ou Expéditeur] (par exemple : [Action: select-email|mail-1|Lucas - Contrat VPS]).
L'interface de l'utilisateur convertira automatiquement ce tag en un bouton élégant et interactif qui lui permettra d'ouvrir directement ce mail lors d'un clic. Utilise cette syntaxe pour tous les courriels dont tu parles. Offre des liens vers les courriels pertinents de manière ultra-naturelle et fluide.

Réponds de manière extrêmement soignée, professionnelle, et structurée en français. Utilise du Markdown propre (listes à puces, gras) pour rendre ta réponse très lisible. Ne mets jamais d'émojis dans tes messages ou tes boutons d'actions.`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: "Tu es un assistant de messagerie professionnel et d'une grande rigueur. Tu aides Léo à synthétiser et traiter son flux d'emails de manière neutre et sobre. Tu as l'interdiction formelle d'inclure des émojis."
          }
        });

        return res.json({ success: true, reply: response.text });
      }

      return res.status(400).json({ error: "Action inconnue." });
    } catch (err: any) {
      console.error("Erreur de traitement IA dans server.ts :", err);
      return res.status(500).json({ error: `Erreur IA : ${err.message}` });
    }
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
          const modelName = 'gemini-3.1-flash-lite';
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
