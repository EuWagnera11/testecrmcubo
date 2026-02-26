import { useState, useRef, useMemo } from 'react';
import { FileText, Calendar, TrendingUp, DollarSign, Users, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useFinancial } from '@/hooks/useFinancial';
import { useProjectsProfitability } from '@/hooks/useProjectsProfitability';
import { format, subMonths, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { getFiscalMonthRange } from '@/lib/fiscalMonth';
import { PDFExportDialog } from '@/components/PDFExportDialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import refineLogo from '@/assets/refine-logo.png';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(280, 67%, 50%)'];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const reportRef = useRef<HTMLDivElement>(null);

  const { clients } = useClients();
  const { projects } = useProjects();
  const { transactions, totalIncome, totalExpenses, balance } = useFinancial();
  const { projects: profitProjects, totalProfit, totalRevenue, totalPayouts, averageMargin } = useProjectsProfitability();

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'last3':
        return { start: subMonths(now, 3), end: now, label: 'Últimos 3 meses' };
      case 'last6':
        return { start: subMonths(now, 6), end: now, label: 'Últimos 6 meses' };
      case 'year':
        return { start: subMonths(now, 12), end: now, label: 'Último ano' };
      default:
        const { start, end } = getFiscalMonthRange(now);
        return { start, end, label: format(now, "MMMM 'de' yyyy", { locale: ptBR }) };
    }
  }, [selectedPeriod]);

  // Filter data based on period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [transactions, dateRange]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const date = parseISO(p.created_at);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [projects, dateRange]);

  const periodIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Charts data
  const projectsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name === 'active' ? 'Ativos' : name === 'completed' ? 'Concluídos' : name === 'paused' ? 'Pausados' : name,
      value
    }));
  }, [filteredProjects]);

  const revenueByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Análise</p>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Gere relatórios consolidados com métricas do seu negócio.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48 h-11">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês atual</SelectItem>
              <SelectItem value="last3">Últimos 3 meses</SelectItem>
              <SelectItem value="last6">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <PDFExportDialog
            contentRef={reportRef}
            fileName="relatorio-gerencial"
            title="Relatório Gerencial"
            subtitle={dateRange.label}
          />
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 bg-background p-4 sm:p-6 rounded-xl">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-3">
          <div className="flex items-center gap-4">
            <img src={refineLogo} alt="Logo" className="h-8 sm:h-10" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Relatório Gerencial</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{dateRange.label}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Receita</p>
                  <p className="text-base sm:text-xl font-bold text-success truncate">{formatCurrency(periodIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Despesas</p>
                  <p className="text-base sm:text-xl font-bold text-destructive truncate">{formatCurrency(periodExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Projetos</p>
                  <p className="text-base sm:text-xl font-bold">{filteredProjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Lucro</p>
                  <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(periodIncome - periodExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Category */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Receita por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByCategory.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {revenueByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma receita no período</p>
              )}
            </CardContent>
          </Card>

          {/* Projects by Status */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Projetos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsByStatus.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByStatus}>
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum projeto no período</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profitability Table */}
        {profitProjects.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Rentabilidade por Projeto</CardTitle>
              <CardDescription>Margem de lucro de cada projeto considerando repasses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">Projeto</th>
                      <th className="text-right py-3 px-2 font-medium">Receita</th>
                      <th className="text-right py-3 px-2 font-medium">Repasses</th>
                      <th className="text-right py-3 px-2 font-medium">Lucro</th>
                      <th className="text-right py-3 px-2 font-medium">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitProjects.slice(0, 10).map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-3 px-2">{p.name}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(p.total_value + p.total_alterations)}</td>
                        <td className="py-3 px-2 text-right text-destructive">{formatCurrency(p.total_payouts)}</td>
                        <td className="py-3 px-2 text-right text-success">{formatCurrency(p.profit)}</td>
                        <td className="py-3 px-2 text-right font-medium">{p.profit_margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td className="py-3 px-2 font-bold">Total</td>
                      <td className="py-3 px-2 text-right font-bold">{formatCurrency(totalRevenue)}</td>
                      <td className="py-3 px-2 text-right font-bold text-destructive">{formatCurrency(totalPayouts)}</td>
                      <td className="py-3 px-2 text-right font-bold text-success">{formatCurrency(totalProfit)}</td>
                      <td className="py-3 px-2 text-right font-bold">{averageMargin.toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
