import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CommissionRule {
  id: string;
  name: string;
  description: string | null;
  target_role: string | null;
  target_user_id: string | null;
  calc_type: 'percentage' | 'fixed';
  value: number;
  base_field: 'total_spend' | 'total_revenue' | 'project_value' | 'plan_value' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type CreateCommissionRuleInput = Omit<CommissionRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
export type UpdateCommissionRuleInput = Partial<CreateCommissionRuleInput>;

export function useCommissionRules() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all commission rules
  const rulesQuery = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionRule[];
    },
  });

  // Create a new rule
  const createRule = useMutation({
    mutationFn: async (input: CreateCommissionRuleInput) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Regra criada',
        description: 'A regra de comissão foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update a rule
  const updateRule = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCommissionRuleInput & { id: string }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Regra atualizada',
        description: 'A regra de comissão foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete a rule
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Regra excluída',
        description: 'A regra de comissão foi excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle rule active status
  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.is_active ? 'Regra ativada' : 'Regra desativada',
        description: `A regra "${data.name}" foi ${data.is_active ? 'ativada' : 'desativada'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch: rulesQuery.refetch,
  };
}
