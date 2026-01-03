import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface ClientClosure {
  id: string;
  client_id: string;
  period_key: string;
  period_start: string;
  period_end: string;
  closed_at: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_leads: number;
  total_conversions: number;
  total_revenue: number;
  total_reach: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpl: number;
  total_roas: number;
  total_static_creatives: number;
  total_carousel_creatives: number;
  projects_count: number;
  campaigns_count: number;
  snapshot_data: any;
  pdf_url: string | null;
  status: string;
  created_at: string;
}

export interface ClosureCommission {
  id: string;
  closure_id: string;
  user_id: string;
  user_name: string;
  rule_id: string | null;
  base_value: number;
  percentage: number | null;
  amount: number;
  description: string | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export function useClientClosures(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all closures for a client
  const closuresQuery = useQuery({
    queryKey: ['client-closures', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_month_closures')
        .select('*')
        .eq('client_id', clientId)
        .order('period_key', { ascending: false });

      if (error) throw error;
      return data as ClientClosure[];
    },
    enabled: !!clientId,
  });

  // Check if a specific month is closed
  const isMonthClosed = (periodKey: string): boolean => {
    return closuresQuery.data?.some(c => c.period_key === periodKey) || false;
  };

  // Get closure for a specific month
  const getClosureForMonth = (periodKey: string): ClientClosure | undefined => {
    return closuresQuery.data?.find(c => c.period_key === periodKey);
  };

  // Get the current active month (most recent unclosed)
  const getActiveMonth = (): string => {
    const now = new Date();
    let currentPeriod = format(now, 'yyyy-MM');
    
    // If current month is closed, return next month
    while (isMonthClosed(currentPeriod)) {
      const [year, month] = currentPeriod.split('-').map(Number);
      const nextDate = new Date(year, month, 1); // month is 0-indexed, so month gives us next month
      currentPeriod = format(nextDate, 'yyyy-MM');
    }
    
    return currentPeriod;
  };

  // Manual close month mutation
  const closeMonth = useMutation({
    mutationFn: async ({ clientId, periodKey }: { clientId: string; periodKey: string }) => {
      const { data, error } = await supabase.functions.invoke('close-client-month', {
        body: { client_id: clientId, period_key: periodKey },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Mês fechado com sucesso',
        description: `O período ${data.period_key} foi fechado.`,
      });
      queryClient.invalidateQueries({ queryKey: ['client-closures', clientId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao fechar mês',
        description: error.message || 'Ocorreu um erro ao fechar o mês.',
        variant: 'destructive',
      });
    },
  });

  return {
    closures: closuresQuery.data || [],
    isLoading: closuresQuery.isLoading,
    isMonthClosed,
    getClosureForMonth,
    getActiveMonth,
    closeMonth,
    refetch: closuresQuery.refetch,
  };
}

// Hook to fetch closure details with commissions
export function useClosureDetails(closureId?: string) {
  return useQuery({
    queryKey: ['closure-details', closureId],
    queryFn: async () => {
      if (!closureId) return null;

      // Fetch closure
      const { data: closure, error: closureError } = await supabase
        .from('client_month_closures')
        .select('*')
        .eq('id', closureId)
        .single();

      if (closureError) throw closureError;

      // Fetch commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from('closure_commissions')
        .select('*')
        .eq('closure_id', closureId)
        .order('amount', { ascending: false });

      if (commissionsError) throw commissionsError;

      return {
        closure: closure as ClientClosure,
        commissions: commissions as ClosureCommission[],
      };
    },
    enabled: !!closureId,
  });
}

// Hook to fetch all commissions for a user
export function useUserCommissions(userId?: string) {
  return useQuery({
    queryKey: ['user-commissions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('closure_commissions')
        .select(`
          *,
          client_month_closures (
            period_key,
            client_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
