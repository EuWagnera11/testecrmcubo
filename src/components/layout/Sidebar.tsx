import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings,
  X,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: FolderKanban, label: 'Projetos', path: '/projetos' },
  { icon: FileText, label: 'Contratos', path: '/contratos' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border lg:hidden">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RC</span>
              </div>
              <span className="font-bold">REFINE CUBO</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop collapse button */}
          <div className="hidden lg:flex items-center justify-end h-16 px-2 border-b border-sidebar-border">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/dashboard' && location.pathname === '/');
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => onClose()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive && "bg-primary/10 text-primary border border-primary/20",
                        !isActive && "text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive && "text-primary"
                      )} />
                      {!isCollapsed && (
                        <span className={cn(
                          "font-medium transition-opacity",
                          isCollapsed && "lg:opacity-0 lg:hidden"
                        )}>
                          {item.label}
                        </span>
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
              <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  Versão 1.0.0
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
