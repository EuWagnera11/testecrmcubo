import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WhatsAppTag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface WhatsAppConversationTag {
  id: string;
  conversation_id: string;
  tag_id: string;
  created_at: string;
  tag?: WhatsAppTag;
}

export function useWhatsAppTags() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['whatsapp-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as WhatsAppTag[];
    },
    enabled: !!user,
  });

  const createTag = useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_tags')
        .insert({ ...tag, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-tags'] }),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-tags'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation-tags'] });
    },
  });

  return { ...query, tags: query.data ?? [], createTag, deleteTag };
}

export function useConversationTags(conversationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-conversation-tags', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversation_tags')
        .select('*, tag:whatsapp_tags(*)')
        .eq('conversation_id', conversationId!);
      if (error) throw error;
      return data as (WhatsAppConversationTag & { tag: WhatsAppTag })[];
    },
    enabled: !!conversationId,
  });

  const addTag = useMutation({
    mutationFn: async ({ conversationId, tagId }: { conversationId: string; tagId: string }) => {
      const { error } = await supabase
        .from('whatsapp_conversation_tags')
        .insert({ conversation_id: conversationId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation-tags'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-all-conversation-tags'] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async ({ conversationId, tagId }: { conversationId: string; tagId: string }) => {
      const { error } = await supabase
        .from('whatsapp_conversation_tags')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation-tags'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-all-conversation-tags'] });
    },
  });

  return { ...query, conversationTags: query.data ?? [], addTag, removeTag };
}

// Bulk fetch all conversation tags for the inbox list
export function useAllConversationTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-all-conversation-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversation_tags')
        .select('conversation_id, tag:whatsapp_tags(id, name, color)');
      if (error) throw error;

      const map: Record<string, WhatsAppTag[]> = {};
      for (const row of data ?? []) {
        const cid = row.conversation_id;
        if (!map[cid]) map[cid] = [];
        if (row.tag) map[cid].push(row.tag as WhatsAppTag);
      }
      return map;
    },
    enabled: !!user,
  });
}
