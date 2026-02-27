import { Bell, Check, CheckCheck, Trash2, FolderPlus, UserPlus, MessageSquare, ListTodo, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'project_created':
    case 'project_updated':
      return <FolderPlus className="h-4 w-4 text-primary" />;
    case 'client_created':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'task_assigned':
      return <ListTodo className="h-4 w-4 text-orange-500" />;
    case 'message_received':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'whatsapp_new_contact':
      return <MessageCircle className="h-4 w-4 text-emerald-500" />;
    case 'whatsapp_handoff':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'whatsapp_message':
      return <MessageCircle className="h-4 w-4 text-emerald-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type?.startsWith('whatsapp_')) {
      navigate('/whatsapp');
    } else if (notification.data?.projectId) {
      navigate(`/projetos/${notification.data.projectId}`);
    } else if (notification.data?.clientId) {
      navigate('/clientes');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-semibold text-sm">Notificações</span>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={markAllAsRead}
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={clearAll}
                title="Limpar todas"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(notification.createdAt, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
