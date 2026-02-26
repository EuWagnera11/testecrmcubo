import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enable global notifications for projects, clients, and chat
  useGlobalNotifications();
  useChatNotifications();

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Subtle warm gradient overlay at top — matching institutional site sections */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-cubo-gradient-light pointer-events-none z-0" />
        
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
