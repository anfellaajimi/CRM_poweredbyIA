import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Developer';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const { data } = await authAPI.login(email, password);
        localStorage.setItem('auth-token', data.access_token);

        const roleMap: Record<string, User['role']> = {
          admin: 'Admin',
          manager: 'Manager',
          developpeur: 'Developer',
          developer: 'Developer',
        };

        const apiUser = data.user || {};
        const user: User = {
          id: String(apiUser.id ?? ''),
          name: apiUser.name ?? '',
          email: apiUser.email ?? email,
          role: roleMap[String(apiUser.role ?? '').toLowerCase()] ?? 'Developer',
        };
        set({ user, isAuthenticated: true });
      },
      register: async (name: string, email: string, password: string, role: string) => {
        const apiRole = role.toLowerCase() === 'developer' ? 'developpeur' : role.toLowerCase();
        const { data } = await authAPI.register({
          nom: name,
          email,
          motDePasse: password,
          role: apiRole,
        });
        localStorage.setItem('auth-token', data.access_token);

        const roleMap: Record<string, User['role']> = {
          admin: 'Admin',
          manager: 'Manager',
          developpeur: 'Developer',
          developer: 'Developer',
        };

        const apiUser = data.user || {};
        const user: User = {
          id: String(apiUser.id ?? ''),
          name: apiUser.name ?? name,
          email: apiUser.email ?? email,
          role: roleMap[String(apiUser.role ?? '').toLowerCase()] ?? 'Developer',
        };
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('auth-token');
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
