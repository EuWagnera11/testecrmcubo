import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface TeamGoal {
  id: string;
  month: string;
  revenue_goal: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTeamGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const goalsQuery = useQuery({
    queryKey: ['team-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_goals')
        .select('*')
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as TeamGoal[];
    },
    enabled: !!user,
  });

  const getCurrentMonthGoal = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return goalsQuery.data?.find(g => g.month === currentMonth);
  };

  const getGoalForMonth = (date: Date) => {
    const monthKey = format(date, 'yyyy-MM');
    return goalsQuery.data?.find(g => g.month === monthKey);
  };

  const upsertGoal = useMutation({
    mutationFn: async ({ month, revenue_goal }: { month: string; revenue_goal: number }) => {
      // Check if goal exists for this month
      const { data: existing } = await supabase
        .from('team_goals')
        .select('id')
        .eq('month', month)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('team_goals')
          .update({ revenue_goal })
          .eq('month', month)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('team_goals')
          .insert({
            month,
            revenue_goal,
            created_by: user!.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-goals'] });
      toast({
        title: 'Meta atualizada!',
        description: 'A meta da equipe foi salva com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    getCurrentMonthGoal,
    getGoalForMonth,
    upsertGoal,
  };
}
