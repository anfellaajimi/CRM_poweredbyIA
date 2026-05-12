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
  ChevronRight,
  MessageSquare,
  Sparkles,
  ChevronDown
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
  { icon: Activity, label: "Automate d'Alertes", path: '/alert-automaton' },
  {
    icon: Sparkles,
    label: 'Intelligence Artificielle',
    path: '/ai-monitoring',
    children: [
      { label: 'Allocation IA', path: '/ai-monitoring' },
      { label: 'Prédictions IA', path: '/ai-predictions' }
    ]
  },
  { icon: Bell, label: 'Rappels', path: '/rappels' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Settings, label: 'Users', path: '/users' }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['Intelligence Artificielle']);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

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
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label);
            const isActive = location.pathname === item.path || (hasChildren && item.children?.some(c => location.pathname === c.path));

            if (hasChildren && !isCollapsed) {
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'flex items-center w-[calc(100%-24px)] px-6 py-3 mx-3 rounded-lg transition-colors text-left',
                      isActive && !isExpanded
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="ml-3 flex-1">{item.label}</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-9 space-y-1">
                      {item.children?.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              'flex items-center px-4 py-2 mr-3 rounded-lg transition-colors text-sm',
                              isChildActive
                                ? 'text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-6 py-3 mx-3 rounded-lg transition-colors mb-1',
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
