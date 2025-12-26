import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: string;
  project_id: string;
  user_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  assigned_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
}

export function useProjectTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tasksQuery = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data: tasksData, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId!)
        .order('position', { ascending: true });
      
      if (error) throw error;

      // Fetch profiles for assigned users
      const assignedUserIds = tasksData
        .map(t => t.assigned_to)
        .filter((id): id is string => !!id);

      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      
      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', assignedUserIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      return tasksData.map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        assigned_profile: task.assigned_to ? profilesMap[task.assigned_to] || null : null,
      })) as ProjectTask[];
    },
    enabled: !!projectId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      // Get max position
      const { data: maxPosData } = await supabase
        .from('project_tasks')
        .select('position')
        .eq('project_id', projectId!)
        .eq('status', data.status || 'todo')
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPosData?.position ?? -1) + 1;

      const { data: task, error } = await supabase
        .from('project_tasks')
        .insert({
          ...data,
          project_id: projectId!,
          user_id: user!.id,
          position: newPosition,
        })
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Tarefa criada!',
        description: 'A tarefa foi adicionada ao quadro.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProjectTask> & { id: string }) => {
      const { data: task, error } = await supabase
        .from('project_tasks')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Tarefa removida',
        description: 'A tarefa foi removida do quadro.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, newStatus, newPosition }: { taskId: string; newStatus: TaskStatus; newPosition: number }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus, position: newPosition })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}
