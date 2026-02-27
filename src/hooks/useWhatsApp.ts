import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';


// Types
export interface WhatsAppInstance {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  instance_name: string;
  status: string;
  created_by: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  phone: string;
  name: string | null;
  profile_pic_url: string | null;
  assigned_to: string | null;
  source: string;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  instance_id: string;
  status: string;
  assigned_to: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  contact?: WhatsAppContact;
  ai_summary: string | null;
  ai_summary_at: string | null;
  is_bot_active: boolean;
  last_message_preview: string | null;
  bot_paused_until: string | null;
  resolved_at: string | null;
  resolution_reason: string | null;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  external_id: string | null;
  status: string;
  sent_by: string | null;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  created_by: string;
  created_at: string;
}

export function useWhatsAppInstances() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppInstance[];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const createInstance = useMutation({
    mutationFn: async (instance: { name: string; api_url: string; api_key: string; instance_name: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({ ...instance, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }),
  });

  const deleteInstance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_instances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }),
  });

  return { ...query, instances: query.data ?? [], createInstance, deleteInstance };
}

export function useWhatsAppConversations(instanceId?: string) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['whatsapp-conversations', instanceId],
    queryFn: async () => {
      let q = supabase
        .from('whatsapp_conversations')
        .select('*, contact:whatsapp_contacts(*)')
        .order('last_message_at', { ascending: false });

      if (instanceId) {
        q = q.eq('instance_id', instanceId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as (WhatsAppConversation & { contact: WhatsAppContact })[];
    },
    enabled: !!user,
  });

  return { ...query, conversations: query.data ?? [] };
}

export function useWhatsAppMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return { ...query, messages: query.data ?? [] };
}

export function useWhatsAppTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { name: string; content: string; category: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({ ...template, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }),
  });

  return { ...query, templates: query.data ?? [], createTemplate, deleteTemplate };
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceId, phone, message }: { instanceId: string; phone: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { instanceId, phone, message },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-unread-counts'] });
    },
  });
}

export function useTakeOverConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: false, assigned_to: user!.id })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete messages first, then conversation
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .delete()
        .eq('conversation_id', conversationId);
      if (msgError) throw msgError;
      const { error } = await supabase
        .from('whatsapp_conversations')
        .delete()
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, reason }: { conversationId: string; reason: string }) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_reason: reason,
          is_bot_active: true,
          bot_paused_until: null,
        })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });
}

export function useWhatsAppUnreadCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-unread-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('instance_id, unread_count');
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const iid = row.instance_id;
        counts[iid] = (counts[iid] || 0) + (row.unread_count || 0);
      }
      return counts;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useHandoffCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-handoff-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whatsapp_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('is_bot_active', false)
        .gt('bot_paused_until', new Date().toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}
