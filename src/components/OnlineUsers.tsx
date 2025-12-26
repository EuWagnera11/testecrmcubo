import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PresenceUser } from '@/hooks/useProjectPresence';
import { cn } from '@/lib/utils';

interface OnlineUsersProps {
  users: PresenceUser[];
  className?: string;
}

export function OnlineUsers({ users, className }: OnlineUsersProps) {
  if (users.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-sm text-muted-foreground font-body">
          {users.length} online
        </span>
      </div>
      
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-success/30 cursor-pointer">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
              <p className="text-xs text-muted-foreground">Editando agora</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {users.length > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium cursor-pointer">
                +{users.length - 5}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{users.length - 5} mais online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
