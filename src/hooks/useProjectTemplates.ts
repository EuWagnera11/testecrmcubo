import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProjectTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: string;
  default_fields: Record<string, unknown>;
  default_tasks: Array<{
    title: string;
    description?: string;
    priority: string;
    status: string;
  }>;
  default_value: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  project_type?: string;
  default_fields?: Record<string, unknown>;
  default_tasks?: ProjectTemplate['default_tasks'];
  default_value?: number;
  currency?: string;
}

export function useProjectTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const templatesQuery = useQuery({
    queryKey: ['project-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const { data: result, error } = await supabase
        .from('project_templates')
        .insert({
          name: data.name,
          description: data.description || null,
          project_type: data.project_type || 'one_time',
          default_fields: data.default_fields ? JSON.parse(JSON.stringify(data.default_fields)) : {},
          default_tasks: data.default_tasks ? JSON.parse(JSON.stringify(data.default_tasks)) : [],
          default_value: data.default_value || 0,
          currency: data.currency || 'BRL',
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast({ title: 'Template criado!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateTemplateData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.project_type) updateData.project_type = data.project_type;
      if (data.default_fields) updateData.default_fields = JSON.parse(JSON.stringify(data.default_fields));
      if (data.default_tasks) updateData.default_tasks = JSON.parse(JSON.stringify(data.default_tasks));
      if (data.default_value !== undefined) updateData.default_value = data.default_value;
      if (data.currency) updateData.currency = data.currency;

      const { data: result, error } = await supabase
        .from('project_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast({ title: 'Template atualizado!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast({ title: 'Template removido!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
