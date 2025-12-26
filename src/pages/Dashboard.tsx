import { Users, FolderKanban, TrendingUp, DollarSign, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { profile } = useProfile();

  const activeProjects = projects.filter(p => p.status === 'active');
  const totalValue = projects.reduce((sum, p) => sum + Number(p.total_value), 0);
  const revenueGoal = profile?.revenue_goal || 10000;
  const progressPercent = Math.min((totalValue / revenueGoal) * 100, 100);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const metrics = [
    { title: 'Clientes', value: clients.length, icon: Users, color: 'text-blue-400' },
    { title: 'Projetos', value: projects.length, icon: FolderKanban, color: 'text-purple-400' },
    { title: 'Ativos', value: activeProjects.length, icon: TrendingUp, color: 'text-green-400' },
    { title: 'Valor Total', value: formatCurrency(totalValue), icon: DollarSign, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</span>!
          </h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua consultoria.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/clientes"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/projetos"><Plus className="h-4 w-4 mr-1" /> Novo Projeto</Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Goal */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Meta de Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatCurrency(totalValue)}</span>
                <span>Meta: {formatCurrency(revenueGoal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Projetos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum projeto ainda. Crie seu primeiro projeto!</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.clients?.name || 'Sem cliente'}</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(Number(project.total_value))}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
