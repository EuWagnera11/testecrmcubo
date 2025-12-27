import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MousePointer, Eye, Target, Users, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  platform: string | null;
  status: string;
}

interface CampaignMetric {
  campaign_id: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  conversions: number;
  leads: number;
}

interface ClientCampaignChartsProps {
  campaigns: Campaign[];
  campaignMetrics: Record<string, CampaignMetric[]>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const platformIcons: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  google: '🔍',
  tiktok: '🎵',
  linkedin: '💼',
};

export function ClientCampaignCharts({ campaigns, campaignMetrics }: ClientCampaignChartsProps) {
  // Calculate totals across all campaigns
  const totals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    let leads = 0;
    let reach = 0;

    Object.values(campaignMetrics).forEach(metrics => {
      metrics.forEach(m => {
        impressions += m.impressions || 0;
        clicks += m.clicks || 0;
        conversions += m.conversions || 0;
        leads += m.leads || 0;
        reach += m.reach || 0;
      });
    });

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return { impressions, clicks, conversions, leads, reach, ctr };
  }, [campaignMetrics]);

  // Build chart data for performance over time
  const performanceData = useMemo(() => {
    const dateMap = new Map<string, { impressions: number; clicks: number }>();

    Object.values(campaignMetrics).forEach(metrics => {
      metrics.forEach(m => {
        const existing = dateMap.get(m.date) || { impressions: 0, clicks: 0 };
        dateMap.set(m.date, {
          impressions: existing.impressions + (m.impressions || 0),
          clicks: existing.clicks + (m.clicks || 0),
        });
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        dateFormatted: format(new Date(date), "dd/MM", { locale: ptBR }),
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);
  }, [campaignMetrics]);

  // Build data for campaign comparison
  const campaignComparisonData = useMemo(() => {
    return campaigns.map(campaign => {
      const metrics = campaignMetrics[campaign.id] || [];
      const totalClicks = metrics.reduce((acc, m) => acc + (m.clicks || 0), 0);
      const totalConversions = metrics.reduce((acc, m) => acc + (m.conversions || 0), 0);
      
      return {
        name: campaign.name.length > 12 ? campaign.name.substring(0, 12) + '...' : campaign.name,
        fullName: campaign.name,
        cliques: totalClicks,
        conversões: totalConversions,
      };
    }).filter(d => d.cliques > 0 || d.conversões > 0);
  }, [campaigns, campaignMetrics]);

  // Build pie chart data for impressions distribution
  const impressionsDistribution = useMemo(() => {
    return campaigns.map((campaign, index) => {
      const metrics = campaignMetrics[campaign.id] || [];
      const totalImpressions = metrics.reduce((acc, m) => acc + (m.impressions || 0), 0);
      
      return {
        name: campaign.name,
        value: totalImpressions,
        fill: COLORS[index % COLORS.length],
      };
    }).filter(d => d.value > 0);
  }, [campaigns, campaignMetrics]);

  if (campaigns.length === 0) {
    return null;
  }

  const hasData = Object.values(campaignMetrics).some(m => m.length > 0);
  if (!hasData) {
    return null;
  }

  const kpis = [
    { title: 'Impressões', value: totals.impressions.toLocaleString('pt-BR'), icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Cliques', value: totals.clicks.toLocaleString('pt-BR'), icon: MousePointer, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'CTR', value: `${totals.ctr.toFixed(2)}%`, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Conversões', value: totals.conversions.toLocaleString('pt-BR'), icon: Target, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Leads', value: totals.leads.toLocaleString('pt-BR'), icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'Alcance', value: totals.reach.toLocaleString('pt-BR'), icon: BarChart3, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Campaigns List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Campanhas Ativas</h2>
        <div className="flex flex-wrap gap-2">
          {campaigns.map(campaign => (
            <Badge key={campaign.id} variant="secondary" className="text-sm py-1.5 px-3">
              {campaign.platform && platformIcons[campaign.platform]} {campaign.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      {performanceData.length > 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Performance das Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientImpressionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clientClicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString('pt-BR'),
                    name === 'impressions' ? 'Impressões' : 'Cliques'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  fill="url(#clientImpressionsGradient)"
                  strokeWidth={2}
                  name="impressions"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#clientClicksGradient)"
                  strokeWidth={2}
                  name="clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaign Comparison & Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {campaignComparisonData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Comparativo de Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignComparisonData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    stroke="hsl(var(--muted-foreground))" 
                    width={90} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('pt-BR'),
                      name === 'cliques' ? 'Cliques' : 'Conversões'
                    ]}
                  />
                  <Bar dataKey="cliques" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="cliques" />
                  <Bar dataKey="conversões" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="conversões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {impressionsDistribution.length > 1 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Impressões</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={impressionsDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {impressionsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Impressões']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
