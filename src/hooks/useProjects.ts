import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { projectSchema } from '@/lib/validation';
import { sanitizeForStorage, sanitizeNumber } from '@/lib/sanitize';
import { logAuditEvent } from '@/hooks/useAuditLog';

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  currency: string;
  total_value: number;
  advance_payment: boolean;
  advance_percentage: number;
  deadline: string | null;
  status: 'active' | 'completed' | 'paused' | 'inactive';
  project_type: string;
  project_types: string[] | null;
  share_token: string | null;
  share_enabled: boolean | null;
  cancelled_at: string | null;
  static_creatives: number | null;
  carousel_creatives: number | null;
  monthly_budget: number | null;
  target_cpa: number | null;
  target_roas: number | null;
  target_cpl: number | null;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateProjectData {
  name: string;
  client_id?: string;
  currency: string;
  total_value: number;
  advance_payment?: boolean;
  advance_percentage?: number;
  deadline?: string;
  status?: 'active' | 'completed' | 'paused' | 'inactive';
  project_type?: string;
  project_types?: string[];
  cancelled_at?: string | null;
  static_creatives?: number;
  carousel_creatives?: number;
  monthly_budget?: number;
  target_cpa?: number;
  target_roas?: number;
  target_cpl?: number;
}

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const projectsQuery = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: '🎉 Projeto criado!',
        description: 'Seu novo projeto foi adicionado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...projectData }: Partial<Project> & { id: string }) => {
      // Sanitize input data
      const sanitizedData: Record<string, unknown> = { ...projectData };
      if (projectData.name) sanitizedData.name = sanitizeForStorage(projectData.name, 200);
      if (projectData.total_value !== undefined) {
        sanitizedData.total_value = sanitizeNumber(projectData.total_value, 0, 999999999);
      }
      if (projectData.advance_percentage !== undefined) {
        sanitizedData.advance_percentage = sanitizeNumber(projectData.advance_percentage, 0, 100);
      }

      const { data, error } = await supabase
        .from('projects')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await logAuditEvent({
        action: 'data_update',
        tableName: 'projects',
        recordId: id,
        newData: sanitizedData,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Projeto atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw error;

      // PostgREST may return success with 0 rows when RLS blocks the operation.
      if (!data || data.length === 0) {
        throw new Error('Não foi possível remover este projeto (sem permissão ou projeto inexistente).');
      }

      await logAuditEvent({
        action: 'data_delete',
        tableName: 'projects',
        recordId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Projeto removido',
        description: 'O projeto foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover projeto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    deleteProject,
  };
}
