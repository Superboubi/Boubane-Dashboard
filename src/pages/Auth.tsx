import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Lock, Key, ArrowRight, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

interface AuthState {
  status: AuthStatus;
  message: string;
  redirectUrl: string | null;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>({
    status: 'idle',
    message: '',
    redirectUrl: null
  });

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://boubane.ai';
  const dashboardUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');
    const redirect = searchParams.get('redirect') || '/';

    if (action === 'logout') {
      localStorage.removeItem('boubane_session_token');
      setAuthState({
        status: 'success',
        message: 'Déconnexion réussie. À bientôt !',
        redirectUrl: siteUrl
      });
      setTimeout(() => {
        window.location.href = siteUrl;
      }, 2000);
      return;
    }

    if (token) {
      setAuthState({ status: 'loading', message: 'Vérification du token...', redirectUrl: null });
      
      setTimeout(() => {
        try {
          const sessionData = {
            token,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            authenticatedAt: new Date().toISOString(),
            source: 'vitrine'
          };
          localStorage.setItem('boubane_session_token', JSON.stringify(sessionData));
          
          setAuthState({
            status: 'success',
            message: 'Authentification réussie ! Redirection vers le dashboard...',
            redirectUrl: `${dashboardUrl}${redirect}`
          });

          setTimeout(() => {
            window.location.href = `${dashboardUrl}${redirect}`;
          }, 1500);
        } catch (err) {
          setAuthState({
            status: 'error',
            message: 'Erreur lors de la sauvegarde de la session.',
            redirectUrl: null
          });
        }
      }, 1500);
    } else {
      const storedSession = localStorage.getItem('boubane_session_token');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session.expiresAt > Date.now()) {
            setAuthState({
              status: 'success',
              message: 'Session existante valide. Redirection...',
              redirectUrl: `${dashboardUrl}${redirect}`
            });
            setTimeout(() => {
              window.location.href = `${dashboardUrl}${redirect}`;
            }, 1000);
          } else {
            localStorage.removeItem('boubane_session_token');
          }
        } catch {
          localStorage.removeItem('boubane_session_token');
        }
      } else {
        window.location.href = `${siteUrl}/login?redirect=${encodeURIComponent(window.location.href)}`;
      }
    }
  }, [searchParams, siteUrl, dashboardUrl]);

  const handleReturnToSite = () => {
    window.location.href = siteUrl;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--accent-glow)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
            Boubane<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Dashboard IA</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
          {authState.status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">Initialisation de l'authentification...</p>
            </div>
          )}

          {authState.status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center mx-auto animate-pulse">
                <Key className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <p className="text-sm text-[var(--text)] font-medium">{authState.message}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Vérification sécurisée...</span>
              </div>
            </div>
          )}

          {authState.status === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm text-[var(--text)] font-medium">{authState.message}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-500">
                <CheckCircle className="w-3 h-3" />
                <span>Session sécurisée établie</span>
              </div>
            </div>
          )}

          {authState.status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-[var(--text)] font-medium">{authState.message}</p>
              <button
                onClick={handleReturnToSite}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all"
              >
                Retour au site
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={handleReturnToSite}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Retour à {siteUrl}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const sessionToken = localStorage.getItem('boubane_session_token');
      
      if (sessionToken) {
        try {
          const session = JSON.parse(sessionToken);
          if (session.expiresAt > Date.now()) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem('boubane_session_token');
        }
      }
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('boubane_session_token');
    window.location.href = `${import.meta.env.VITE_SITE_URL || 'https://boubane.ai'}/auth?action=logout`;
  };

  return { isAuthenticated, isLoading, logout };
}

export function requireAuth(Component: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const { isAuthenticated, isLoading } = useAuth();
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://boubane.ai';

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Vérification de l'authentification...</span>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = `${siteUrl}/login?redirect=${encodeURIComponent(window.location.href)}`;
      return null;
    }

    return <Component {...props} />;
  };
}