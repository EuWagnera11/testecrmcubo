import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export const useMessageReactions = (projectId: string) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, ReactionSummary[]>>({});

  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;

    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    // Group reactions by message and emoji
    const grouped: Record<string, ReactionSummary[]> = {};
    
    messageIds.forEach(msgId => {
      const msgReactions = data?.filter(r => r.message_id === msgId) || [];
      const emojiMap = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();
      
      msgReactions.forEach(r => {
        const existing = emojiMap.get(r.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(r.user_id);
          if (r.user_id === user?.id) existing.hasReacted = true;
        } else {
          emojiMap.set(r.emoji, {
            count: 1,
            users: [r.user_id],
            hasReacted: r.user_id === user?.id
          });
        }
      });

      grouped[msgId] = Array.from(emojiMap.entries()).map(([emoji, data]) => ({
        emoji,
        ...data
      }));
    });

    setReactions(grouped);
  }, [user?.id]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const currentReactions = reactions[messageId] || [];
    const existingReaction = currentReactions.find(r => r.emoji === emoji && r.hasReacted);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        return;
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (error) {
        console.error('Error adding reaction:', error);
        return;
      }
    }
  };

  // Subscribe to real-time reactions
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`reactions-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        () => {
          // Refetch reactions when changes occur
          const messageIds = Object.keys(reactions);
          if (messageIds.length) {
            fetchReactions(messageIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchReactions, reactions]);

  return {
    reactions,
    fetchReactions,
    toggleReaction
  };
};

export const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];
