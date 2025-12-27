import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo } from 'react';

export interface PaymentReminder {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  transaction_id: string | null;
  reminder_type: 'before_due' | 'on_due' | 'overdue';
  reminder_date: string;
  sent_at: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  created_at: string;
}

export function usePaymentReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const remindersQuery = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return data as PaymentReminder[];
    },
    enabled: !!user,
  });

  const createReminder = useMutation({
    mutationFn: async (data: Omit<PaymentReminder, 'id' | 'user_id' | 'created_at' | 'sent_at'>) => {
      const { data: result, error } = await supabase
        .from('payment_reminders')
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
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    },
  });

  const markAsSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_reminders')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    },
  });

  const reminders = remindersQuery.data ?? [];

  const pendingReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => !r.sent_at && r.reminder_date <= today);
  }, [reminders]);

  const upcomingReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    return reminders.filter(r => 
      !r.sent_at && 
      r.reminder_date > today && 
      r.reminder_date <= nextWeekStr
    );
  }, [reminders]);

  const overdueReminders = useMemo(() => {
    return reminders.filter(r => r.reminder_type === 'overdue' && !r.sent_at);
  }, [reminders]);

  // Auto-create reminders for transactions with due dates
  useEffect(() => {
    if (!user) return;

    const checkAndCreateReminders = async () => {
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('type', 'income')
        .not('due_date', 'is', null)
        .eq('payment_status', 'pending');

      if (!transactions) return;

      for (const tx of transactions) {
        if (!tx.due_date) continue;

        const dueDate = new Date(tx.due_date);
        const today = new Date();
        const fiveDaysBefore = new Date(dueDate);
        fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);

        // Check if reminder already exists
        const existingReminder = reminders.find(r => r.transaction_id === tx.id);
        if (existingReminder) continue;

        // Create reminder 5 days before
        if (fiveDaysBefore > today) {
          await createReminder.mutateAsync({
            transaction_id: tx.id,
            project_id: tx.project_id,
            client_id: null,
            reminder_type: 'before_due',
            reminder_date: fiveDaysBefore.toISOString().split('T')[0],
            title: `Cobrança pendente: ${tx.description || 'Pagamento'}`,
            description: `Vencimento em 5 dias`,
            amount: tx.amount,
          });
        }
      }
    };

    checkAndCreateReminders();
  }, [user, reminders.length]);

  return {
    reminders,
    pendingReminders,
    upcomingReminders,
    overdueReminders,
    isLoading: remindersQuery.isLoading,
    createReminder,
    markAsSent,
    deleteReminder,
  };
}
