import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FinancialTransaction {
  id: string;
  user_id: string;
  project_id: string | null;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

export function useFinancial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transactionsQuery = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<FinancialTransaction, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...transaction,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Transação adicionada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FinancialTransaction> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.project_id !== undefined) updateData.project_id = data.project_id;

      const { data: result, error } = await supabase
        .from('financial_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Transação atualizada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { data, error, count } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Transação não encontrada ou sem permissão para remover.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({ title: 'Transação removida!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate summary
  const transactions = transactionsQuery.data ?? [];
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  return {
    transactions,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    balance,
  };
}
