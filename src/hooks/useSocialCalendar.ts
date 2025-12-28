import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

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
  post_url: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  reach: number | null;
  impressions: number | null;
  saves: number | null;
  engagement_rate: number | null;
  metrics_updated_at: string | null;
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

  // Check for upcoming posts and show notifications
  useEffect(() => {
    if (!query.data) return;
    
    const now = new Date();
    const upcomingPosts = query.data.filter(post => {
      if (post.status !== 'scheduled') return false;
      
      const postDate = new Date(post.scheduled_date);
      if (post.scheduled_time) {
        const [hours, minutes] = post.scheduled_time.split(':');
        postDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      const timeDiff = postDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Notify if post is within 24 hours
      return hoursDiff > 0 && hoursDiff <= 24;
    });

    if (upcomingPosts.length > 0) {
      const postTitles = upcomingPosts.slice(0, 3).map(p => p.title).join(', ');
      const moreText = upcomingPosts.length > 3 ? ` e mais ${upcomingPosts.length - 3}` : '';
      
      toast({
        title: `${upcomingPosts.length} post${upcomingPosts.length > 1 ? 's' : ''} próximo${upcomingPosts.length > 1 ? 's' : ''} de publicar`,
        description: `${postTitles}${moreText}`,
      });
    }
  }, [query.data, toast]);

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

  const updateMetrics = useMutation({
    mutationFn: async ({ id, metrics }: { 
      id: string; 
      metrics: {
        post_url?: string;
        likes?: number;
        comments?: number;
        shares?: number;
        reach?: number;
        impressions?: number;
        saves?: number;
        engagement_rate?: number;
      }
    }) => {
      const { data: updated, error } = await supabase
        .from('project_social_calendar')
        .update({ 
          ...metrics, 
          metrics_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar', projectId] });
      toast({ title: 'Métricas atualizadas!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar métricas', description: error.message, variant: 'destructive' });
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

  // Get posts that need attention (upcoming scheduled)
  const upcomingPosts = (query.data ?? []).filter(post => {
    if (post.status !== 'scheduled') return false;
    const postDate = new Date(post.scheduled_date);
    const now = new Date();
    const timeDiff = postDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 48;
  });

  return { 
    posts: query.data ?? [], 
    isLoading: query.isLoading, 
    upcomingPosts,
    createPost, 
    updatePost,
    updateMetrics,
    deletePost 
  };
}
