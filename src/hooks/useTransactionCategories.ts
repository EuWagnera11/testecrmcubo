import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TransactionCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Projetos', icon: 'briefcase', color: '#10b981' },
  { name: 'Consultoria', icon: 'users', color: '#3b82f6' },
  { name: 'Recorrência', icon: 'repeat', color: '#8b5cf6' },
  { name: 'Outros', icon: 'plus-circle', color: '#6b7280' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Software', icon: 'laptop', color: '#ef4444' },
  { name: 'Marketing', icon: 'megaphone', color: '#f59e0b' },
  { name: 'Equipe', icon: 'users', color: '#ec4899' },
  { name: 'Impostos', icon: 'file-text', color: '#6366f1' },
  { name: 'Escritório', icon: 'building', color: '#14b8a6' },
  { name: 'Outros', icon: 'plus-circle', color: '#6b7280' },
];

export function useTransactionCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const categoriesQuery = useQuery({
    queryKey: ['transaction-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TransactionCategory[];
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (data: Omit<TransactionCategory, 'id' | 'user_id' | 'created_at' | 'is_default'>) => {
      const { data: result, error } = await supabase
        .from('transaction_categories')
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast({ title: 'Categoria criada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TransactionCategory> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('transaction_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast({ title: 'Categoria atualizada!' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transaction_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast({ title: 'Categoria removida!' });
    },
  });

  const initializeDefaults = useMutation({
    mutationFn: async () => {
      const categories = [
        ...DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, type: 'income' as const, is_default: true, user_id: user!.id })),
        ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, type: 'expense' as const, is_default: true, user_id: user!.id })),
      ];

      const { error } = await supabase
        .from('transaction_categories')
        .insert(categories);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
    },
  });

  const incomeCategories = (categoriesQuery.data ?? []).filter(c => c.type === 'income');
  const expenseCategories = (categoriesQuery.data ?? []).filter(c => c.type === 'expense');

  return {
    categories: categoriesQuery.data ?? [],
    incomeCategories,
    expenseCategories,
    isLoading: categoriesQuery.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    initializeDefaults,
  };
}
