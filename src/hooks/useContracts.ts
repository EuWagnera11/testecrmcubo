import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { contractSchema, signatorySchema } from '@/lib/validation';
import { sanitizeForStorage, sanitizeEmail } from '@/lib/sanitize';
import { logAuditEvent } from '@/hooks/useAuditLog';

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
  contract_type?: string;
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
      // Validate contract
      const validation = contractSchema.safeParse(contractData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0]?.message || 'Dados inválidos');
      }

      // Validate signatories
      for (const sig of signatories) {
        const sigValidation = signatorySchema.safeParse(sig);
        if (!sigValidation.success) {
          throw new Error(sigValidation.error.errors[0]?.message || 'Signatário inválido');
        }
      }

      const sanitizedData = {
        title: sanitizeForStorage(contractData.title, 200),
        terms: contractData.terms ? sanitizeForStorage(contractData.terms, 50000) : null,
        client_id: contractData.client_id || null,
        project_id: contractData.project_id || null,
        contract_type: contractData.contract_type || 'one_time',
        user_id: user!.id,
      };

      // Create the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert(sanitizedData)
        .select()
        .single();
      
      if (contractError) throw contractError;

      // Create signatories
      if (signatories.length > 0) {
        const sanitizedSignatories = signatories.map(sig => ({
          name: sanitizeForStorage(sig.name, 100),
          email: sanitizeEmail(sig.email),
          role: sig.role,
          contract_id: contract.id,
        }));

        const { error: signatoriesError } = await supabase
          .from('signatories')
          .insert(sanitizedSignatories);
        
        if (signatoriesError) throw signatoriesError;
      }

      await logAuditEvent({
        action: 'data_create',
        tableName: 'contracts',
        recordId: contract.id,
        newData: { title: sanitizedData.title },
      });

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
      const sanitizedData: Record<string, unknown> = {};
      if (contractData.title) sanitizedData.title = sanitizeForStorage(contractData.title, 200);
      if (contractData.terms) sanitizedData.terms = sanitizeForStorage(contractData.terms, 50000);
      if (contractData.status) sanitizedData.status = contractData.status;
      if (contractData.client_id !== undefined) sanitizedData.client_id = contractData.client_id;
      if (contractData.project_id !== undefined) sanitizedData.project_id = contractData.project_id;

      const { data, error } = await supabase
        .from('contracts')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await logAuditEvent({
        action: 'data_update',
        tableName: 'contracts',
        recordId: id,
        newData: sanitizedData,
      });
      
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
      
      await logAuditEvent({
        action: 'data_delete',
        tableName: 'contracts',
        recordId: id,
      });
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
