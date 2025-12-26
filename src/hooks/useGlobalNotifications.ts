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
