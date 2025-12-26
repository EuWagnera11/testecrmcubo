import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PayoutWithProject {
  id: string;
  project_id: string;
  user_id: string | null;
  role: string;
  member_name: string | null;
  amount: number;
  description: string | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  projects: {
    id: string;
    name: string;
  } | null;
}

export function useAllPayouts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const payoutsQuery = useQuery({
    queryKey: ['all-payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_payouts')
        .select(`
          *,
          projects (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PayoutWithProject[];
    },
    enabled: !!user,
  });

  const updatePayout = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; paid?: boolean; paid_at?: string | null }) => {
      const { error } = await supabase
        .from('project_payouts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['project-payouts'] });
      toast({ title: 'Repasse atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar repasse', description: error.message, variant: 'destructive' });
    },
  });

  const deletePayout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_payouts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['project-payouts'] });
      toast({ title: 'Repasse removido' });
    },
  });

  const pendingPayouts = payoutsQuery.data?.filter(p => !p.paid) ?? [];
  const paidPayouts = payoutsQuery.data?.filter(p => p.paid) ?? [];
  const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid = paidPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    payouts: payoutsQuery.data ?? [],
    pendingPayouts,
    paidPayouts,
    totalPending,
    totalPaid,
    isLoading: payoutsQuery.isLoading,
    updatePayout,
    deletePayout,
  };
}
