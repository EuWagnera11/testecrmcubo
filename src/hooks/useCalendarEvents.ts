import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  event_type: string;
  color: string;
  project_id: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
}

export function useCalendarEvents(month?: Date) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['calendar-events', month?.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString();
        q = q.gte('start_date', start).lte('start_date', end);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  return { ...query, events: query.data ?? [], createEvent, deleteEvent };
}
