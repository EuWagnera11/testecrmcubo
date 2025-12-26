import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  user_name?: string;
  user_avatar?: string;
}

interface TypingUser {
  user_id: string;
  user_name: string;
}

export const useProjectChat = (projectId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
  const sendMessage = async (content: string, file?: { url: string; name: string; type: string }) => {
    if (!user || (!content.trim() && !file)) return;

    const { error } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim() || (file ? `📎 ${file.name}` : ''),
        file_url: file?.url || null,
        file_name: file?.name || null,
        file_type: file?.type || null
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    // Stop typing indicator
    stopTyping();
  };

  // Upload file
  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string }> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${projectId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Create signed URL instead of public URL
    const { data: signedUrlData } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiration

    return {
      url: signedUrlData?.signedUrl || '',
      name: file.name,
      type: file.type
    };
  };

  // Typing indicator - start typing
  const startTyping = useCallback(async () => {
    if (!channelRef.current || !user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    channelRef.current.track({
      user_id: user.id,
      user_name: profile?.full_name || 'Usuário',
      typing: true
    });

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [user]);

  // Typing indicator - stop typing
  const stopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    channelRef.current.track({
      user_id: user.id,
      typing: false
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId || !user) return;

    fetchMessages();

    // Create channel for messages and presence
    const channel = supabase.channel(`project-chat-${projectId}`);
    channelRef.current = channel;

    // Listen for new messages
    channel.on(
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
    );

    // Listen for typing presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typing: TypingUser[] = [];

      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          if (presence.typing && presence.user_id !== user.id) {
            typing.push({
              user_id: presence.user_id,
              user_name: presence.user_name
            });
          }
        });
      });

      setTypingUsers(typing);
    });

    channel.subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [projectId, user, fetchMessages]);

  return { 
    messages, 
    loading, 
    sendMessage, 
    uploadFile,
    typingUsers,
    startTyping,
    stopTyping
  };
};
