import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useProjectsProfitability } from '@/hooks/useProjectsProfitability';
import { appRoleLabels, appRoleColors } from '@/lib/roleConfig';
import { formatCurrency } from '@/lib/utils';
import { Users, FolderKanban, TrendingUp, DollarSign } from 'lucide-react';

export default function TeamReports() {
  const { users } = useUsers();
  const { projects } = useProjects();
  const { projects: profitProjects } = useProjectsProfitability();

  const approvedUsers = users.filter(u => u.status === 'approved');

  const memberStats = useMemo(() => {
    return approvedUsers.map(user => {
      const projectCount = projects.filter(p => p.user_id === user.id).length;
      const activeProjects = projects.filter(p => p.user_id === user.id && p.status === 'active').length;
      const userRevenue = projects
        .filter(p => p.user_id === user.id)
        .reduce((sum, p) => sum + (Number(p.total_value) || 0), 0);

      return {
        ...user,
        projectCount,
        activeProjects,
        totalRevenue: userRevenue,
      };
    }).sort((a, b) => b.projectCount - a.projectCount);
  }, [approvedUsers, projects]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Relatórios</p>
        <h1 className="text-3xl font-bold tracking-tight">Desempenho da Equipe</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão individual de cada membro da equipe.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Membros Ativos</p>
            <p className="text-2xl font-bold mt-1">{approvedUsers.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Projetos</p>
            <p className="text-2xl font-bold mt-1">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Média por Membro</p>
            <p className="text-2xl font-bold mt-1">
              {approvedUsers.length > 0 ? (projects.length / approvedUsers.length).toFixed(1) : 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Projetos Ativos</p>
            <p className="text-2xl font-bold mt-1">{projects.filter(p => p.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Member cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memberStats.map(member => (
          <Card key={member.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">{member.full_name || 'Sem nome'}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.roles.map(role => (
                      <Badge key={role} variant="outline" className={`text-[10px] ${appRoleColors[role] || ''}`}>
                        {appRoleLabels[role] || role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold">{member.projectCount}</p>
                      <p className="text-[10px] text-muted-foreground">Projetos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold">{member.activeProjects}</p>
                      <p className="text-[10px] text-muted-foreground">Ativos</p>
                    </div>
                  </div>
                </div>

                {member.totalRevenue > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Receita gerada</span>
                      <span className="font-semibold text-primary">{formatCurrency(member.totalRevenue)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
