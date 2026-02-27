import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
  use_count: number;
  created_by: string;
  created_at: string;
}

export function useQuickReplies() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['quick-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .order('use_count', { ascending: false });
      if (error) throw error;
      return data as QuickReply[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const createReply = useMutation({
    mutationFn: async (reply: { title: string; content: string; category?: string; shortcut?: string }) => {
      const { data, error } = await supabase
        .from('quick_replies')
        .insert({ ...reply, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  const updateReply = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; category?: string; shortcut?: string }) => {
      const { error } = await supabase
        .from('quick_replies')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  const deleteReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quick_replies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  const incrementUseCount = useMutation({
    mutationFn: async (id: string) => {
      const reply = query.data?.find(r => r.id === id);
      if (!reply) return;
      const { error } = await supabase
        .from('quick_replies')
        .update({ use_count: (reply.use_count || 0) + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  return {
    ...query,
    replies: query.data ?? [],
    createReply,
    updateReply,
    deleteReply,
    incrementUseCount,
  };
}

export function replaceVariables(content: string, context: { name?: string; phone?: string; clinic?: string }) {
  return content
    .replace(/\{\{nome\}\}/gi, context.name || '')
    .replace(/\{\{telefone\}\}/gi, context.phone || '')
    .replace(/\{\{clinica\}\}/gi, context.clinic || '');
}
