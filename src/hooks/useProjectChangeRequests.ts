import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectChangeRequest {
  id: string;
  project_id: string;
  description: string;
  requested_at: string;
  status: 'pending' | 'completed' | 'rejected';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChangeRequestData {
  project_id: string;
  description: string;
  requested_at?: string;
  notes?: string;
}

export function useProjectChangeRequests(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const changeRequestsQuery = useQuery({
    queryKey: ['project-change-requests', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_change_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as ProjectChangeRequest[];
    },
    enabled: !!projectId && !!user,
  });

  const createChangeRequest = useMutation({
    mutationFn: async (data: CreateChangeRequestData) => {
      const { error } = await supabase
        .from('project_change_requests')
        .insert({
          ...data,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-change-requests', projectId] });
      toast.success('Alteração registrada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating change request:', error);
      toast.error('Erro ao registrar alteração');
    },
  });

  const updateChangeRequest = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProjectChangeRequest> & { id: string }) => {
      const { error } = await supabase
        .from('project_change_requests')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-change-requests', projectId] });
      toast.success('Alteração atualizada');
    },
    onError: (error) => {
      console.error('Error updating change request:', error);
      toast.error('Erro ao atualizar alteração');
    },
  });

  const deleteChangeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_change_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-change-requests', projectId] });
      toast.success('Alteração removida');
    },
    onError: (error) => {
      console.error('Error deleting change request:', error);
      toast.error('Erro ao remover alteração');
    },
  });

  return {
    changeRequests: changeRequestsQuery.data ?? [],
    isLoading: changeRequestsQuery.isLoading,
    createChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
  };
}
