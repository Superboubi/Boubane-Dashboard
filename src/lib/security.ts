import { session } from './session';

const CSRF_TOKEN_KEY = 'boubane_csrf_token';
const RATE_LIMIT_KEY = 'boubane_rate_limit';
const MAX_REQUESTS_PER_WINDOW = 100;
const RATE_WINDOW_MS = 60 * 1000;

export const security = {
  generateCSRFToken(): string {
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);
    localStorage.setItem(CSRF_TOKEN_KEY, token);
    return token;
  },

  validateCSRFToken(token: string): boolean {
    const stored = localStorage.getItem(CSRF_TOKEN_KEY);
    return stored === token;
  },

  getCSRFToken(): string | null {
    return localStorage.getItem(CSRF_TOKEN_KEY);
  },

  clearCSRFToken(): void {
    localStorage.removeItem(CSRF_TOKEN_KEY);
  },

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  checkRateLimit(): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
    
    if (!stored) {
      const data = { count: 1, windowStart: now };
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_WINDOW_MS };
    }

    const data = JSON.parse(stored);
    
    if (now - data.windowStart > RATE_WINDOW_MS) {
      const newData = { count: 1, windowStart: now };
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_WINDOW_MS };
    }

    if (data.count >= MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: RATE_WINDOW_MS - (now - data.windowStart)
      };
    }

    data.count++;
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - data.count,
      resetIn: RATE_WINDOW_MS - (now - data.windowStart)
    };
  },

  isAuthenticated(): boolean {
    return session.isValid();
  },

  requireAuth(): void {
    if (!this.isAuthenticated()) {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://boubane.ai';
      window.location.href = `${siteUrl}/login?redirect=${encodeURIComponent(window.location.href)}`;
    }
  },

  getSecurityHeaders(): Record<string, string> {
    const csrfToken = this.getCSRFToken();
    return {
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      'X-Requested-With': 'XMLHttpRequest'
    };
  },

  secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const rateCheck = this.checkRateLimit();
    
    if (!rateCheck.allowed) {
      return Promise.reject(new Error(`Rate limit exceeded. Retry in ${Math.ceil(rateCheck.resetIn / 1000)}s`));
    }

    const headers = this.getSecurityHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      },
      credentials: 'same-origin'
    });
  }
};

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (maxRetries <= 0) throw error;
    const delay = initialDelayMs * Math.pow(2, 3 - maxRetries);
    return new Promise((resolve) => setTimeout(() => resolve(retryWithBackoff(fn, maxRetries - 1, initialDelayMs))), delay);
  });
}

export default security;