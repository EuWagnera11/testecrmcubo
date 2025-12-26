import { useMemo } from 'react';
import { 
  Users, FolderKanban, DollarSign, TrendingUp, 
  ArrowUpRight, ArrowDownRight, FileText, BarChart3 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useContracts } from '@/hooks/useContracts';
import { useFinancial } from '@/hooks/useFinancial';
import { useUsers } from '@/hooks/useUsers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, parseISO, startOfMonth, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(28, 85%, 52%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export default function AdminDashboard() {
  const { clients } = useClients();
  const { projects } = useProjects();
  const { contracts } = useContracts();
  const { transactions, balance, totalIncome, totalExpenses } = useFinancial();
  const { users } = useUsers();

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // KPIs
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const signedContracts = contracts.filter(c => c.status === 'signed').length;
  const totalProjectValue = projects.reduce((sum, p) => sum + Number(p.total_value), 0);

  // Monthly revenue data for line chart
  const monthlyRevenue = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return format(startOfMonth(date), 'yyyy-MM');
    });

    return last6Months.map(monthKey => {
      const monthLabel = format(parseISO(`${monthKey}-01`), 'MMM', { locale: ptBR });
      const income = transactions
        .filter(t => t.type === 'income' && format(startOfMonth(parseISO(t.date)), 'yyyy-MM') === monthKey)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = transactions
        .filter(t => t.type === 'expense' && format(startOfMonth(parseISO(t.date)), 'yyyy-MM') === monthKey)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return { month: monthLabel, receitas: income, despesas: expenses, lucro: income - expenses };
    });
  }, [transactions]);

  // Project status distribution
  const projectStatusData = useMemo(() => [
    { name: 'Ativos', value: projects.filter(p => p.status === 'active').length },
    { name: 'Concluídos', value: projects.filter(p => p.status === 'completed').length },
    { name: 'Inativos', value: projects.filter(p => p.status === 'inactive').length },
  ].filter(d => d.value > 0), [projects]);

  // Project type distribution
  const projectTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    projects.forEach(p => {
      const type = p.project_type || 'one_time';
      types[type] = (types[type] || 0) + 1;
    });
    const labels: Record<string, string> = {
      one_time: 'Pontual',
      monthly: 'Mensal',
      campaign: 'Campanha',
      branding: 'Branding'
    };
    return Object.entries(types).map(([key, value]) => ({ name: labels[key] || key, value }));
  }, [projects]);

  // Recent growth
  const lastMonthProjects = projects.filter(p => 
    isAfter(parseISO(p.created_at), subMonths(new Date(), 1))
  ).length;

  const kpis = [
    { 
      title: 'Receita Total', 
      value: formatCurrency(totalIncome), 
      change: '+12%', 
      isPositive: true,
      icon: DollarSign,
      description: 'Este período'
    },
    { 
      title: 'Despesas', 
      value: formatCurrency(totalExpenses), 
      change: '-5%', 
      isPositive: true,
      icon: TrendingUp,
      description: 'Este período'
    },
    { 
      title: 'Lucro Líquido', 
      value: formatCurrency(balance), 
      change: balance > 0 ? '+' : '',
      isPositive: balance > 0,
      icon: BarChart3,
      description: 'Balanço atual'
    },
    { 
      title: 'Projetos Ativos', 
      value: activeProjects, 
      change: `+${lastMonthProjects}`,
      isPositive: true,
      icon: FolderKanban,
      description: 'Último mês'
    },
  ];

  const stats = [
    { title: 'Clientes Ativos', value: activeClients, icon: Users },
    { title: 'Contratos Assinados', value: signedContracts, icon: FileText },
    { title: 'Usuários Pendentes', value: pendingUsers, icon: Users },
    { title: 'Valor em Projetos', value: formatCurrency(totalProjectValue), icon: DollarSign },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1 font-body">Administração</p>
        <h1 className="text-3xl lg:text-4xl font-display tracking-wide">
          Relatórios <span className="text-accent">&</span> KPIs
        </h1>
        <p className="text-muted-foreground mt-2 font-body">Visão geral do desempenho da consultoria.</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {kpis.map((kpi, index) => (
          <Card key={kpi.title} className="card-hover border-border/50 glass-card" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium font-body">{kpi.title}</p>
                  <p className="text-2xl lg:text-3xl font-display mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-xs font-medium ${kpi.isPositive ? 'text-success' : 'text-destructive'}`}>
                      {kpi.change}
                    </span>
                    <span className="text-xs text-muted-foreground">{kpi.description}</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card className="lg:col-span-2 border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-body">Evolução Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: 'hsl(142, 76%, 36%)' }} />
                  <Line type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ fill: 'hsl(0, 72%, 51%)' }} />
                  <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(28, 85%, 52%)" strokeWidth={3} dot={{ fill: 'hsl(28, 85%, 52%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card className="border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-body">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats & Project Types */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <Card className="border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-body">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.title} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-body">{stat.title}</span>
                  </div>
                  <p className="text-xl font-display">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Types Bar Chart */}
        <Card className="border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-body">Tipos de Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(28, 85%, 52%)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
