import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'project_created' | 'client_created' | 'task_assigned' | 'message_received' | 'project_updated';
  title: string;
  description: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupRealtimeNotifications = async () => {
      channel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'projects',
          },
          async (payload) => {
            if (payload.new?.user_id === user.id) return;

            let creatorName = 'Alguém';
            if (payload.new?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            }

            addNotification({
              type: 'project_created',
              title: 'Novo projeto criado',
              description: `${creatorName} criou "${payload.new?.name}"`,
              data: { projectId: payload.new?.id },
            });

            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'clients',
          },
          async (payload) => {
            if (payload.new?.user_id === user.id) return;

            let creatorName = 'Alguém';
            if (payload.new?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            }

            addNotification({
              type: 'client_created',
              title: 'Novo cliente cadastrado',
              description: `${creatorName} cadastrou "${payload.new?.name}"`,
              data: { clientId: payload.new?.id },
            });

            queryClient.invalidateQueries({ queryKey: ['clients'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_tasks',
          },
          async (payload) => {
            // Only notify if task is assigned to current user
            if (payload.new?.assigned_to !== user.id) return;
            if (payload.new?.user_id === user.id) return; // Don't notify if user created it

            let creatorName = 'Alguém';
            if (payload.new?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            }

            addNotification({
              type: 'task_assigned',
              title: 'Nova tarefa atribuída',
              description: `${creatorName} atribuiu "${payload.new?.title}" a você`,
              data: { taskId: payload.new?.id, projectId: payload.new?.project_id },
            });

            queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_messages',
          },
          async (payload) => {
            if (payload.new?.user_id === user.id) return;

            // Check if user is a participant in this project
            const { data: membership } = await supabase
              .from('project_members')
              .select('id')
              .eq('project_id', payload.new?.project_id)
              .eq('user_id', user.id)
              .single();

            const { data: isOwner } = await supabase
              .from('projects')
              .select('id')
              .eq('id', payload.new?.project_id)
              .eq('user_id', user.id)
              .single();

            if (!membership && !isOwner) return;

            let senderName = 'Alguém';
            if (payload.new?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                senderName = profile.full_name.split(' ')[0];
              }
            }

            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', payload.new?.project_id)
              .single();

            addNotification({
              type: 'message_received',
              title: 'Nova mensagem',
              description: `${senderName} no projeto "${project?.name || 'Projeto'}"`,
              data: { projectId: payload.new?.project_id, messageId: payload.new?.id },
            });

            queryClient.invalidateQueries({ queryKey: ['project-messages'] });
          }
        )
        .subscribe();
    };

    setupRealtimeNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, addNotification, queryClient]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
