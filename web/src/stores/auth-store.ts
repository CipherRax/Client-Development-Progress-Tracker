import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin, TokenPair } from '@/lib/api/types';

interface AuthState {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (admin: Admin, tokens: TokenPair) => void;
  updateAdmin: (admin: Admin) => void;
  clearSession: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setSession: (admin, tokens) =>
        set({ admin, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      updateAdmin: (admin) => set({ admin }),
      clearSession: () => set({ admin: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'trackly.auth',
      partialize: (s) => ({
        admin: s.admin,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.(true);
      },
    },
  ),
);

export function useIsAuthenticated() {
  return useAuthStore((s) => Boolean(s.accessToken && s.admin));
}