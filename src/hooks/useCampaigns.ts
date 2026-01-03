import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  project_id: string;
  name: string;
  platform: string | null;
  objective: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  cost_per_conversion: number;
  leads: number;
  cost_per_lead: number;
  roas: number;
  revenue: number;
  created_at: string;
}

export function useCampaigns(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user && !!projectId,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-client-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['all-campaign-metrics'] });
      toast({ title: 'Campanha criada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-client-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['all-campaign-metrics'] });
      toast({ title: 'Campanha atualizada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar campanha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-client-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['all-campaign-metrics'] });
      toast({ title: 'Campanha excluída!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir campanha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}

export function useCampaignMetrics(campaignId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const metricsQuery = useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as CampaignMetric[];
    },
    enabled: !!user && !!campaignId,
  });

  const addMetric = useMutation({
    mutationFn: async (metric: Omit<CampaignMetric, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .upsert(metric, { onConflict: 'campaign_id,date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', campaignId] });
      toast({ title: 'Métricas salvas!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar métricas',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_metrics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', campaignId] });
      toast({ title: 'Métrica excluída!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir métrica',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    metrics: metricsQuery.data ?? [],
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
    addMetric,
    deleteMetric,
  };
}

export function useAllCampaignMetrics(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-campaign-metrics', projectId],
    queryFn: async () => {
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('project_id', projectId!);
      
      if (campaignsError) throw campaignsError;
      if (!campaigns?.length) return [];

      const campaignIds = campaigns.map(c => c.id);
      
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*, campaigns!inner(name, platform, project_id)')
        .in('campaign_id', campaignIds)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!projectId,
  });
}
