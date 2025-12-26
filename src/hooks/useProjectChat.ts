import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export const useProjectChat = (projectId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch user profiles for messages
    const userIds = [...new Set(data.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const messagesWithUsers = data.map(msg => ({
      ...msg,
      user_name: profileMap.get(msg.user_id)?.full_name || 'Usuário',
      user_avatar: profileMap.get(msg.user_id)?.avatar_url
    }));

    setMessages(messagesWithUsers);
    setLoading(false);
  }, [projectId]);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return;

    fetchMessages();

    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Fetch user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();

          const messageWithUser = {
            ...newMessage,
            user_name: profile?.full_name || 'Usuário',
            user_avatar: profile?.avatar_url
          };

          setMessages(prev => [...prev, messageWithUser]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchMessages]);

  return { messages, loading, sendMessage };
};
