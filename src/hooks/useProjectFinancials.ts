import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProjectAlteration {
  id: string;
  project_id: string;
  alteration_type: string;
  description: string | null;
  value: number;
  created_at: string;
}

export interface ProjectPayout {
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
}

export function useProjectAlterations(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const alterationsQuery = useQuery({
    queryKey: ['project-alterations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_alterations')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectAlteration[];
    },
    enabled: !!user && !!projectId,
  });

  const createAlteration = useMutation({
    mutationFn: async (data: Omit<ProjectAlteration, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('project_alterations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-alterations', projectId] });
      toast({ title: 'Alteração adicionada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar alteração', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAlteration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_alterations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-alterations', projectId] });
      toast({ title: 'Alteração removida' });
    },
  });

  const totalAlterations = alterationsQuery.data?.reduce((sum, a) => sum + Number(a.value), 0) || 0;

  return {
    alterations: alterationsQuery.data ?? [],
    isLoading: alterationsQuery.isLoading,
    totalAlterations,
    createAlteration,
    deleteAlteration,
  };
}

export function useProjectPayouts(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const payoutsQuery = useQuery({
    queryKey: ['project-payouts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_payouts')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectPayout[];
    },
    enabled: !!user && !!projectId,
  });

  const createPayout = useMutation({
    mutationFn: async (data: Omit<ProjectPayout, 'id' | 'created_at' | 'paid_at'>) => {
      const { data: result, error } = await supabase
        .from('project_payouts')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payouts', projectId] });
      toast({ title: 'Repasse adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar repasse', description: error.message, variant: 'destructive' });
    },
  });

  const updatePayout = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProjectPayout> & { id: string }) => {
      const { error } = await supabase
        .from('project_payouts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payouts', projectId] });
      toast({ title: 'Repasse atualizado!' });
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
      queryClient.invalidateQueries({ queryKey: ['project-payouts', projectId] });
      toast({ title: 'Repasse removido' });
    },
  });

  const totalPayouts = payoutsQuery.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return {
    payouts: payoutsQuery.data ?? [],
    isLoading: payoutsQuery.isLoading,
    totalPayouts,
    createPayout,
    updatePayout,
    deletePayout,
  };
}
