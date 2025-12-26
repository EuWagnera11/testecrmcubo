import { useState, useMemo } from 'react';
import { Users, FolderKanban, TrendingUp, DollarSign, Plus, ArrowRight, Calendar, ChevronLeft, ChevronRight, Target, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useFinancial } from '@/hooks/useFinancial';
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isAfter, isBefore, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const projectTypeLabels: Record<string, string> = {
  one_time: 'Pontual',
  monthly: 'Mensal',
  campaign: 'Campanha',
  branding: 'Branding',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { profile } = useProfile();
  const { isAdmin, isDirector } = useUserRole();
  const { transactions } = useFinancial();
  const { getGoalForMonth, upsertGoal } = useMonthlyGoals();
  
  const canSeeFinancials = isAdmin || isDirector;

  // Month selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');
  
  const selectedMonthStart = startOfMonth(selectedDate);
  const selectedMonthEnd = endOfMonth(selectedDate);
  const selectedMonthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  const goToPreviousMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const goToNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));
  const goToCurrentMonth = () => setSelectedDate(new Date());

  // Get monthly goal (fallback to profile default)
  const monthlyGoal = getGoalForMonth(selectedDate);
  const revenueGoal = monthlyGoal?.revenue_goal || profile?.revenue_goal || 10000;

  // Filter projects for the selected month
  // - Monthly projects: appear from creation until cancelled_at (or forever if not cancelled)
  // - One-time projects: appear only in the month they were created
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const projectCreated = parseISO(project.created_at);
      const projectType = project.project_type || 'one_time';
      const createdMonth = startOfMonth(projectCreated);
      
      if (projectType === 'monthly') {
        // Monthly projects appear from creation until cancellation
        const startedBefore = !isAfter(createdMonth, selectedMonthEnd);
        
        // Check if cancelled before this month
        if (project.cancelled_at) {
          const cancelledMonth = startOfMonth(parseISO(project.cancelled_at));
          const cancelledBeforeThisMonth = isBefore(cancelledMonth, selectedMonthStart);
          if (cancelledBeforeThisMonth) return false;
        }
        
        // Also check status - inactive projects don't appear
        if (project.status === 'inactive') return false;
        
        return startedBefore;
      } else {
        // One-time projects only appear in the month they were created
        return isWithinInterval(projectCreated, { start: selectedMonthStart, end: selectedMonthEnd });
      }
    });
  }, [projects, selectedMonthStart, selectedMonthEnd]);

  // Filter clients that were created up to and including this month
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const clientCreated = parseISO(client.created_at);
      return !isAfter(startOfMonth(clientCreated), selectedMonthEnd);
    });
  }, [clients, selectedMonthEnd]);

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: selectedMonthStart, end: selectedMonthEnd });
    });
  }, [transactions, selectedMonthStart, selectedMonthEnd]);

  // Calculate metrics for the selected month
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const activeProjects = filteredProjects.filter(p => p.status === 'active');
  const progressPercent = Math.min((monthlyIncome / revenueGoal) * 100, 100);

  // Monthly chart data for revenue vs expenses (last 6 months from selected)
  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(selectedDate, 5 - i);
      return {
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR }),
      };
    });

    return months.map(({ key, label }) => {
      const monthTransactions = transactions.filter(t => 
        format(parseISO(t.date), 'yyyy-MM') === key
      );
      
      const receitas = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const despesas = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return { month: label, receitas, despesas };
    });
  }, [transactions, selectedDate]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSaveGoal = async () => {
    const value = parseFloat(newGoalValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(value) && value > 0) {
      await upsertGoal.mutateAsync({ month: selectedDate, revenue_goal: value });
      setGoalDialogOpen(false);
      setNewGoalValue('');
    }
  };

  const baseMetrics = [
    { title: 'Clientes', value: filteredClients.length, icon: Users, description: 'Ativos no mês' },
    { title: 'Projetos', value: filteredProjects.length, icon: FolderKanban, description: 'No mês selecionado' },
    { title: 'Ativos', value: activeProjects.length, icon: TrendingUp, description: 'Projetos ativos' },
  ];
  
  const metrics = canSeeFinancials 
    ? [...baseMetrics, { title: 'Receita', value: formatCurrency(monthlyIncome), icon: DollarSign, description: 'No mês' }]
    : baseMetrics;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1 font-body">Dashboard</p>
          <h1 className="text-3xl lg:text-4xl font-display tracking-wide">
            {greeting()}, <span className="text-accent">{user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-body">Aqui está o resumo da sua consultoria.</p>
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

      {/* Month Selector */}
      <Card className="border-border/50 glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground font-body">Visualizando:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-display text-lg min-w-[200px] text-center capitalize">
                {selectedMonthLabel}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="ml-2">
                Hoje
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="card-hover border-border/50 glass-card" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium font-body">{metric.title}</p>
                  <p className="text-2xl lg:text-3xl font-display mt-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-body">{metric.description}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Goal - Only for directors+ */}
        {canSeeFinancials && (
          <Card className="border-border/50 glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold font-body flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Meta de Receita
                </CardTitle>
                <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">
                        Meta de {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium font-body">Valor da meta</label>
                        <Input
                          type="text"
                          placeholder="R$ 10.000,00"
                          value={newGoalValue}
                          onChange={(e) => setNewGoalValue(e.target.value)}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Meta atual: {formatCurrency(revenueGoal)}
                        </p>
                      </div>
                      <Button 
                        onClick={handleSaveGoal} 
                        className="w-full h-11"
                        disabled={upsertGoal.isPending}
                      >
                        {upsertGoal.isPending ? 'Salvando...' : 'Salvar Meta'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground font-body">Progresso do mês</span>
                <span className="font-display text-lg">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground mt-3 font-body">
                <span>{formatCurrency(monthlyIncome)}</span>
                <span>Meta: {formatCurrency(revenueGoal)}</span>
              </div>
              {monthlyGoal && (
                <p className="text-xs text-primary mt-2 font-body">Meta personalizada para este mês</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Projects for this month */}
        <Card className="border-border/50 glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold font-body">Projetos do Mês</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projetos" className="text-primary font-body">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {filteredProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 font-body">Nenhum projeto neste mês.</p>
            ) : (
              <div className="space-y-3">
                {filteredProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-body truncate">{project.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {projectTypeLabels[project.project_type || 'one_time']}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">{project.clients?.name || 'Sem cliente'}</p>
                    </div>
                    {canSeeFinancials && (
                      <span className="font-display text-primary ml-2">{formatCurrency(Number(project.total_value))}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue vs Expenses Chart - Only for directors+ */}
      {canSeeFinancials && monthlyChartData.length > 0 && (
        <Card className="border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-body">Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
