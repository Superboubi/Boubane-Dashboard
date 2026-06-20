/**
 * Hermes Connector - Module de connexion entre Dashboard et Agent Hermes
 * 
 *用法:
 * 1. Hermes appelle /api/hermes/emails pour récupérer les emails
 * 2. Hermes analyse et appelle /api/hermes/analysis pour envoyer les résultats
 * 3. Le dashboard affiche les analyses Hermes en temps réel via WebSocket
 */

export interface HermesEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  folder: string;
  category?: string;
  urgency?: 'basse' | 'moyenne' | 'haute';
  sentiment?: 'positif' | 'neutre' | 'negatif';
  hermesAnalysis?: {
    summary?: string;
    recommendedAction?: string;
    confidence: number;
    analyzedAt: string;
  };
}

export interface HermesAnalysis {
  emailId: string;
  category?: string;
  sentiment?: 'positif' | 'neutre' | 'negatif';
  urgency?: 'basse' | 'moyenne' | 'haute';
  summary?: string;
  recommendedAction?: string;
  draftReply?: string;
  confidence: number;
  analyzedBy: 'hermes';
  analyzedAt: string;
}

export interface HermesConfig {
  apiUrl: string;
  wsUrl: string;
  apiKey?: string;
  agentId?: string;
}

class HermesConnector {
  private config: HermesConfig | null = null;

  configure(config: HermesConfig) {
    this.config = config;
    console.log('[Hermes] Connector configured:', { apiUrl: config.apiUrl, agentId: config.agentId });
  }

  async getEmails(folder = 'INBOX', limit = 50): Promise<HermesEmail[]> {
    if (!this.config) throw new Error('Hermes not configured');
    const res = await fetch(`${this.config.apiUrl}/api/hermes/emails?folder=${folder}&limit=${limit}`);
    const data = await res.json();
    return data.emails || [];
  }

  async getEmail(emailId: string): Promise<HermesEmail | null> {
    if (!this.config) throw new Error('Hermes not configured');
    const res = await fetch(`${this.config.apiUrl}/api/hermes/emails/${emailId}`);
    const data = await res.json();
    return data.email || null;
  }

  async sendAnalysis(analysis: HermesAnalysis): Promise<{ success: boolean }> {
    if (!this.config) throw new Error('Hermes not configured');
    const res = await fetch(`${this.config.apiUrl}/api/hermes/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    });
    return res.json();
  }

  async subscribeToEmailEvents(callback: (emailId: string, event: string) => void): Promise<() => void> {
    if (!this.config) throw new Error('Hermes not configured');
    
    const ws = new WebSocket(`${this.config.wsUrl}/api/hermes/ws?role=hermes`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'email_opened') {
          callback(data.emailId, 'opened');
        }
      } catch {}
    };

    return () => ws.close();
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

export const hermesConnector = new HermesConnector();

export default hermesConnector;
