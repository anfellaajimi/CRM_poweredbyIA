import React, { useState } from 'react';
import { Bell, Moon, Sun, Search, LogOut, User, Settings, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useSidebarStore } from '../store/sidebarStore';
import { useNotificationStore } from '../store/notificationStore';
import { CheckCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { aiMonitoringAPI, rappelsAPI, UIRappel } from '../services/api';

export const TopBar: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebarStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  const { data: rappels = [] } = useQuery({
    queryKey: ['rappels'],
    queryFn: () => rappelsAPI.getAll({}),
    refetchInterval: 30000,
  });

  const { data: aiAgentActivity } = useQuery({
    queryKey: ['ai-agent-activity-topbar'],
    queryFn: aiMonitoringAPI.getAgentActivity,
    refetchInterval: 15000,
  });

  const rappelNotifications = React.useMemo(() => {
    return rappels
      .filter((r: UIRappel) => r.statut?.toLowerCase() !== 'terminé' && r.statut?.toLowerCase() !== 'termine' && r.statut?.toLowerCase() !== 'annule')
      .map((r: UIRappel) => ({
        id: `rappel-${r.id}`,
        type: ['elevee', 'haute', 'élevée'].includes(r.priorite?.toLowerCase() || '') ? 'error' : 'warning',
        message: `Rappel : ${r.titre}${r.description ? ` - ${r.description}` : ''}`,
        timestamp: r.dateLimite || r.createdAt || new Date().toISOString(),
        read: false,
        isRappel: true
      }));
  }, [rappels]);

  const allNotifications = React.useMemo(() => {
    const aiAgentNotifications = (aiAgentActivity?.alerts || []).map((a) => ({
      id: `ai-agent-${a.id}`,
      type: a.priority?.toLowerCase() === 'elevee' ? 'error' : 'warning',
      message: `AI Agent: ${a.title}${a.message ? ` - ${a.message}` : ''}`,
      timestamp: a.createdAt || new Date().toISOString(),
      read: false,
      isAIAgent: true,
    }));
    return [...aiAgentNotifications, ...rappelNotifications, ...notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [aiAgentActivity, rappelNotifications, notifications]);

  const totalUnreadCount = unreadCount() + rappelNotifications.length + (aiAgentActivity?.alerts?.length || 0);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b border-border z-30 transition-all duration-300',
        isCollapsed ? 'left-20' : 'left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-accent transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {totalUnreadCount > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] flex items-center justify-center font-bold text-white bg-red-500 rounded-full">{totalUnreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[380px] bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {totalUnreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium">
                      <CheckCheck className="w-3 h-3 mr-1" /> Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {allNotifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                      <Bell className="w-8 h-8 opacity-20 mb-2" />
                      Aucune notification
                    </div>
                  ) : (
                    allNotifications.map((notif: any) => (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          if (notif.isRappel) {
                            navigate('/rappels');
                            setShowNotifications(false);
                          } else if (notif.isAIAgent) {
                            navigate('/ai-monitoring');
                            setShowNotifications(false);
                          } else {
                            markAsRead(notif.id);
                          }
                        }}
                        className={`p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            notif.type === 'error' ? 'bg-red-500' :
                            notif.type === 'warning' ? 'bg-yellow-500' :
                            notif.type === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(notif.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
            >
              <div className="relative">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full"></span>
              </div>
              <div className="text-left hidden md:flex items-center space-x-2">
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.name || 'Anfel Ajimil'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{user?.role || 'ADMIN'}</p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-[280px] bg-card border border-border rounded-xl shadow-xl overflow-hidden py-2" style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
                {/* Header */}
                <div className="px-4 py-3 flex items-start space-x-3 mb-1">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'}
                    alt={user?.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'Anfel Ajimil'}</p>
                    <p className="text-xs text-muted-foreground truncate mb-1">anfel.ajimil@workspace.pro</p>
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      Pro Plan
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/50 my-1"></div>

                {/* COMPTE */}
                <div className="px-3 py-2">
                  <p className="px-2 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1 mt-1">Compte</p>
                  <button
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/90 font-medium">Mon Profil</span>
                  </button>
                  <button
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/security');
                    }}
                  >
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/90 font-medium">Sécurité</span>
                  </button>
                </div>

                <div className="border-t border-border/50 my-1 mx-3"></div>

                {/* ORGANISATION */}
                <div className="px-3 py-2">
                  <p className="px-2 text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1 mt-1">Organisation</p>
                  <button
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/90 font-medium">Paramètres</span>
                  </button>
                  <button
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/billing');
                    }}
                  >
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/90 font-medium">Facturation</span>
                  </button>
                </div>

                <div className="border-t border-border/50 my-1 mx-3"></div>

                {/* SUPPORT */}
                <div className="px-3 py-1">
                  <button
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/support');
                    }}
                  >
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground/90 font-medium">Support</span>
                  </button>
                </div>

                <div className="border-t border-red-100 dark:border-red-900/30 my-1 mx-3"></div>

                {/* LOGOUT */}
                <div className="px-3 pb-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
