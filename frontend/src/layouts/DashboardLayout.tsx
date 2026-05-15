import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { useSidebarStore } from '../store/sidebarStore';
import { cn } from '../utils/cn';

export const DashboardLayout: React.FC = () => {
  const { isCollapsed, isFullScreen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      {!isFullScreen && <Sidebar />}
      {!isFullScreen && <TopBar />}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          !isFullScreen ? (isCollapsed ? 'ml-20 pt-16' : 'ml-64 pt-16') : 'ml-0 pt-0'
        )}
      >
        <div className={cn(isFullScreen ? 'p-0' : 'p-6')}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
