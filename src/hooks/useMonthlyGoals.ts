import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyGoal {
  id: string;
  user_id: string;
  month: string;
  revenue_goal: number;
  created_at: string;
  updated_at: string;
}

export function useMonthlyGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const goalsQuery = useQuery({
    queryKey: ['monthly-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as MonthlyGoal[];
    },
    enabled: !!user,
  });

  // Get goal for a billing month reference date
  // The monthKey uses the first of the reference month
  const getGoalForMonth = (referenceDate: Date) => {
    const monthKey = format(startOfMonth(referenceDate), 'yyyy-MM-dd');
    return goalsQuery.data?.find(g => g.month === monthKey);
  };

  const upsertGoal = useMutation({
    mutationFn: async ({ month, revenue_goal }: { month: Date; revenue_goal: number }) => {
      const monthKey = format(startOfMonth(month), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('monthly_goals')
        .upsert({
          user_id: user!.id,
          month: monthKey,
          revenue_goal,
        }, {
          onConflict: 'user_id,month',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-goals'] });
      toast({
        title: 'Meta atualizada!',
        description: 'A meta do mês foi salva com sucesso.',
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
    getGoalForMonth,
    upsertGoal,
  };
}
