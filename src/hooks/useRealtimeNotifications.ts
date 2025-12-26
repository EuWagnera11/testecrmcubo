import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleFieldUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Field update received:', payload);
    
    // Don't notify if the current user made the change
    if (payload.new?.last_edited_by === user?.id) {
      console.log('[Realtime] Skipping notification - same user');
      return;
    }

    const fieldType = payload.new?.field_type;
    const fieldLabel = fieldTypeLabels[fieldType] || fieldType || 'Campo';

    // Get the editor's name
    let editorName = 'Alguém';
    if (payload.new?.last_edited_by) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', payload.new.last_edited_by)
          .single();
        
        if (profile?.full_name) {
          editorName = profile.full_name.split(' ')[0];
        }
      } catch (err) {
        console.error('[Realtime] Error fetching profile:', err);
      }
    }

    console.log('[Realtime] Showing notification for:', editorName, fieldLabel);
    
    toast({
      title: `${editorName} editou ${fieldLabel}`,
      description: 'O campo foi atualizado no projeto.',
    });

    // Invalidate the fields query to refresh data
    queryClient.invalidateQueries({ queryKey: ['project-fields', projectId] });
  }, [user?.id, toast, queryClient, projectId]);

  useEffect(() => {
    if (!projectId || !user) {
      console.log('[Realtime] Missing projectId or user, skipping subscription');
      return;
    }

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('[Realtime] Setting up subscription for project:', projectId);

    const channel = supabase
      .channel(`project-fields-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'project_fields',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] Received event:', payload.eventType);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            handleFieldUpdate(payload);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status);
        if (err) {
          console.error('[Realtime] Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to project:', projectId);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Cleaning up subscription for project:', projectId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId, user, handleFieldUpdate]);
}
