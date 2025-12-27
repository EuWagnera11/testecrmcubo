import { useRef, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { PDFExport } from '@/components/PDFExport';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, MousePointer, ShoppingCart, TrendingUp, 
  Heart, Users2, BarChart3, Palette, FileText, MessageSquare,
  FileIcon, AlertCircle, Loader2, Image, Layers, Target, 
  DollarSign, Percent, Zap, Calendar, Building2, Award,
  ChevronDown, ChevronUp, Sparkles, ArrowUpRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';

// Validate UUID format
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Log dashboard access for audit trail
const logDashboardAccess = async (projectId: string, shareToken: string) => {
  try {
    await supabase.from('dashboard_access_logs').insert({
      project_id: projectId,
      share_token: shareToken,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log dashboard access:', error);
  }
};

const CHART_COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

const platformIcons: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  google: '🔍',
  tiktok: '🎵',
  linkedin: '💼',
};

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  
  const isTokenValid = token && isValidUUID(token);

  // First, get the project to find the client_id
  const { data: initialProject, isLoading: initialLoading } = useQuery({
    queryKey: ['initial-project', token],
    queryFn: async () => {
      if (!token) throw new Error('Token não fornecido');
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, client_id')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Dashboard não encontrado');
      
      return data;
    },
    enabled: isTokenValid,
  });

  // Get client info
  const { data: clientData } = useQuery({
    queryKey: ['client-info', initialProject?.client_id],
    queryFn: async () => {
      if (!initialProject?.client_id) return null;
      
      const { data } = await supabase
        .from('clients')
        .select('id, name, company, email')
        .eq('id', initialProject.client_id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!initialProject?.client_id,
  });

  // Get ALL projects for this client
  const { data: allProjects, isLoading } = useQuery({
    queryKey: ['all-client-projects', initialProject?.client_id],
    queryFn: async () => {
      if (!initialProject?.client_id) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          currency,
          status,
          total_value,
          static_creatives,
          carousel_creatives,
          project_type,
          created_at,
          deadline,
          project_fields (field_type, content, attachments, link_url)
        `)
        .eq('client_id', initialProject.client_id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!initialProject?.client_id,
  });

  // Get all campaigns for all projects
  const { data: allCampaigns } = useQuery({
    queryKey: ['all-client-campaigns', allProjects?.map(p => p.id)],
    queryFn: async () => {
      if (!allProjects?.length) return [];
      
      const projectIds = allProjects.map(p => p.id);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!allProjects?.length,
  });

  // Get all campaign metrics
  const { data: allMetrics } = useQuery({
    queryKey: ['all-campaign-metrics', allCampaigns?.map(c => c.id)],
    queryFn: async () => {
      if (!allCampaigns?.length) return [];
      
      const campaignIds = allCampaigns.map(c => c.id);
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!allCampaigns?.length,
  });

  // Log access
  useEffect(() => {
    if (initialProject && token) {
      logDashboardAccess(initialProject.id, token);
    }
  }, [initialProject, token]);

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    if (!allMetrics?.length || !allProjects?.length) {
      return {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalLeads: 0,
        totalReach: 0,
        avgCTR: 0,
        avgCPC: 0,
        avgCPL: 0,
        totalROAS: 0,
        totalRevenue: 0,
        totalStaticCreatives: 0,
        totalCarouselCreatives: 0,
        projectsDelivered: 0,
        activeProjects: 0,
        dailyData: [],
        campaignBreakdown: [],
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    // Filter metrics by selected month
    const monthMetrics = allMetrics.filter(m => {
      const date = new Date(m.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    // Calculate totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalLeads = 0;
    let totalReach = 0;
    let totalRevenue = 0;

    monthMetrics.forEach(m => {
      totalSpend += Number(m.spend) || 0;
      totalImpressions += Number(m.impressions) || 0;
      totalClicks += Number(m.clicks) || 0;
      totalConversions += Number(m.conversions) || 0;
      totalLeads += Number(m.leads) || 0;
      totalReach += Number(m.reach) || 0;
      totalRevenue += Number(m.revenue) || 0;
    });

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const totalROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Calculate creative totals from projects created/updated in this month
    let totalStaticCreatives = 0;
    let totalCarouselCreatives = 0;
    let projectsDelivered = 0;
    let activeProjects = 0;

    allProjects.forEach(p => {
      const createdDate = new Date(p.created_at);
      if (isWithinInterval(createdDate, { start: monthStart, end: monthEnd }) || 
          p.status === 'active') {
        totalStaticCreatives += p.static_creatives || 0;
        totalCarouselCreatives += p.carousel_creatives || 0;
      }
      if (p.status === 'completed') projectsDelivered++;
      if (p.status === 'active') activeProjects++;
    });

    // Daily aggregation for chart
    const dailyMap = new Map<string, any>();
    monthMetrics.forEach(m => {
      const existing = dailyMap.get(m.date) || {
        date: m.date,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
      };
      dailyMap.set(m.date, {
        ...existing,
        impressions: existing.impressions + (Number(m.impressions) || 0),
        clicks: existing.clicks + (Number(m.clicks) || 0),
        spend: existing.spend + (Number(m.spend) || 0),
        conversions: existing.conversions + (Number(m.conversions) || 0),
      });
    });

    const dailyData = Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({
        ...d,
        dateFormatted: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
      }));

    // Campaign breakdown
    const campaignBreakdown = allCampaigns?.map(campaign => {
      const campaignMetrics = monthMetrics.filter(m => m.campaign_id === campaign.id);
      const spend = campaignMetrics.reduce((acc, m) => acc + (Number(m.spend) || 0), 0);
      const impressions = campaignMetrics.reduce((acc, m) => acc + (Number(m.impressions) || 0), 0);
      const clicks = campaignMetrics.reduce((acc, m) => acc + (Number(m.clicks) || 0), 0);
      const conversions = campaignMetrics.reduce((acc, m) => acc + (Number(m.conversions) || 0), 0);
      const leads = campaignMetrics.reduce((acc, m) => acc + (Number(m.leads) || 0), 0);
      const reach = campaignMetrics.reduce((acc, m) => acc + (Number(m.reach) || 0), 0);
      const revenue = campaignMetrics.reduce((acc, m) => acc + (Number(m.revenue) || 0), 0);

      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        spend,
        impressions,
        clicks,
        conversions,
        leads,
        reach,
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? revenue / spend : 0,
        metrics: campaignMetrics,
      };
    }).filter(c => c.spend > 0 || c.impressions > 0) || [];

    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalLeads,
      totalReach,
      avgCTR,
      avgCPC,
      avgCPL,
      totalROAS,
      totalRevenue,
      totalStaticCreatives,
      totalCarouselCreatives,
      projectsDelivered,
      activeProjects,
      dailyData,
      campaignBreakdown,
    };
  }, [allMetrics, allProjects, allCampaigns, selectedMonth]);

  // Spend by project
  const projectSpendData = useMemo(() => {
    if (!allCampaigns?.length || !allMetrics?.length || !allProjects?.length) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    return allProjects.map((project, index) => {
      const projectCampaigns = allCampaigns.filter(c => c.project_id === project.id);
      const campaignIds = projectCampaigns.map(c => c.id);
      const projectMetrics = allMetrics.filter(m => 
        campaignIds.includes(m.campaign_id) &&
        isWithinInterval(new Date(m.date), { start: monthStart, end: monthEnd })
      );
      const spend = projectMetrics.reduce((acc, m) => acc + (Number(m.spend) || 0), 0);

      return {
        name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
        fullName: project.name,
        value: spend,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      };
    }).filter(p => p.value > 0);
  }, [allProjects, allCampaigns, allMetrics, selectedMonth]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = subMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Link inválido</h1>
            <p className="text-muted-foreground">
              O link que você está tentando acessar não é válido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <Loader2 className="h-10 w-10 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-lg">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!clientData || !allProjects?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Dashboard não encontrado</h1>
            <p className="text-muted-foreground">
              Este link pode ter expirado ou o compartilhamento foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = clientData.company || clientData.name;
  const hasCampaigns = allCampaigns && allCampaigns.length > 0;
  const hasMetrics = monthlyData.totalImpressions > 0 || monthlyData.totalSpend > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Premium Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-primary font-medium italic text-xl">refine</span>
              <span className="font-black text-2xl tracking-tighter">CUBO</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="outline" className="text-xs font-normal">
              <Sparkles className="h-3 w-3 mr-1" />
              Dashboard Premium
            </Badge>
          </div>
          <PDFExport contentRef={contentRef} fileName={`relatorio-${clientName}-${selectedMonth}`} />
        </div>
      </header>

      <main ref={contentRef} className="container mx-auto px-4 py-8 space-y-8">
        {/* Client Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                    Relatório de Performance
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {clientName}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {monthOptions.find(m => m.value === selectedMonth)?.label}
                </p>
              </div>
              
              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Activity className="h-4 w-4" />
                  Projetos Ativos
                </div>
                <p className="text-3xl font-bold">{monthlyData.activeProjects}</p>
              </div>
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Award className="h-4 w-4" />
                  Entregues
                </div>
                <p className="text-3xl font-bold">{monthlyData.projectsDelivered}</p>
              </div>
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Image className="h-4 w-4" />
                  Criativos Estáticos
                </div>
                <p className="text-3xl font-bold">{monthlyData.totalStaticCreatives}</p>
              </div>
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Layers className="h-4 w-4" />
                  Carrosséis
                </div>
                <p className="text-3xl font-bold">{monthlyData.totalCarouselCreatives}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Projetos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance KPIs */}
            {hasMetrics && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-medium">Impressões</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.totalImpressions.toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-green-500 mb-2">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-xs font-medium">Cliques</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.totalClicks.toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-purple-500 mb-2">
                        <Percent className="h-4 w-4" />
                        <span className="text-xs font-medium">CTR</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.avgCTR.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-orange-500 mb-2">
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-medium">Conversões</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.totalConversions.toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-pink-500 mb-2">
                        <Users2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Leads</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.totalLeads.toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-cyan-500 mb-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-xs font-medium">Alcance</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {monthlyData.totalReach.toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Investment Summary */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Performance Diária
                      </CardTitle>
                      <CardDescription>
                        Evolução de impressões e cliques ao longo do mês
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyData.dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyData.dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="dateFormatted" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
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
                              fill="url(#impressionsGrad)"
                              strokeWidth={2}
                            />
                            <Area
                              type="monotone"
                              dataKey="clicks"
                              stroke="hsl(var(--chart-2))"
                              fill="url(#clicksGrad)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Sem dados de performance para este período
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Investimento do Mês
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl border border-green-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Total Investido</p>
                        <p className="text-4xl font-bold text-green-500">
                          R$ {monthlyData.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">CPC Médio</span>
                          <span className="font-semibold">
                            R$ {monthlyData.avgCPC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">CPL Médio</span>
                          <span className="font-semibold">
                            R$ {monthlyData.avgCPL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {monthlyData.totalROAS > 0 && (
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">ROAS</span>
                            <span className="font-semibold text-green-500">
                              {monthlyData.totalROAS.toFixed(2)}x
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Spend Distribution */}
                {projectSpendData.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Investimento por Projeto
                      </CardTitle>
                      <CardDescription>
                        Distribuição do investimento entre os projetos ativos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={projectSpendData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {projectSpendData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [
                                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                'Investimento'
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                          {projectSpendData.map((project, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: project.fill }}
                                />
                                <span className="text-sm font-medium">{project.fullName}</span>
                              </div>
                              <span className="font-semibold">
                                R$ {project.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!hasMetrics && (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sem dados de tráfego</h3>
                  <p className="text-muted-foreground">
                    Nenhuma campanha ativa ou métricas registradas para este período.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {hasCampaigns ? (
              <>
                {/* Campaign Cards */}
                <div className="grid gap-4">
                  {monthlyData.campaignBreakdown.map((campaign, index) => (
                    <Card 
                      key={campaign.id} 
                      className="border-border/50 overflow-hidden transition-all hover:shadow-lg"
                    >
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => setExpandedCampaign(
                          expandedCampaign === campaign.id ? null : campaign.id
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-10 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {campaign.platform && platformIcons[campaign.platform]}
                                {campaign.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                  {campaign.status === 'active' ? 'Ativa' : campaign.status}
                                </Badge>
                                <span>•</span>
                                <span>R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} investidos</span>
                              </CardDescription>
                            </div>
                          </div>
                          {expandedCampaign === campaign.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedCampaign === campaign.id && (
                        <CardContent className="border-t border-border/50 pt-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <Eye className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Impressões</p>
                              <p className="text-lg font-bold">{campaign.impressions.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <MousePointer className="h-5 w-5 text-green-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Cliques</p>
                              <p className="text-lg font-bold">{campaign.clicks.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <Percent className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">CTR</p>
                              <p className="text-lg font-bold">{campaign.ctr.toFixed(2)}%</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <DollarSign className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">CPC</p>
                              <p className="text-lg font-bold">R$ {campaign.cpc.toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <Target className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Conversões</p>
                              <p className="text-lg font-bold">{campaign.conversions.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <Users2 className="h-5 w-5 text-cyan-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Leads</p>
                              <p className="text-lg font-bold">{campaign.leads.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                              <BarChart3 className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Alcance</p>
                              <p className="text-lg font-bold">{campaign.reach.toLocaleString('pt-BR')}</p>
                            </div>
                            {campaign.roas > 0 && (
                              <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <ArrowUpRight className="h-5 w-5 text-green-500 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">ROAS</p>
                                <p className="text-lg font-bold text-green-500">{campaign.roas.toFixed(2)}x</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {monthlyData.campaignBreakdown.length === 0 && (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sem métricas neste período</h3>
                      <p className="text-muted-foreground">
                        Nenhuma campanha com métricas registradas em {monthOptions.find(m => m.value === selectedMonth)?.label}.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sem campanhas ativas</h3>
                  <p className="text-muted-foreground">
                    Não há campanhas de tráfego pago configuradas para este cliente.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProjects.map((project, index) => (
                <Card key={project.id} className="border-border/50 overflow-hidden">
                  <div 
                    className="h-1.5"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status === 'completed' ? 'Concluído' : 'Ativo'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.project_type || 'Projeto'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <Image className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Estáticos</p>
                        <p className="font-bold">{project.static_creatives || 0}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <Layers className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Carrosséis</p>
                        <p className="font-bold">{project.carousel_creatives || 0}</p>
                      </div>
                    </div>
                    
                    {/* Project Fields Preview */}
                    {project.project_fields && project.project_fields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.project_fields.map((field: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {field.field_type === 'design' && <Palette className="h-3 w-3 mr-1" />}
                            {field.field_type === 'copy' && <FileText className="h-3 w-3 mr-1" />}
                            {field.field_type === 'traffic' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {field.field_type === 'social_media' && <MessageSquare className="h-3 w-3 mr-1" />}
                            {field.field_type}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Prazo: {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Dashboard gerado por <span className="text-primary font-medium">Refine Cubo</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
