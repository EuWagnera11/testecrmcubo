import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useGlobalNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('[GlobalNotifications] No user, skipping');
      return;
    }

    console.log('[GlobalNotifications] Setting up global notifications');

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'projects',
        },
        async (payload) => {
          console.log('[GlobalNotifications] New project created:', payload);
          
          // Don't notify if the current user created it
          if (payload.new?.user_id === user.id) {
            console.log('[GlobalNotifications] Skipping - same user');
            return;
          }

          // Get the creator's name
          let creatorName = 'Alguém';
          if (payload.new?.user_id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            } catch (err) {
              console.error('[GlobalNotifications] Error fetching profile:', err);
            }
          }

          toast({
            title: `Novo projeto criado`,
            description: `${creatorName} criou o projeto "${payload.new?.name}"`,
          });

          // Invalidate projects query
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients',
        },
        async (payload) => {
          console.log('[GlobalNotifications] New client created:', payload);
          
          // Don't notify if the current user created it
          if (payload.new?.user_id === user.id) {
            console.log('[GlobalNotifications] Skipping - same user');
            return;
          }

          // Get the creator's name
          let creatorName = 'Alguém';
          if (payload.new?.user_id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            } catch (err) {
              console.error('[GlobalNotifications] Error fetching profile:', err);
            }
          }

          toast({
            title: `Novo cliente cadastrado`,
            description: `${creatorName} cadastrou "${payload.new?.name}"`,
          });

          // Invalidate clients query
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_change_requests',
        },
        async (payload) => {
          console.log('[GlobalNotifications] New change request:', payload);
          
          // Don't notify if the current user created it
          if (payload.new?.created_by === user.id) {
            console.log('[GlobalNotifications] Skipping - same user');
            return;
          }

          // Check if user is a participant in this project
          const { data: membership } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', payload.new?.project_id)
            .eq('user_id', user.id)
            .single();

          const { data: isOwner } = await supabase
            .from('projects')
            .select('id')
            .eq('id', payload.new?.project_id)
            .eq('user_id', user.id)
            .single();

          if (!membership && !isOwner) {
            console.log('[GlobalNotifications] Skipping - not a participant');
            return;
          }

          // Get the creator's name
          let creatorName = 'Alguém';
          if (payload.new?.created_by) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.created_by)
                .single();
              
              if (profile?.full_name) {
                creatorName = profile.full_name.split(' ')[0];
              }
            } catch (err) {
              console.error('[GlobalNotifications] Error fetching profile:', err);
            }
          }

          // Get project name
          let projectName = 'Projeto';
          try {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', payload.new?.project_id)
              .single();
            
            if (project?.name) {
              projectName = project.name;
            }
          } catch (err) {
            console.error('[GlobalNotifications] Error fetching project:', err);
          }

          toast({
            title: `Nova alteração registrada`,
            description: `${creatorName} registrou uma alteração em "${projectName}"`,
          });

          // Invalidate change requests query
          queryClient.invalidateQueries({ queryKey: ['project-change-requests'] });
        }
      )
      .subscribe((status, err) => {
        console.log('[GlobalNotifications] Subscription status:', status);
        if (err) {
          console.error('[GlobalNotifications] Subscription error:', err);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[GlobalNotifications] Cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, toast, queryClient]);
}
