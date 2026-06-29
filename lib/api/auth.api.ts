import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type { LoginRequest, LoginResponse, User } from '@/lib/types/auth';

export class AuthApi {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('expiresAtUtc', response.expiresAtUtc);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.dispatchEvent(new CustomEvent('auth:token-updated'));
    }
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('expiresAtUtc');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:token-updated'));
  }

  getStoredAuth(): {
    accessToken: string | null;
    expiresAtUtc: string | null;
    user: User | null;
  } {
    const accessToken = localStorage.getItem('accessToken');
    const expiresAtUtc = localStorage.getItem('expiresAtUtc');
    const userStr = localStorage.getItem('user');
    
    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }
    
    return { accessToken, expiresAtUtc, user };
  }

  isTokenExpired(): boolean {
    const expiresAtUtc = localStorage.getItem('expiresAtUtc');
    if (!expiresAtUtc) return true;
    
    const expiryDate = new Date(expiresAtUtc);
    return expiryDate <= new Date();
  }
}

export const authApi = new AuthApi();
