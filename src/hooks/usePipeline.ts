import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PipelineItem {
  id: string;
  title: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  stage: string;
  value: number;
  notes: string | null;
  source: string | null;
  assigned_to: string | null;
  client_id: string | null;
  created_by: string;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  asaas_customer_id: string | null;
  asaas_payment_id: string | null;
  asaas_payment_status: string | null;
  asaas_invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export const PIPELINE_STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contatado', color: 'bg-yellow-500' },
  { key: 'qualified', label: 'Qualificado', color: 'bg-orange-500' },
  { key: 'proposal', label: 'Proposta', color: 'bg-purple-500' },
  { key: 'negotiation', label: 'Negociação', color: 'bg-cyan-500' },
  { key: 'won', label: 'Ganho', color: 'bg-green-500' },
  { key: 'lost', label: 'Perdido', color: 'bg-red-500' },
];

export function usePipeline() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['sales-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_pipeline')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PipelineItem[];
    },
    enabled: !!user,
  });

  const createItem = useMutation({
    mutationFn: async (item: Partial<PipelineItem>) => {
      const { data, error } = await supabase
        .from('sales_pipeline')
        .insert({ ...item, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PipelineItem> & { id: string }) => {
      const { error } = await supabase
        .from('sales_pipeline')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_pipeline').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] }),
  });

  return { ...query, items: query.data ?? [], createItem, updateItem, deleteItem };
}
