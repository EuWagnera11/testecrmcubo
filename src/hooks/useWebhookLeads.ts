import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WebhookLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  message: string | null;
  extra_data: Record<string, unknown> | null;
  imported: boolean;
  pipeline_item_id: string | null;
  created_at: string;
}

export function useWebhookLeads() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['webhook-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_leads' as any)
        .select('*')
        .eq('imported', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WebhookLead[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30s for new leads
  });

  const importLead = useMutation({
    mutationFn: async (lead: WebhookLead) => {
      // Create pipeline item
      const { data: pipelineItem, error: pipelineError } = await supabase
        .from('sales_pipeline')
        .insert({
          title: lead.name,
          contact_name: lead.name,
          contact_email: lead.email,
          contact_phone: lead.phone,
          stage: 'lead',
          value: 0,
          source: lead.source,
          notes: lead.message,
          created_by: user!.id,
        } as any)
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Mark as imported
      const { error: updateError } = await supabase
        .from('webhook_leads' as any)
        .update({ imported: true, pipeline_item_id: pipelineItem.id } as any)
        .eq('id', lead.id);

      if (updateError) throw updateError;

      return pipelineItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
    },
  });

  const importAllLeads = useMutation({
    mutationFn: async (leads: WebhookLead[]) => {
      for (const lead of leads) {
        await importLead.mutateAsync(lead);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
    },
  });

  return {
    leads: query.data ?? [],
    isLoading: query.isLoading,
    importLead,
    importAllLeads,
    pendingCount: (query.data ?? []).length,
  };
}
