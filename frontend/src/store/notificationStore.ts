import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  addMultipleNotifications: (notifs: Omit<AppNotification, 'id' | 'timestamp' | 'read'>[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: 'init-1',
      type: 'info',
      message: 'Bienvenue sur votre CRM automatisé',
      timestamp: new Date().toISOString(),
      read: false
    }
  ],
  addNotification: (notif) => set((state) => ({
    notifications: [
      {
        ...notif,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        read: false
      },
      ...state.notifications
    ]
  })),
  addMultipleNotifications: (notifs) => set((state) => {
    const newNotifs = notifs.map(n => ({
      ...n,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false
    }));
    return { notifications: [...newNotifs, ...state.notifications] };
  }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  clearAll: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter(n => !n.read).length
}));
