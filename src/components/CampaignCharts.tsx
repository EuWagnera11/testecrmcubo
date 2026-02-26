import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Pie, PieChart, Legend } from 'recharts';
import { TrendingUp, MousePointer, DollarSign, Target, Users, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface CampaignChartsProps {
  projectId: string;
  currency: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function CampaignCharts({ projectId, currency }: CampaignChartsProps) {
  const { campaigns } = useCampaigns(projectId);

  // Fetch all metrics for all campaigns at once
  const { data: allMetrics = [] } = useQuery({
    queryKey: ['all-campaign-metrics-charts', projectId],
    queryFn: async () => {
      if (!campaigns?.length) return [];
      
      const campaignIds = campaigns.map(c => c.id);
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaigns?.length,
  });

  const fmtCurrency = (value: number) => formatCurrency(value, currency || 'BRL');

  // Group metrics by campaign
  const metricsByCampaign = useMemo(() => {
    const map: Record<string, typeof allMetrics> = {};
    campaigns.forEach(c => {
      map[c.id] = allMetrics.filter(m => m.campaign_id === c.id);
    });
    return map;
  }, [campaigns, allMetrics]);

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Crie campanhas e adicione métricas para visualizar os gráficos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <KPISummary campaigns={campaigns} metricsByCampaign={metricsByCampaign} currency={currency} />

      {/* Performance Over Time */}
      <PerformanceChart campaigns={campaigns} metricsByCampaign={metricsByCampaign} />

      {/* Campaign Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <SpendDistribution campaigns={campaigns} metricsByCampaign={metricsByCampaign} currency={currency} />
        <CampaignComparison campaigns={campaigns} metricsByCampaign={metricsByCampaign} />
      </div>
    </div>
  );
}

interface MetricsByCampaign {
  [campaignId: string]: any[];
}

function KPISummary({ campaigns, metricsByCampaign, currency }: { campaigns: any[]; metricsByCampaign: MetricsByCampaign; currency: string }) {
  const totals = useMemo(() => {
    let impressions = 0, clicks = 0, spend = 0, conversions = 0, leads = 0, revenue = 0;
    
    Object.values(metricsByCampaign).forEach(metrics => {
      metrics.forEach(m => {
        impressions += m?.impressions || 0;
        clicks += m?.clicks || 0;
        spend += m?.spend || 0;
        conversions += m?.conversions || 0;
        leads += m?.leads || 0;
        revenue += m?.revenue || 0;
      });
    });
    
    return { impressions, clicks, spend, conversions, leads, revenue };
  }, [metricsByCampaign]);

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const fmt = (value: number) => formatCurrency(value, currency || 'BRL');

  const kpis = [
    { title: 'Impressões', value: totals.impressions.toLocaleString('pt-BR'), icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Cliques', value: totals.clicks.toLocaleString('pt-BR'), icon: MousePointer, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'CTR Médio', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Total Gasto', value: fmt(totals.spend), icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'CPC Médio', value: fmt(avgCpc), icon: MousePointer, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { title: 'Conversões', value: totals.conversions.toLocaleString('pt-BR'), icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { title: 'Leads', value: totals.leads.toLocaleString('pt-BR'), icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'ROAS', value: `${roas.toFixed(2)}x`, icon: roas >= 1 ? ArrowUpRight : ArrowDownRight, color: roas >= 1 ? 'text-green-500' : 'text-red-500', bgColor: roas >= 1 ? 'bg-green-500/10' : 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PerformanceChart({ campaigns, metricsByCampaign }: { campaigns: any[]; metricsByCampaign: MetricsByCampaign }) {
  const chartData = useMemo(() => {
    const allDates = new Map<string, { impressions: number; clicks: number; spend: number }>();

    Object.values(metricsByCampaign).forEach(metrics => {
      metrics.forEach((m: any) => {
        const existing = allDates.get(m.date) || { impressions: 0, clicks: 0, spend: 0 };
        allDates.set(m.date, {
          impressions: existing.impressions + (m.impressions || 0),
          clicks: existing.clicks + (m.clicks || 0),
          spend: existing.spend + (m.spend || 0),
        });
      });
    });

    return Array.from(allDates.entries())
      .map(([date, data]) => ({
        date,
        dateFormatted: format(new Date(date), "dd/MM", { locale: ptBR }),
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [metricsByCampaign]);

  if (chartData.length === 0) {
    return null;
  }

  const chartConfig = {
    impressions: { label: "Impressões", color: "hsl(var(--primary))" },
    clicks: { label: "Cliques", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Performance ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="url(#impressionsGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" fill="url(#clicksGradient)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function SpendDistribution({ campaigns, metricsByCampaign, currency }: { campaigns: any[]; metricsByCampaign: MetricsByCampaign; currency?: string }) {
  const chartData = useMemo(() => {
    return campaigns.map((campaign, index) => {
      const metrics = metricsByCampaign[campaign.id] || [];
      const totalSpend = metrics.reduce((acc: number, m: any) => acc + (m.spend || 0), 0);
      return {
        name: campaign.name,
        value: totalSpend,
        fill: COLORS[index % COLORS.length],
      };
    }).filter(d => d.value > 0);
  }, [campaigns, metricsByCampaign]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribuição de Investimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                formatter={(value, entry: any) => (
                  <span className="text-xs">
                    {entry.payload.name}: {formatCurrency(entry.payload.value, currency || 'BRL')}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignComparison({ campaigns, metricsByCampaign }: { campaigns: any[]; metricsByCampaign: MetricsByCampaign }) {
  const chartData = useMemo(() => {
    return campaigns.map((campaign) => {
      const metrics = metricsByCampaign[campaign.id] || [];
      const totals = metrics.reduce(
        (acc: any, m: any) => ({
          clicks: acc.clicks + (m.clicks || 0),
          conversions: acc.conversions + (m.conversions || 0),
        }),
        { clicks: 0, conversions: 0 }
      );
      return {
        name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
        cliques: totals.clicks,
        conversões: totals.conversions,
      };
    });
  }, [campaigns, metricsByCampaign]);

  if (chartData.every(d => d.cliques === 0 && d.conversões === 0)) {
    return null;
  }

  const chartConfig = {
    cliques: { label: "Cliques", color: "hsl(var(--primary))" },
    conversões: { label: "Conversões", color: "hsl(var(--chart-3))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Comparativo de Campanhas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="cliques" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            <Bar dataKey="conversões" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
