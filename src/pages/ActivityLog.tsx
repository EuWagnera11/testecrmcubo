import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Activity, User, FileText, FolderKanban, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUsers } from '@/hooks/useUsers';

const actionLabels: Record<string, string> = {
  'field_update': 'Atualizou campo',
  'member_added': 'Adicionou membro',
  'member_removed': 'Removeu membro',
  'status_change': 'Alterou status',
  'created': 'Criou',
  'updated': 'Atualizou',
  'deleted': 'Removeu',
};

const actionIcons: Record<string, React.ReactNode> = {
  'field_update': <FileText className="h-3.5 w-3.5" />,
  'member_added': <User className="h-3.5 w-3.5" />,
  'member_removed': <User className="h-3.5 w-3.5" />,
  'status_change': <Activity className="h-3.5 w-3.5" />,
};

export default function ActivityLogPage() {
  const { user } = useAuth();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: activityLogs = [], isLoading } = useQuery({
    queryKey: ['activity-logs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, projects:project_id(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => { map[u.id] = u.full_name || 'Sem nome'; });
    return map;
  }, [users]);

  const allLogs = useMemo(() => {
    const combined = [
      ...activityLogs.map((l: any) => ({
        id: l.id,
        type: 'activity' as const,
        action: l.action,
        user_id: l.user_id,
        created_at: l.created_at,
        detail: l.field_type ? `${l.field_type}: ${l.old_value || '—'} → ${l.new_value || '—'}` : null,
        project_name: l.projects?.name,
      })),
      ...auditLogs.map((l: any) => ({
        id: l.id,
        type: 'audit' as const,
        action: l.action,
        user_id: l.user_id,
        created_at: l.created_at,
        detail: l.table_name ? `${l.table_name} (${l.record_id || ''})` : null,
        project_name: null,
      })),
    ];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return combined;
  }, [activityLogs, auditLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return allLogs;
    const term = searchTerm.toLowerCase();
    return allLogs.filter(l =>
      l.action.toLowerCase().includes(term) ||
      (l.detail && l.detail.toLowerCase().includes(term)) ||
      (l.project_name && l.project_name.toLowerCase().includes(term)) ||
      (userMap[l.user_id] && userMap[l.user_id].toLowerCase().includes(term))
    );
  }, [allLogs, searchTerm, userMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Sistema</p>
        <h1 className="text-3xl font-bold tracking-tight">Log de Atividades</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de ações e alterações no sistema.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ações, projetos, usuários..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma atividade registrada.</div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map(log => (
                  <div key={`${log.type}-${log.id}`} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {log.type === 'audit' ? <Shield className="h-3.5 w-3.5 text-primary" /> :
                        actionIcons[log.action] || <Activity className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{userMap[log.user_id] || 'Sistema'}</span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        {log.project_name && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {log.project_name}
                          </Badge>
                        )}
                      </div>
                      {log.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
