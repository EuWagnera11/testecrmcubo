import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit3, Palette, FileText, TrendingUp, MessageSquare } from 'lucide-react';

interface ActivityLogProps {
  projectId: string;
}

interface ActivityLogEntry {
  id: string;
  user_id: string;
  project_id: string;
  action: string;
  field_type: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

const fieldIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  design: Palette,
  copy: FileText,
  traffic: TrendingUp,
  social_media: MessageSquare,
  general: FileText,
};

const fieldLabels: Record<string, string> = {
  design: 'Design',
  copy: 'Copywriting',
  traffic: 'Tráfego Pago',
  social_media: 'Social Media',
  general: 'Geral',
};

export function ActivityLog({ projectId }: ActivityLogProps) {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch profile names separately
      const userIds = [...new Set(data.map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      return data.map(log => ({
        ...log,
        profiles: { full_name: profileMap.get(log.user_id) || null }
      })) as ActivityLogEntry[];
    },
    enabled: !!user && !!projectId,
  });

  if (isLoading) {
    return (
      <Card className="border-border/50 glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma atividade registrada.</p>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = log.field_type ? fieldIcons[log.field_type] || Edit3 : Edit3;
                const fieldLabel = log.field_type ? fieldLabels[log.field_type] || log.field_type : '';
                
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {log.profiles?.full_name || 'Usuário'}
                        </span>
                        <span className="text-muted-foreground text-sm">{log.action}</span>
                        {fieldLabel && (
                          <Badge variant="outline" className="text-xs">
                            {fieldLabel}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span title={format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
                          {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
