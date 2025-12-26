import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useChatNotifications = () => {
  const { user } = useAuth();
  const currentProjectRef = useRef<string | null>(null);

  // Set current project to avoid notifying on current chat
  const setCurrentProject = (projectId: string | null) => {
    currentProjectRef.current = projectId;
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages'
        },
        async (payload) => {
          const message = payload.new as {
            id: string;
            project_id: string;
            user_id: string;
            content: string;
          };

          // Don't notify if it's from current user or current project
          if (message.user_id === user.id) return;
          if (message.project_id === currentProjectRef.current) return;

          // Check if user is member of the project
          const { data: membership } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', message.project_id)
            .eq('user_id', user.id)
            .single();

          const { data: projectOwner } = await supabase
            .from('projects')
            .select('user_id, name')
            .eq('id', message.project_id)
            .single();

          const isMember = !!membership;
          const isOwner = projectOwner?.user_id === user.id;

          if (!isMember && !isOwner) return;

          // Get sender name
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', message.user_id)
            .single();

          const senderName = senderProfile?.full_name || 'Alguém';
          const projectName = projectOwner?.name || 'um projeto';

          toast.info(`${senderName} enviou uma mensagem em ${projectName}`, {
            description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = `/projetos/${message.project_id}`;
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { setCurrentProject };
};
