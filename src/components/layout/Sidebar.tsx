import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings,
  X,
  ChevronLeft,
  Wallet,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import refineLogo from '@/assets/refine-logo.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'Relatórios', path: '/admin', adminOnly: true },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: FolderKanban, label: 'Projetos', path: '/projetos' },
  { icon: FileText, label: 'Contratos', path: '/contratos' },
  { icon: Wallet, label: 'Financeiro', path: '/financeiro', directorOnly: true },
  { icon: Users, label: 'Pagamentos', path: '/pagamentos', directorOnly: true },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, isDirector } = useUserRole();
  
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) return isAdmin || isDirector;
    if (item.directorOnly) return isAdmin || isDirector;
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-72",
          "w-72"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center border-b border-sidebar-border",
            isCollapsed ? "h-14 justify-center px-2" : "h-20 justify-between px-6"
          )}>
            {!isCollapsed && (
              <img src={refineLogo} alt="Refine" className="h-10 w-auto" />
            )}
            {isCollapsed && (
              <span className="font-bold text-lg text-sidebar-primary">R</span>
            )}
            
            {/* Mobile close */}
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent">
              <X className="h-5 w-5" />
            </Button>
            
            {/* Desktop collapse */}
            {!isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleCollapse}
                className="hidden lg:flex h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Expand button when collapsed */}
          {isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex mx-auto mt-2 h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/dashboard' && location.pathname === '/');
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => onClose()}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                        !isActive && "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/50 text-center">
                v1.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
