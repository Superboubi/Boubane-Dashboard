interface SessionData {
  token: string;
  expiresAt: number;
  authenticatedAt: string;
  source: 'vitrine' | 'direct' | 'api';
  userId?: string;
  email?: string;
}

const SESSION_KEY = 'boubane_session_token';
const SESSION_PREFIX = 'boubane_';

export const session = {
  get(): SessionData | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as SessionData;
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  set(data: Omit<SessionData, 'expiresAt'> & { expiresIn?: number }): void {
    const session: SessionData = {
      token: data.token,
      expiresAt: data.expiresIn ? Date.now() + data.expiresIn : Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: data.authenticatedAt || new Date().toISOString(),
      source: data.source || 'direct',
      userId: data.userId,
      email: data.email
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  isValid(): boolean {
    const session = this.get();
    return session !== null && session.expiresAt > Date.now();
  },

  timeRemaining(): number {
    const session = this.get();
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }
};

export function createSessionStore(prefix = SESSION_PREFIX) {
  return {
    get<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(`${prefix}${key}`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set<T>(key: string, value: T, ttlMs?: number): void {
      const data = {
        value,
        expiresAt: ttlMs ? Date.now() + ttlMs : null
      };
      localStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
    },
    remove(key: string): void {
      localStorage.removeItem(`${prefix}${key}`);
    },
    clearExpired(): void {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const data = JSON.parse(raw);
              if (data.expiresAt && data.expiresAt < Date.now()) {
                keysToRemove.push(key);
              }
            }
          } catch {}
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };
}

export const sessionStore = createSessionStore();

export default session;