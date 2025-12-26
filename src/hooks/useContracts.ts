import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Signatory {
  id: string;
  contract_id: string;
  name: string;
  email: string;
  role: 'contratante' | 'contratado' | 'testemunha' | 'fiador' | 'representante_legal';
  signed_at: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  title: string;
  terms: string | null;
  status: 'draft' | 'sent' | 'signed';
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  } | null;
  projects?: {
    id: string;
    name: string;
  } | null;
  signatories?: Signatory[];
}

export interface CreateContractData {
  client_id?: string;
  project_id?: string;
  title: string;
  terms?: string;
  signatories: Omit<Signatory, 'id' | 'contract_id' | 'signed_at' | 'created_at'>[];
}

export function useContracts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const contractsQuery = useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (
            id,
            name
          ),
          projects (
            id,
            name
          ),
          signatories (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });

  const createContract = useMutation({
    mutationFn: async ({ signatories, ...contractData }: CreateContractData) => {
      // Create the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          ...contractData,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (contractError) throw contractError;

      // Create signatories
      if (signatories.length > 0) {
        const { error: signatoriesError } = await supabase
          .from('signatories')
          .insert(
            signatories.map(sig => ({
              ...sig,
              contract_id: contract.id,
            }))
          );
        
        if (signatoriesError) throw signatoriesError;
      }

      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contrato criado!',
        description: 'O contrato foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...contractData }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contrato atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contrato removido',
        description: 'O contrato foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    contracts: contractsQuery.data ?? [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract,
    updateContract,
    deleteContract,
  };
}
