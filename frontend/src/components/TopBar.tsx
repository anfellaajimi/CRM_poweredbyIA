import React, { useState } from 'react';
import { Bell, Moon, Sun, Search, LogOut, User, Settings, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useSidebarStore } from '../store/sidebarStore';

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

  const notifications = [
    { id: 1, text: 'New invoice from Acme Corp', time: '5 min ago' },
    { id: 2, text: 'Project deadline approaching', time: '1 hour ago' },
    { id: 3, text: 'Contract renewal reminder', time: '2 hours ago' }
  ];

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
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-border hover:bg-accent cursor-pointer">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  ))}
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
                  src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'}
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
