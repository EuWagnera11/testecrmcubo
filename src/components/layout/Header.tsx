import { Menu, LogOut, Settings, User, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/hooks/useTheme';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin, isDirector } = useUserRole();
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarUrl = profile?.avatar_url || undefined;
  const displayName = user?.user_metadata?.full_name || 'Usuário';
  const roleName = isAdmin ? 'Administrador' : isDirector ? 'Diretor' : 'Membro';

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 lg:hidden">
            <span className="font-extrabold tracking-widest text-sm">CUBO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationDropdown />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === 'system' ? 'Tema do sistema' : isDark ? 'Modo escuro' : 'Modo claro'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-border/50 hover:ring-primary/40 transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-0" align="end" sideOffset={8}>
              {/* User info header */}
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                    <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">{displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    <span className="text-[10px] font-medium text-primary mt-0.5">{roleName}</span>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2 py-2.5 px-3 cursor-pointer">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2 py-2.5 px-3 cursor-pointer">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-0" />

              <div className="p-1">
                <DropdownMenuItem onClick={signOut} className="gap-2 py-2.5 px-3 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Sair da conta</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
