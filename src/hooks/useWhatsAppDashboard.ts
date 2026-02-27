import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format, startOfDay } from 'date-fns';

export interface WhatsAppDashboardMetrics {
  activeConversations: number;
  waitingHuman: number;
  resolvedToday: number;
  avgResponseTime: number | null; // in seconds
  handoffRate: number; // percentage
}

export interface DailyMessageVolume {
  date: string;
  customer: number;
  bot: number;
  human: number;
}

export interface SegmentCount {
  name: string;
  color: string;
  count: number;
}

export function useWhatsAppDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-dashboard-metrics'],
    queryFn: async (): Promise<WhatsAppDashboardMetrics> => {
      const now = new Date().toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      // Fetch all conversations in one query
      const { data: conversations, error } = await supabase
        .from('whatsapp_conversations')
        .select('id, is_bot_active, bot_paused_until, status, resolved_at, updated_at');
      if (error) throw error;

      const all = conversations ?? [];
      const activeConversations = all.filter(c => c.is_bot_active === true && c.status !== 'resolved').length;
      const waitingHuman = all.filter(c => 
        !c.is_bot_active && c.bot_paused_until && new Date(c.bot_paused_until) > new Date()
      ).length;
      const resolvedToday = all.filter(c => 
        c.status === 'resolved' && c.resolved_at && c.resolved_at >= todayStart
      ).length;

      // Handoff rate: % of conversations that ever had bot_paused_until set
      const totalConvos = all.length;
      const hadHandoff = all.filter(c => c.bot_paused_until !== null).length;
      const handoffRate = totalConvos > 0 ? (hadHandoff / totalConvos) * 100 : 0;

      // Avg response time: get recent customer messages and first bot reply
      // Simplified: fetch last 200 messages and compute average gap
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select('conversation_id, sender_type, created_at')
        .order('created_at', { ascending: true })
        .gte('created_at', subDays(new Date(), 7).toISOString())
        .limit(2000);

      let avgResponseTime: number | null = null;
      if (recentMessages && recentMessages.length > 0) {
        const responseTimes: number[] = [];
        // Group by conversation
        const byConv: Record<string, typeof recentMessages> = {};
        for (const m of recentMessages) {
          if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
          byConv[m.conversation_id].push(m);
        }
        for (const msgs of Object.values(byConv)) {
          for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].sender_type === 'customer' && (msgs[i + 1].sender_type === 'bot' || msgs[i + 1].sender_type === 'human')) {
              const diff = (new Date(msgs[i + 1].created_at).getTime() - new Date(msgs[i].created_at).getTime()) / 1000;
              if (diff > 0 && diff < 3600) responseTimes.push(diff);
            }
          }
        }
        if (responseTimes.length > 0) {
          avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      return { activeConversations, waitingHuman, resolvedToday, avgResponseTime, handoffRate };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useWhatsAppMessageVolume() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-message-volume'],
    queryFn: async (): Promise<DailyMessageVolume[]> => {
      const since = subDays(new Date(), 6);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('sender_type, created_at')
        .gte('created_at', since.toISOString());
      if (error) throw error;

      // Build daily buckets
      const buckets: Record<string, DailyMessageVolume> = {};
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        buckets[d] = { date: format(subDays(new Date(), 6 - i), 'dd/MM'), customer: 0, bot: 0, human: 0 };
      }

      for (const msg of data ?? []) {
        const day = format(new Date(msg.created_at), 'yyyy-MM-dd');
        if (buckets[day]) {
          if (msg.sender_type === 'customer') buckets[day].customer++;
          else if (msg.sender_type === 'bot') buckets[day].bot++;
          else if (msg.sender_type === 'human') buckets[day].human++;
        }
      }

      return Object.values(buckets);
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

export function useWhatsAppSegments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-top-segments'],
    queryFn: async (): Promise<SegmentCount[]> => {
      // Get all conversation tags with their tag info
      const { data, error } = await supabase
        .from('whatsapp_conversation_tags')
        .select('tag:whatsapp_tags(name, color)');
      if (error) throw error;

      const counts: Record<string, { name: string; color: string; count: number }> = {};
      for (const row of data ?? []) {
        const tag = row.tag as any;
        if (!tag?.name) continue;
        if (!counts[tag.name]) {
          counts[tag.name] = { name: tag.name, color: tag.color || '#888', count: 0 };
        }
        counts[tag.name].count++;
      }

      return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
