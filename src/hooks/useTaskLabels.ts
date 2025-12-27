import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TaskLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTaskLabels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const labelsQuery = useQuery({
    queryKey: ['task-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_labels')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TaskLabel[];
    },
    enabled: !!user,
  });

  const createLabel = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('task_labels')
        .insert({
          name,
          color,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
      toast({ title: 'Label criada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
      toast({ title: 'Label removida!' });
    },
  });

  const assignLabel = useMutation({
    mutationFn: async ({ taskId, labelId }: { taskId: string; labelId: string }) => {
      const { error } = await supabase
        .from('task_label_assignments')
        .insert({ task_id: taskId, label_id: labelId });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-label-assignments'] });
    },
  });

  const removeLabel = useMutation({
    mutationFn: async ({ taskId, labelId }: { taskId: string; labelId: string }) => {
      const { error } = await supabase
        .from('task_label_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('label_id', labelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-label-assignments'] });
    },
  });

  return {
    labels: labelsQuery.data ?? [],
    isLoading: labelsQuery.isLoading,
    createLabel,
    deleteLabel,
    assignLabel,
    removeLabel,
  };
}

export function useTaskLabelAssignments(taskId: string) {
  const { labels } = useTaskLabels();

  const assignmentsQuery = useQuery({
    queryKey: ['task-label-assignments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_label_assignments')
        .select('label_id')
        .eq('task_id', taskId);

      if (error) throw error;
      return data.map(a => a.label_id);
    },
    enabled: !!taskId,
  });

  const assignedLabels = labels.filter(l => 
    (assignmentsQuery.data ?? []).includes(l.id)
  );

  return {
    assignedLabels,
    labelIds: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
  };
}
