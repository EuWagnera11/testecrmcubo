import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, isAfter } from 'date-fns';
import { BillingCycle, isWithinBillingCycle } from '@/lib/billingCycle';

export interface ProjectProfitability {
  id: string;
  name: string;
  total_value: number;
  status: string;
  project_type: string;
  created_at: string;
  cancelled_at?: string | null;
  total_alterations: number;
  total_payouts: number;
  profit: number;
  profit_margin: number;
}

export function useProjectsProfitability(billingCycle?: BillingCycle) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['projects-profitability'],
    queryFn: async () => {
      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, total_value, status, project_type, created_at, cancelled_at')
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

  // Filter projects by billing cycle if provided
  const filteredProjects = billingCycle 
    ? (query.data ?? []).filter(project => {
        const projectCreated = parseISO(project.created_at);
        const projectType = project.project_type || 'one_time';
        
        if (projectType === 'monthly') {
          // Monthly projects appear from creation until cancellation
          const startedBefore = !isAfter(projectCreated, billingCycle.end);
          
          // Check if cancelled before this billing cycle
          if (project.cancelled_at) {
            const cancelledDate = parseISO(project.cancelled_at);
            if (!isAfter(cancelledDate, billingCycle.start)) return false;
          }
          
          if (project.status === 'inactive') return false;
          
          return startedBefore;
        } else {
          // One-time projects only appear in the billing cycle they were created
          return isWithinBillingCycle(projectCreated, billingCycle);
        }
      })
    : (query.data ?? []);

  const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.total_value + p.total_alterations, 0);
  const totalPayouts = filteredProjects.reduce((sum, p) => sum + p.total_payouts, 0);
  const totalProfit = filteredProjects.reduce((sum, p) => sum + p.profit, 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    projects: filteredProjects,
    allProjects: query.data ?? [],
    isLoading: query.isLoading,
    totalRevenue,
    totalPayouts,
    totalProfit,
    averageMargin,
  };
}
