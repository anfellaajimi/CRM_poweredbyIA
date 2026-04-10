import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  isFullScreen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFullScreen: (full: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isFullScreen: false,
  toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
  setFullScreen: (full: boolean) => set({ isFullScreen: full }),
}));
