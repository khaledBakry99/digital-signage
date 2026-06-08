export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const AUTH_STORAGE_KEY = 'digital_signage_auth';
const USERS_STORAGE_KEY = 'digital_signage_users';

const DEFAULT_ADMIN = {
  id: '1',
  username: 'admin',
  email: 'admin@digitalsignage.com',
  password: 'admin123',
  role: 'admin' as const,
  createdAt: new Date().toISOString(),
};

class AuthService {
  private initializeDefaultUsers(): void {
    if (typeof window === 'undefined') return;
    
    const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
    }
  }

  login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not in browser environment' };
    }

    this.initializeDefaultUsers();

    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
      return { success: false, error: 'خطأ في النظام' };
    }

    const users = JSON.parse(usersData);
    const user = users.find(
      (u: typeof DEFAULT_ADMIN) => u.username === username && u.password === password
    );

    if (!user) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const { password: _, ...userWithoutPassword } = user;
    const authState: AuthState = {
      isAuthenticated: true,
      user: userWithoutPassword,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    return { success: true, user: userWithoutPassword };
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  getAuthState(): AuthState {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null };
    }

    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) {
      return { isAuthenticated: false, user: null };
    }

    try {
      return JSON.parse(authData);
    } catch {
      return { isAuthenticated: false, user: null };
    }
  }

  isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.getAuthState().user;
  }

  register(username: string, email: string, password: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not in browser environment' };
    }

    this.initializeDefaultUsers();

    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
      return { success: false, error: 'خطأ في النظام' };
    }

    const users = JSON.parse(usersData);
    
    if (users.some((u: typeof DEFAULT_ADMIN) => u.username === username)) {
      return { success: false, error: 'اسم المستخدم موجود بالفعل' };
    }

    if (users.some((u: typeof DEFAULT_ADMIN) => u.email === email)) {
      return { success: false, error: 'البريد الإلكتروني موجود بالفعل' };
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password,
      role: 'user' as const,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    return { success: true };
  }
}

export const authService = new AuthService();
