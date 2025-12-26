import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

export function useProjectPresence(projectId?: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const trackPresence = useCallback(async (ch: RealtimeChannel) => {
    if (!user || !profile) return;

    const userStatus: PresenceUser = {
      id: user.id,
      name: profile.full_name || user.email?.split('@')[0] || 'Usuário',
      avatar_url: profile.avatar_url || undefined,
      online_at: new Date().toISOString(),
    };

    console.log('[Presence] Tracking user:', userStatus.name);
    
    const status = await ch.track(userStatus);
    console.log('[Presence] Track status:', status);
  }, [user, profile]);

  useEffect(() => {
    if (!projectId || !user) {
      console.log('[Presence] Missing projectId or user');
      return;
    }

    console.log('[Presence] Setting up presence for project:', projectId);

    const ch = supabase.channel(`project-presence-${projectId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      console.log('[Presence] Sync state:', state);
      
      const users: PresenceUser[] = [];
      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          if (presence.id !== user.id) { // Exclude current user
            users.push(presence as PresenceUser);
          }
        });
      });
      
      setOnlineUsers(users);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Presence] User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[Presence] User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      console.log('[Presence] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        await trackPresence(ch);
      }
    });

    setChannel(ch);

    return () => {
      console.log('[Presence] Cleaning up presence for project:', projectId);
      ch.unsubscribe();
    };
  }, [projectId, user, trackPresence]);

  // Re-track when profile changes
  useEffect(() => {
    if (channel && profile) {
      trackPresence(channel);
    }
  }, [channel, profile, trackPresence]);

  return { onlineUsers };
}
