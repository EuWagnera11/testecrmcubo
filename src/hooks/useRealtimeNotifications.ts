import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const fieldTypeLabels: Record<string, string> = {
  design: 'Design',
  copy: 'Copywriting',
  traffic: 'Tráfego Pago',
  social_media: 'Social Media',
  general: 'Geral',
};

export function useRealtimeNotifications(projectId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFieldUpdate = useCallback(async (payload: any) => {
    // Don't notify if the current user made the change
    if (payload.new?.last_edited_by === user?.id) return;

    const fieldType = payload.new?.field_type;
    const fieldLabel = fieldTypeLabels[fieldType] || fieldType;

    // Get the editor's name
    let editorName = 'Alguém';
    if (payload.new?.last_edited_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', payload.new.last_edited_by)
        .single();
      
      if (profile?.full_name) {
        editorName = profile.full_name.split(' ')[0];
      }
    }

    toast({
      title: `${editorName} editou ${fieldLabel}`,
      description: 'O campo foi atualizado no projeto.',
    });

    // Invalidate the fields query to refresh data
    queryClient.invalidateQueries({ queryKey: ['project-fields', projectId] });
  }, [user?.id, toast, queryClient, projectId]);

  useEffect(() => {
    if (!projectId || !user) return;

    const channel = supabase
      .channel(`project-fields-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_fields',
          filter: `project_id=eq.${projectId}`,
        },
        handleFieldUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user, handleFieldUpdate]);
}
