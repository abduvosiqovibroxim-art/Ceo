import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (email: string, password: string) => {
        // Mock login - in production, call API
        if (email === 'admin@stario.uz' && password === 'admin123') {
          set({
            user: {
              id: '1',
              email: email,
              fullName: 'Admin User',
              role: 'admin',
              permissions: ['*'],
            },
            accessToken: 'mock-access-token',
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'stario-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
