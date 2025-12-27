import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  content: string | null;
  total_value: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
  };
}

export interface CreateProposalData {
  client_id?: string;
  title: string;
  content?: string;
  total_value?: number;
  valid_until?: string;
}

export function useProposals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const proposalsQuery = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          client:clients(id, name, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!user,
  });

  const createProposal = useMutation({
    mutationFn: async (data: CreateProposalData) => {
      const { data: result, error } = await supabase
        .from('proposals')
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta criada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar proposta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, status, ...data }: Partial<CreateProposalData> & { id: string; status?: Proposal['status'] }) => {
      const updateData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
      
      if (status) {
        updateData.status = status;
        if (status === 'sent') {
          updateData.sent_at = new Date().toISOString();
        }
        if (status === 'accepted') {
          updateData.accepted_at = new Date().toISOString();
        }
      }

      const { data: result, error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta atualizada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar proposta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta removida!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover proposta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const proposals = proposalsQuery.data ?? [];
  const draftProposals = proposals.filter(p => p.status === 'draft');
  const sentProposals = proposals.filter(p => p.status === 'sent');
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');

  return {
    proposals,
    draftProposals,
    sentProposals,
    acceptedProposals,
    isLoading: proposalsQuery.isLoading,
    error: proposalsQuery.error,
    createProposal,
    updateProposal,
    deleteProposal,
  };
}
