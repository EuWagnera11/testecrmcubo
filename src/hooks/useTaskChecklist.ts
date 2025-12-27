import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export function useTaskChecklist(taskId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checklistQuery = useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!taskId,
  });

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      const currentItems = checklistQuery.data ?? [];
      const maxPosition = currentItems.length > 0
        ? Math.max(...currentItems.map(i => i.position))
        : -1;

      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({
          task_id: taskId,
          title,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
    },
  });

  const items = checklistQuery.data ?? [];
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return {
    items,
    isLoading: checklistQuery.isLoading,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    completedCount,
    totalCount,
    progress,
  };
}
