import { create } from 'zustand';
import type { AuthUser } from '@seednest/shared';

type AuthStore = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => set({ user, token, isLoading: false }),
  clearAuth: () => set({ user: null, token: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
