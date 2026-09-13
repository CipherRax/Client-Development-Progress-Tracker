import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UiState {
  adminTheme: Theme;
  publicTheme: Theme;
  sidebarOpen: boolean;
  setAdminTheme: (theme: Theme) => void;
  toggleAdminTheme: () => void;
  setPublicTheme: (theme: Theme) => void;
  togglePublicTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      adminTheme: 'dark',
      publicTheme: 'dark',
      sidebarOpen: false,
      setAdminTheme: (theme) => set({ adminTheme: theme }),
      toggleAdminTheme: () => set((s) => ({ adminTheme: s.adminTheme === 'dark' ? 'light' : 'dark' })),
      setPublicTheme: (theme) => set({ publicTheme: theme }),
      togglePublicTheme: () => set((s) => ({ publicTheme: s.publicTheme === 'dark' ? 'light' : 'dark' })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'trackly.ui' },
  ),
);