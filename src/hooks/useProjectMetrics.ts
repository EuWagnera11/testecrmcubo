import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProjectMetric {
  id: string;
  project_id: string;
  metric_type: 'impressions' | 'clicks' | 'conversions' | 'spend' | 'revenue' | 'engagement' | 'followers' | 'reach';
  value: number;
  date: string;
  created_at: string;
}

export function useProjectMetrics(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const metricsQuery = useQuery({
    queryKey: ['project-metrics', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId!)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as ProjectMetric[];
    },
    enabled: !!user && !!projectId,
  });

  const addMetric = useMutation({
    mutationFn: async ({ metricType, value, date }: { metricType: ProjectMetric['metric_type']; value: number; date?: string }) => {
      const { data, error } = await supabase
        .from('project_metrics')
        .upsert({
          project_id: projectId!,
          metric_type: metricType,
          value,
          date: date || new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'project_id,metric_type,date'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-metrics', projectId] });
      toast({
        title: 'Métrica salva!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar métrica',
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
  };
}
