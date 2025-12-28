import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SocialCalendarPost {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  platform: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  media_urls: string[] | null;
  hashtags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSocialCalendar(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['social-calendar', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_social_calendar')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data as SocialCalendarPost[];
    },
    enabled: !!projectId,
  });

  const createPost = useMutation({
    mutationFn: async (data: {
      title: string;
      content?: string;
      platform: string;
      scheduled_date: string;
      scheduled_time?: string | null;
      status?: string;
      hashtags?: string;
      notes?: string;
    }) => {
      const { data: created, error } = await supabase
        .from('project_social_calendar')
        .insert({ 
          project_id: projectId!, 
          ...data 
        })
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar', projectId] });
      toast({ title: 'Post agendado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar post', description: error.message, variant: 'destructive' });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<SocialCalendarPost>) => {
      const { data: updated, error } = await supabase
        .from('project_social_calendar')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar', projectId] });
      toast({ title: 'Post atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_social_calendar')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar', projectId] });
      toast({ title: 'Post removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { 
    posts: query.data ?? [], 
    isLoading: query.isLoading, 
    createPost, 
    updatePost, 
    deletePost 
  };
}
