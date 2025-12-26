import { Users, FolderKanban, TrendingUp, DollarSign, Plus, Calendar, ArrowRight } from 'lucide-react';
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
    { title: 'Clientes', value: clients.length, icon: Users, description: 'Total cadastrados' },
    { title: 'Projetos', value: projects.length, icon: FolderKanban, description: 'Em andamento' },
    { title: 'Ativos', value: activeProjects.length, icon: TrendingUp, description: 'Este mês' },
    { title: 'Faturamento', value: formatCurrency(totalValue), icon: DollarSign, description: 'Valor total' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Dashboard</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {greeting()}, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</span>
          </h1>
          <p className="text-muted-foreground mt-2">Aqui está o resumo da sua consultoria.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="h-11">
            <Link to="/clientes">
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Link>
          </Button>
          <Button asChild className="h-11">
            <Link to="/projetos">
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="card-hover border-border/50" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold mt-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Goal */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Meta de Receita</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-bold text-lg">{progressPercent.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-3">
              <span>{formatCurrency(totalValue)}</span>
              <span>Meta: {formatCurrency(revenueGoal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Projetos Recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projetos" className="text-primary">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum projeto ainda.</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.clients?.name || 'Sem cliente'}</p>
                    </div>
                    <span className="font-semibold text-primary">{formatCurrency(Number(project.total_value))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
