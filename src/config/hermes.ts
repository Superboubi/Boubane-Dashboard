/**
 * Hermes Configuration
 * 
 * Config pour connecter un agent Hermes au Dashboard
 * 
 * Setup:
 * 1. Copier ce fichier en hermes.local.ts
 * 2. Remplir les valeurs
 * 3. Importer depuis App.tsx: import './config/hermes.local'
 */

export const hermesConfig = {
  // URL du Dashboard (où Hermes doit se connecter)
  dashboardUrl: process.env.HERMES_DASHBOARD_URL || 'http://localhost:3000',
  
  // ID unique de l'agent Hermes
  agentId: process.env.HERMES_AGENT_ID || 'hermes-1',
  
  // Clé API optionnelle (pour authentifier Hermes)
  apiKey: process.env.HERMES_API_KEY,
  
  // Active le mode debug (logs détaillés)
  debug: process.env.NODE_ENV !== 'production',
};

export const hermesEndpoints = {
  // Endpoint pour récupérer les emails
  emails: `${hermesConfig.dashboardUrl}/api/hermes/emails`,
  
  // Endpoint pour envoyer une analyse
  analysis: `${hermesConfig.dashboardUrl}/api/hermes/analysis`,
  
  // WebSocket pour events temps réel
  websocket: `${hermesConfig.dashboardUrl.replace('http', 'ws')}/api/hermes/ws`,
};

export default hermesConfig;
