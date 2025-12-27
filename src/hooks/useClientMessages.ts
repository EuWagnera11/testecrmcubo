import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ClientMessage {
  id: string;
  project_id: string;
  share_token: string;
  sender_name: string | null;
  sender_email: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useClientMessages(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const messagesQuery = useQuery({
    queryKey: ['client-messages', projectId],
    queryFn: async () => {
      let query = supabase
        .from('client_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClientMessage[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-messages'] });
          toast({
            title: 'Nova mensagem do cliente!',
            description: 'Você recebeu uma nova mensagem no dashboard compartilhado.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('client_messages')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
    },
  });

  const messages = messagesQuery.data ?? [];
  const unreadCount = messages.filter(m => !m.is_read).length;

  return {
    messages,
    unreadCount,
    isLoading: messagesQuery.isLoading,
    markAsRead,
    markAllAsRead,
  };
}

// Hook for public client dashboard (no auth required)
export function usePublicClientMessage() {
  const { toast } = useToast();

  const sendMessage = async (data: {
    project_id: string;
    share_token: string;
    sender_name?: string;
    sender_email?: string;
    content: string;
  }) => {
    const { error } = await supabase
      .from('client_messages')
      .insert(data);

    if (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Mensagem enviada!' });
    return true;
  };

  return { sendMessage };
}
