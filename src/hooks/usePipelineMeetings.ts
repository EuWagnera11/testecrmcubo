import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PipelineMeeting {
  id: string;
  pipeline_item_id: string;
  scheduled_at: string;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
  status: string;
  created_by: string;
  created_at: string;
}

export function usePipelineMeetings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['pipeline-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_meetings')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as PipelineMeeting[];
    },
    enabled: !!user,
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: Omit<PipelineMeeting, 'id' | 'created_at' | 'confirmation_sent_at' | 'reminder_sent_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('pipeline_meetings')
        .insert({ ...meeting, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineMeeting;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-meetings'] }),
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PipelineMeeting> & { id: string }) => {
      const { error } = await supabase
        .from('pipeline_meetings')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-meetings'] }),
  });

  const notifyMeeting = async (meetingId: string, type: 'confirmation' | 'reminder') => {
    const { data, error } = await supabase.functions.invoke('meeting-notify', {
      body: { meeting_id: meetingId, type },
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['pipeline-meetings'] });
    return data;
  };

  const getMeetingForItem = (pipelineItemId: string) => {
    return (query.data ?? []).find(
      m => m.pipeline_item_id === pipelineItemId && m.status === 'scheduled'
    );
  };

  return {
    ...query,
    meetings: query.data ?? [],
    createMeeting,
    updateMeeting,
    notifyMeeting,
    getMeetingForItem,
  };
}
