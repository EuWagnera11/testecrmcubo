import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectProfitability {
  id: string;
  name: string;
  total_value: number;
  status: string;
  project_type: string;
  created_at: string;
  total_alterations: number;
  total_payouts: number;
  profit: number;
  profit_margin: number;
}

export function useProjectsProfitability() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['projects-profitability'],
    queryFn: async () => {
      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, total_value, status, project_type, created_at')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch all alterations
      const { data: alterations, error: altError } = await supabase
        .from('project_alterations')
        .select('project_id, value');

      if (altError) throw altError;

      // Fetch all payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('project_payouts')
        .select('project_id, amount');

      if (payoutsError) throw payoutsError;

      // Calculate profitability for each project
      const projectsWithProfit: ProjectProfitability[] = projects.map(project => {
        const projectAlterations = alterations?.filter(a => a.project_id === project.id) ?? [];
        const projectPayouts = payouts?.filter(p => p.project_id === project.id) ?? [];

        const total_alterations = projectAlterations.reduce((sum, a) => sum + Number(a.value), 0);
        const total_payouts = projectPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
        
        const totalRevenue = Number(project.total_value) + total_alterations;
        const profit = totalRevenue - total_payouts;
        const profit_margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
          ...project,
          total_value: Number(project.total_value),
          total_alterations,
          total_payouts,
          profit,
          profit_margin,
        };
      });

      return projectsWithProfit;
    },
    enabled: !!user,
  });

  const totalRevenue = query.data?.reduce((sum, p) => sum + p.total_value + p.total_alterations, 0) ?? 0;
  const totalPayouts = query.data?.reduce((sum, p) => sum + p.total_payouts, 0) ?? 0;
  const totalProfit = query.data?.reduce((sum, p) => sum + p.profit, 0) ?? 0;
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    totalRevenue,
    totalPayouts,
    totalProfit,
    averageMargin,
  };
}
