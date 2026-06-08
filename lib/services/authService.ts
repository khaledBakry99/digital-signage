import { authApi } from '@/lib/api/auth.api';
import type { User, AuthState } from '@/lib/types/auth';

class AuthService {
  getAuthState(): AuthState {
    if (typeof window === 'undefined') {
      return { user: null, accessToken: null, expiresAtUtc: null };
    }

    const { user, accessToken, expiresAtUtc } = authApi.getStoredAuth();
    
    if (accessToken && !authApi.isTokenExpired()) {
      return { user, accessToken, expiresAtUtc };
    }
    
    return { user: null, accessToken: null, expiresAtUtc: null };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await authApi.login({ email, password });
      return { success: true, user: response.user };
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        return { success: false, error: error.message as string };
      }
      return { success: false, error: 'حدث خطأ في تسجيل الدخول' };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (authApi.isTokenExpired()) {
        return null;
      }
      return await authApi.getCurrentUser();
    } catch {
      return null;
    }
  }

  logout(): void {
    authApi.logout();
  }

  isAuthenticated(): boolean {
    const state = this.getAuthState();
    return !!state.user && !!state.accessToken && !authApi.isTokenExpired();
  }
}

export const authService = new AuthService();
export type { User, AuthState };
