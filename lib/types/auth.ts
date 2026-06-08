export type UserRole = 'SuperAdmin' | 'Admin' | 'User';

export interface User {
  id: number;
  clientId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  expiresAtUtc: string | null;
}
