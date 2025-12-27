import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ClientInteraction {
  id: string;
  client_id: string;
  user_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp';
  title: string;
  description: string | null;
  interaction_date: string;
  created_at: string;
}

export interface CreateInteractionData {
  client_id: string;
  type: ClientInteraction['type'];
  title: string;
  description?: string;
  interaction_date?: string;
}

export function useClientInteractions(clientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const interactionsQuery = useQuery({
    queryKey: ['client-interactions', clientId],
    queryFn: async () => {
      let query = supabase
        .from('client_interactions')
        .select('*')
        .order('interaction_date', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClientInteraction[];
    },
    enabled: !!user,
  });

  const createInteraction = useMutation({
    mutationFn: async (data: CreateInteractionData) => {
      const { data: result, error } = await supabase
        .from('client_interactions')
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-interactions'] });
      toast({ title: 'Interação registrada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar interação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-interactions'] });
      toast({ title: 'Interação removida!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover interação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    interactions: interactionsQuery.data ?? [],
    isLoading: interactionsQuery.isLoading,
    error: interactionsQuery.error,
    createInteraction,
    deleteInteraction,
  };
}
