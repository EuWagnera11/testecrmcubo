import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_type: 'performance' | 'financial' | 'projects' | 'clients';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  config: Record<string, unknown>;
  last_sent_at: string | null;
  next_send_at: string | null;
  enabled: boolean;
  created_at: string;
}

export interface CreateReportData {
  report_type: ScheduledReport['report_type'];
  frequency: ScheduledReport['frequency'];
  recipients?: string[];
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export function useScheduledReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reportsQuery = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScheduledReport[];
    },
    enabled: !!user,
  });

  const createReport = useMutation({
    mutationFn: async (data: CreateReportData) => {
      const nextSendAt = calculateNextSendDate(data.frequency);

      const { data: result, error } = await supabase
        .from('scheduled_reports')
        .insert({
          report_type: data.report_type,
          frequency: data.frequency,
          recipients: data.recipients ? JSON.parse(JSON.stringify(data.recipients)) : [],
          config: data.config ? JSON.parse(JSON.stringify(data.config)) : {},
          enabled: data.enabled ?? true,
          user_id: user!.id,
          next_send_at: nextSendAt,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({ title: 'Relatório agendado!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao agendar relatório',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateReportData> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data };
      
      if (data.frequency) {
        updateData.next_send_at = calculateNextSendDate(data.frequency);
      }

      const { data: result, error } = await supabase
        .from('scheduled_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({ title: 'Relatório atualizado!' });
    },
  });

  const toggleReport = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({ title: 'Relatório removido!' });
    },
  });

  return {
    reports: reportsQuery.data ?? [],
    isLoading: reportsQuery.isLoading,
    createReport,
    updateReport,
    toggleReport,
    deleteReport,
  };
}

function calculateNextSendDate(frequency: ScheduledReport['frequency']): string {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 + 1);
      now.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(9, 0, 0, 0);
      break;
  }
  
  return now.toISOString();
}
