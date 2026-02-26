import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: Attachment[];
}

function sanitizeStorageFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const rawName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';

  const normalizedName = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `${normalizedName || 'arquivo'}${extension}`;
}

export function useAIChat() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const idCounter = useRef(0);

  const createConversation = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('ai_chat_conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select('id')
      .single();
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    setConversationId(data.id);
    return data.id;
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return [];
    const { data } = await supabase
      .from('ai_chat_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    return data || [];
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('ai_chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at');
    if (data) {
      setMessages(data.map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
      setConversationId(convId);
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    if (!user) return null;
    const safeFileName = sanitizeStorageFileName(file.name);
    const path = `${user.id}/${Date.now()}-${safeFileName}`;
    const { error } = await supabase.storage.from('ai-chat-files').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('ai-chat-files').getPublicUrl(path);
    return { name: file.name, url: urlData.publicUrl, type: file.type };
  }, [user]);

  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if ((!content.trim() && (!attachments || !attachments.length)) || !session) return;

    // Build content with attachment references for the AI
    let fullContent = content;
    if (attachments?.length) {
      const attachmentText = attachments.map(a => `[Arquivo anexado: ${a.name}](${a.url})`).join('\n');
      fullContent = content ? `${content}\n\n${attachmentText}` : attachmentText;
    }

    const userMsg: Message = {
      id: `temp-${++idCounter.current}`,
      role: 'user',
      content: fullContent,
      created_at: new Date().toISOString(),
      attachments,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation();
      }

      const historyMessages = [...messages.slice(-18), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const currentProjectId =
        typeof window !== 'undefined'
          ? window.location.pathname.match(/\/projetos\/([0-9a-fA-F-]{36})/)?.[1] ?? null
          : null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: historyMessages,
            conversation_id: convId,
            current_project_id: currentProjectId,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `temp-${++idCounter.current}`,
        role: 'assistant',
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (convId && messages.length === 0) {
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        await supabase
          .from('ai_chat_conversations')
          .update({ title })
          .eq('id', convId);
      }
    } catch (error: any) {
      console.error('AI Chat error:', error);
      const errorMsg: Message = {
        id: `temp-${++idCounter.current}`,
        role: 'assistant',
        content: `❌ Erro: ${error.message}. Tente novamente.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [session, conversationId, messages, createConversation]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    uploadFile,
    clearChat,
    conversationId,
    loadConversations,
    loadMessages,
  };
}