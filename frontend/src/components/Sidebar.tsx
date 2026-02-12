import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  FileSignature,
  ClipboardList,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useSidebarStore } from '../store/sidebarStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Briefcase, label: 'Projects', path: '/projects' },
  { icon: FileText, label: 'Devis', path: '/devis' },
  { icon: Receipt, label: 'Factures', path: '/factures' },
  { icon: FileSignature, label: 'Contrats', path: '/contrats' },
  { icon: ClipboardList, label: 'Cahier de Charge', path: '/cahier-de-charge' },
  { icon: Activity, label: 'AI Monitoring', path: '/ai-monitoring' },
  { icon: Bell, label: 'Rappels', path: '/rappels' },
  { icon: Settings, label: 'Users', path: '/users' }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 z-40 border-r border-sidebar-border',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn('flex items-center h-16 px-6 border-b border-sidebar-border', isCollapsed && 'justify-center px-0')}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                CRM AI Pro
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-6 py-3 mx-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center px-0 mx-6'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-12 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
};
