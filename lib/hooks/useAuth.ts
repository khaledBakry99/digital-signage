import { useState, useEffect } from 'react';
import { authService, type AuthState } from '@/lib/services/authService';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    expiresAtUtc: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthState = () => {
      const state = authService.getAuthState();
      setAuthState(state);
      setLoading(false);
    };
    loadAuthState();

    window.addEventListener('auth:token-updated', loadAuthState);
    return () => {
      window.removeEventListener('auth:token-updated', loadAuthState);
    };
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthState({ user: null, accessToken: null, expiresAtUtc: null });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (!authState.expiresAtUtc) {
      return;
    }

    const expiresAt = new Date(authState.expiresAtUtc).getTime();
    if (Number.isNaN(expiresAt)) {
      return;
    }

    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }, msUntilExpiry);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authState.expiresAtUtc]);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      const newState = authService.getAuthState();
      setAuthState(newState);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      accessToken: null,
      expiresAtUtc: null,
    });
  };

  const getClientId = (): number | undefined => {
    if (authState.user?.clientId) {
      return authState.user.clientId;
    }
    if (authState.accessToken) {
      try {
        const payloadBase64 = authState.accessToken.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64));
        const cid = decoded.client_id || decoded.clientId;
        return cid ? Number(cid) : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  return {
    user: authState.user,
    accessToken: authState.accessToken,
    clientId: getClientId(),
    isAuthenticated: !!authState.user && !!authState.accessToken,
    loading,
    login,
    logout,
  };
}
