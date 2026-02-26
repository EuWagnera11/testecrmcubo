import { useState, useMemo } from 'react';
import { Users, FolderKanban, TrendingUp, DollarSign, Plus, ArrowRight, Calendar, ChevronLeft, ChevronRight, Target, Pencil, TrendingDown } from 'lucide-react';
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
import { useProjectsProfitability } from '@/hooks/useProjectsProfitability';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { format, parseISO, startOfMonth, isAfter, isBefore, subMonths, addMonths } from 'date-fns';
import { isWithinFiscalMonth, getFiscalMonthRange, getFiscalMonthKey, getFiscalMonthFromDate } from '@/lib/fiscalMonth';
import { formatCurrency } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const { projects: profitProjects, totalProfit, totalRevenue, totalPayouts, averageMargin } = useProjectsProfitability();
  
  const canSeeFinancials = isAdmin || isDirector;

  // Month selection state - initialize with current calendar month
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');
  
  const { start: fiscalMonthStart, end: fiscalMonthEnd } = getFiscalMonthRange(selectedDate);
  const selectedMonthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  const goToPreviousMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const goToNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));
  const goToCurrentMonth = () => setSelectedDate(new Date());

  // Get monthly goal (fallback to profile default)
  const monthlyGoal = getGoalForMonth(selectedDate);
  const revenueGoal = monthlyGoal?.revenue_goal || profile?.revenue_goal || 10000;

  // Filter projects for the selected month
  // Filter projects for the selected fiscal month (20th to 19th)
  // - Monthly projects: appear from creation until cancelled_at (or forever if not cancelled)
  // - One-time projects: appear only in the fiscal month they were created
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const projectCreated = parseISO(project.created_at);
      const projectType = project.project_type || 'one_time';
      
      if (projectType === 'monthly') {
        // Monthly projects appear from creation until cancellation
        const startedBefore = !isAfter(projectCreated, fiscalMonthEnd);
        
        // Check if cancelled before this fiscal month
        if (project.cancelled_at) {
          const cancelledDate = parseISO(project.cancelled_at);
          const cancelledBeforeThisMonth = isBefore(cancelledDate, fiscalMonthStart);
          if (cancelledBeforeThisMonth) return false;
        }
        
        // Also check status - inactive projects don't appear
        if (project.status === 'inactive') return false;
        
        return startedBefore;
      } else {
        // One-time projects only appear in the fiscal month they were created
        return isWithinFiscalMonth(projectCreated, selectedDate);
      }
    });
  }, [projects, fiscalMonthStart, fiscalMonthEnd, selectedDate]);

  // Filter clients that were created up to and including this fiscal month
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const clientCreated = parseISO(client.created_at);
      return !isAfter(clientCreated, fiscalMonthEnd);
    });
  }, [clients, fiscalMonthEnd]);

  // Filter transactions for the selected fiscal month (20th to 19th)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinFiscalMonth(t.date, selectedDate));
  }, [transactions, selectedDate]);

  // Calculate metrics for the selected month
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const activeProjects = filteredProjects.filter(p => p.status === 'active');
  const progressPercent = Math.min((monthlyIncome / revenueGoal) * 100, 100);

  // Monthly chart data for revenue vs expenses (last 6 fiscal months from selected)
  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(selectedDate, 5 - i);
      return {
        date,
        key: getFiscalMonthKey(date),
        label: format(date, 'MMM/yy', { locale: ptBR }),
      };
    });

    return months.map(({ date, label }) => {
      const monthTransactions = transactions.filter(t => 
        isWithinFiscalMonth(t.date, date)
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


  const handleSaveGoal = async () => {
    const value = parseFloat(newGoalValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(value) && value > 0) {
      await upsertGoal.mutateAsync({ month: selectedDate, revenue_goal: value });
      setGoalDialogOpen(false);
      setNewGoalValue('');
    }
  };

  const baseMetrics = [
    { title: 'Clínicas', value: filteredClients.length, icon: Users, description: 'Ativas no mês' },
    { title: 'Projetos', value: filteredProjects.length, icon: FolderKanban, description: 'No mês selecionado' },
    { title: 'Ativos', value: activeProjects.length, icon: TrendingUp, description: 'Projetos ativos' },
  ];
  
  const metrics = canSeeFinancials 
    ? [...baseMetrics, { title: 'Receita', value: formatCurrency(monthlyIncome), icon: DollarSign, description: 'No mês' }]
    : baseMetrics;

  return (
    <div className="space-y-6 animate-fade-in relative overflow-hidden">
      {/* Watermark decorations like institutional site */}
      <span className="watermark -top-8 -right-12 text-[14rem] text-primary/[0.03]">Cubo</span>
      <span className="watermark bottom-20 -left-16 text-[10rem] text-primary/[0.025]">Cubo</span>
      
      {/* Cross decorations like institutional site */}
      <span className="absolute top-16 right-32 text-primary/[0.06] text-6xl font-light select-none pointer-events-none">+</span>
      <span className="absolute bottom-40 left-24 text-primary/[0.05] text-4xl font-light select-none pointer-events-none hidden lg:block">+</span>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 relative z-10">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Dashboard</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {greeting()}, <span className="text-gradient">{user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Resumo do motor de crescimento das suas clínicas.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/clientes">
              <Plus className="h-4 w-4 mr-1" /> Nova Clínica
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/projetos">
              <Plus className="h-4 w-4 mr-1" /> Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="border-border/50 glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Visualizando:</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-base sm:text-lg font-semibold min-w-[140px] sm:min-w-[200px] text-center capitalize">
                {selectedMonthLabel}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="ml-1 sm:ml-2 text-xs sm:text-sm">
                Hoje
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="card-hover glass-card" style={{ animationDelay: `${index * 80}ms` }}>
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{metric.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold mt-1">{metric.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Goal - Only for directors+ */}
        <Card className="border-border/50 glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Meta de Receita
                </CardTitle>
                {canSeeFinancials && (
                  <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Pencil className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          Meta de {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Valor da meta</label>
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
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Progresso do mês</span>
                <span className="text-lg font-semibold">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mt-3">
                <span>{formatCurrency(monthlyIncome)}</span>
                <span>Meta: {formatCurrency(revenueGoal)}</span>
              </div>
              {monthlyGoal && (
                <p className="text-xs text-primary mt-2">Meta personalizada para este mês</p>
              )}
            </CardContent>
          </Card>

        {/* Projects for this month */}
        <Card className={cn("border-border/50 glass-card", !canSeeFinancials && "lg:col-span-2")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-semibold">Projetos do Mês</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projetos" className="text-primary text-xs sm:text-sm">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {filteredProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum projeto neste mês.</p>
            ) : (
              <div className="space-y-3">
                {filteredProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm sm:text-base">{project.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {projectTypeLabels[project.project_type || 'one_time']}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.clients?.name || 'Sem clínica'}</p>
                    </div>
                    {canSeeFinancials && (
                      <span className="font-semibold text-primary text-sm sm:text-base whitespace-nowrap">{formatCurrency(Number(project.total_value))}</span>
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
            <CardTitle className="text-lg font-semibold">Receitas vs Despesas</CardTitle>
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

      {/* Project Profitability Report - Only for directors+ */}
      {canSeeFinancials && profitProjects.length > 0 && (
        <>
          {/* Profitability Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-border/50 glass-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-lg md:text-xl font-semibold mt-1 truncate">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 glass-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Repasses Equipe</p>
                    <p className="text-lg md:text-xl font-semibold mt-1 text-destructive truncate">{formatCurrency(totalPayouts)}</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 glass-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Lucro Líquido</p>
                    <p className={cn("text-lg md:text-xl font-semibold mt-1 truncate", totalProfit >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(totalProfit)}
                    </p>
                  </div>
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", totalProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                    <TrendingUp className={cn("h-4 w-4", totalProfit >= 0 ? "text-success" : "text-destructive")} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 glass-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Margem Média</p>
                    <p className={cn("text-lg md:text-xl font-semibold mt-1", averageMargin >= 0 ? "text-success" : "text-destructive")}>
                      {averageMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profitability by Project Chart */}
          <Card className="border-border/50 glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Lucratividade por Projeto</CardTitle>
                <Link to="/admin" className="text-sm text-primary hover:underline">
                  Ver relatório completo <ArrowRight className="inline h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={profitProjects.slice(0, 8).map(p => ({
                      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                      receita: p.total_value + p.total_alterations,
                      repasses: p.total_payouts,
                      lucro: p.profit,
                    }))} 
                    margin={{ top: 10, right: 10, left: -10, bottom: 60 }}
                    layout="vertical"
                  >
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={120}
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
                    <Bar dataKey="receita" name="Receita" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="repasses" name="Repasses" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="lucro" name="Lucro" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
