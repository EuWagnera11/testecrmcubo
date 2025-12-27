import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  notify_tasks: boolean;
  notify_payments: boolean;
  notify_messages: boolean;
  notify_contracts: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (data: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (existing) {
        const { data: result, error } = await supabase
          .from('notification_preferences')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('user_id', user!.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('notification_preferences')
          .insert({
            ...data,
            user_id: user!.id,
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({ title: 'Preferências atualizadas!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar preferências',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await updatePreferences.mutateAsync({ push_enabled: true });
      toast({ title: 'Notificações push ativadas!' });
      return true;
    } else {
      toast({
        title: 'Permissão negada',
        description: 'Você pode alterar isso nas configurações do navegador.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const preferences = preferencesQuery.data ?? {
    push_enabled: false,
    email_enabled: true,
    notify_tasks: true,
    notify_payments: true,
    notify_messages: true,
    notify_contracts: true,
  };

  return {
    preferences,
    isLoading: preferencesQuery.isLoading,
    updatePreferences,
    requestPushPermission,
  };
}
