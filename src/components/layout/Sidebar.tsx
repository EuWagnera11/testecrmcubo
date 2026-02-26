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
  BarChart3,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios', directorOnly: true },
  { icon: Users, label: 'Clínicas', path: '/clientes' },
  { icon: FolderKanban, label: 'Projetos', path: '/projetos' },
  { icon: FileText, label: 'Contratos', path: '/contratos' },
  { icon: Wallet, label: 'Financeiro', path: '/financeiro', directorOnly: true },
  { icon: GraduationCap, label: 'Estudos', path: '/estudos' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, isDirector } = useUserRole();
  
  const filteredNavItems = navItems.filter(item => {
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
          "fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 overflow-hidden border-r border-sidebar-border",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Watermark decoration */}
        <span className="absolute -bottom-6 -right-8 text-[8rem] font-serif italic font-semibold text-sidebar-foreground/[0.03] select-none pointer-events-none leading-none z-0">
          C
        </span>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center border-b border-sidebar-border",
            isCollapsed ? "h-16 flex-col justify-center py-3 px-2" : "h-16 justify-between px-5"
          )}>
            <div className="flex items-center gap-2">
              {/* CUBO text logo matching institutional site */}
              <span className={cn(
                "font-extrabold tracking-widest text-sidebar-foreground",
                isCollapsed ? "text-sm" : "text-lg"
              )}>
                CUBO
              </span>
            </div>
            
            {/* Mobile close */}
            {!isCollapsed && (
              <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Desktop collapse */}
            {!isCollapsed && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleCollapse}
                className="hidden lg:flex h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Expand button when collapsed */}
          {isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex mx-auto mt-2 h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
            </Button>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-0.5 px-2">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/dashboard' && location.pathname === '/');
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => onClose()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                        "hover:bg-sidebar-accent",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                        !isActive && "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
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
            <div className="p-3 border-t border-sidebar-border">
              <p className="text-[10px] text-sidebar-foreground/30 text-center tracking-wider uppercase">
                Cubo v1.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
