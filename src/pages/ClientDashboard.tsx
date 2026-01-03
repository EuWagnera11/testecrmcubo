import { useRef, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, subMonths, isWithinInterval } from 'date-fns';
import { getClientFiscalMonthRange, getClientFiscalMonthFromDate } from '@/lib/fiscalMonth';
import { PDFExport } from '@/components/PDFExport';
import { ClientMonthHistory } from '@/components/ClientMonthHistory';
import { useClientClosures } from '@/hooks/useClientClosures';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, MousePointer, TrendingUp, 
  Users2, BarChart3, Palette, FileText, MessageSquare, MessageCircle,
  FileIcon, AlertCircle, Loader2, Image, Layers, Target, 
  DollarSign, Percent, Zap, Calendar, Building2, Award,
  ChevronDown, ChevronUp, Sparkles, ArrowUpRight, Activity,
  ArrowDownRight, TrendingDown, Lightbulb, CheckCircle2, 
  AlertTriangle, Info, Star, Flame, ThumbsUp, Clock, Mail, Phone,
  Video, GraduationCap, Globe, Lock
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
  PieChart, Pie, Cell, Legend
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

// Project type config
const projectTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  traffic: { label: 'Tráfego Pago', icon: TrendingUp, color: 'text-green-500' },
  design: { label: 'Design', icon: Palette, color: 'text-pink-500' },
  copy: { label: 'Copywriting', icon: FileText, color: 'text-blue-500' },
  social_media: { label: 'Social Media', icon: MessageSquare, color: 'text-purple-500' },
  audiovisual: { label: 'Audiovisual', icon: Video, color: 'text-orange-500' },
};

// Calculate percentage change
const calcChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
};

// Generate insights based on metrics
interface Insight {
  type: 'success' | 'warning' | 'info' | 'alert';
  icon: React.ElementType;
  title: string;
  description: string;
}

const generateInsights = (
  current: any, 
  previous: any, 
  campaigns: any[]
): Insight[] => {
  const insights: Insight[] = [];
  
  // Only generate traffic insights if there's traffic data
  if (current.totalSpend === 0 && current.totalImpressions === 0) {
    return insights;
  }
  
  // CTR Analysis
  if (current.avgCTR >= 2) {
    insights.push({
      type: 'success',
      icon: ThumbsUp,
      title: 'CTR Excelente!',
      description: `Seu CTR de ${current.avgCTR.toFixed(2)}% está acima da média do mercado (1-2%). Seus anúncios estão atraindo muita atenção!`
    });
  } else if (current.avgCTR > 0 && current.avgCTR < 0.5) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'CTR Baixo',
      description: `CTR de ${current.avgCTR.toFixed(2)}% está abaixo do ideal. Considere revisar os criativos e segmentação.`
    });
  }

  // CPC Comparison
  if (previous.avgCPC > 0 && current.avgCPC < previous.avgCPC) {
    const reduction = ((previous.avgCPC - current.avgCPC) / previous.avgCPC * 100).toFixed(0);
    insights.push({
      type: 'success',
      icon: TrendingDown,
      title: 'CPC Reduzido!',
      description: `Seu custo por clique caiu ${reduction}% em relação ao mês anterior. Ótima otimização!`
    });
  }

  // Spend Efficiency
  if (current.totalConversions > 0 && current.totalSpend > 0) {
    const costPerConversion = current.totalSpend / current.totalConversions;
    if (costPerConversion < 50) {
      insights.push({
        type: 'success',
        icon: Flame,
        title: 'Conversões Eficientes',
        description: `Custo por conversão de R$ ${costPerConversion.toFixed(2)} está excelente para o mercado!`
      });
    }
  }

  // Growth Detection
  if (previous.totalImpressions > 0) {
    const growth = ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions * 100);
    if (growth > 20) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Crescimento de Alcance',
        description: `Suas impressões cresceram ${growth.toFixed(0)}% este mês. Excelente expansão de visibilidade!`
      });
    }
  }

  // ROAS Analysis
  if (current.totalROAS >= 3) {
    insights.push({
      type: 'success',
      icon: Star,
      title: 'ROAS Extraordinário!',
      description: `Retorno de ${current.totalROAS.toFixed(1)}x sobre investimento. Cada R$1 investido retorna R$${current.totalROAS.toFixed(2)}!`
    });
  } else if (current.totalROAS > 0 && current.totalROAS < 1) {
    insights.push({
      type: 'alert',
      icon: AlertCircle,
      title: 'ROAS Abaixo de 1',
      description: `O retorno está negativo. Recomendamos revisar a estratégia de conversão.`
    });
  }

  // Lead Generation
  if (current.totalLeads > previous.totalLeads && previous.totalLeads > 0) {
    const increase = ((current.totalLeads - previous.totalLeads) / previous.totalLeads * 100).toFixed(0);
    insights.push({
      type: 'success',
      icon: Users2,
      title: 'Mais Leads Gerados',
      description: `Aumento de ${increase}% em leads capturados em comparação ao mês anterior.`
    });
  }

  // Best Performing Campaign
  if (campaigns.length > 1) {
    const bestCampaign = campaigns.reduce((best, curr) => 
      curr.ctr > (best?.ctr || 0) ? curr : best, null
    );
    if (bestCampaign && bestCampaign.ctr > 0) {
      insights.push({
        type: 'info',
        icon: Award,
        title: 'Campanha Destaque',
        description: `"${bestCampaign.name}" tem o melhor CTR (${bestCampaign.ctr.toFixed(2)}%) entre suas campanhas ativas.`
      });
    }
  }

  return insights.slice(0, 5); // Limit to 5 insights
};

// Helper to detect project types from projects
const detectProjectTypes = (projects: any[]): Set<string> => {
  const types = new Set<string>();
  
  projects?.forEach(project => {
    // Check project_types array first
    if (project.project_types && Array.isArray(project.project_types)) {
      project.project_types.forEach((t: string) => types.add(t));
    }
    // Fallback to project_type string
    else if (project.project_type) {
      project.project_type.split(',').forEach((t: string) => types.add(t.trim()));
    }
  });
  
  return types;
};

// Check if client has traffic projects
const hasTrafficType = (types: Set<string>): boolean => {
  return types.has('trafego_pago') || types.has('traffic') || types.has('trafego');
};

// Check if client has design projects  
const hasDesignType = (types: Set<string>): boolean => {
  return types.has('design') || types.has('branding');
};

// Check if client has copy projects
const hasCopyType = (types: Set<string>): boolean => {
  return types.has('copy') || types.has('copywriting');
};

// Check if client has social media projects
const hasSocialType = (types: Set<string>): boolean => {
  return types.has('social_media');
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

  // First, get the shared project (public entrypoint) to find the client_id
  const { data: initialProject, isLoading: initialLoading } = useQuery({
    queryKey: ['initial-project', token],
    queryFn: async () => {
      if (!token) throw new Error('Token não fornecido');

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          client_id,
          name,
          currency,
          status,
          total_value,
          static_creatives,
          carousel_creatives,
          project_type,
          project_types,
          created_at,
          updated_at,
          deadline,
          advance_payment,
          advance_percentage,
          share_enabled
        `)
        .eq('share_token', token)
        .eq('share_enabled', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Dashboard não encontrado');

      return data;
    },
    enabled: isTokenValid,
  });

  // Get client info (try direct clients table; fallback to shared view for public dashboards)
  const { data: clientData } = useQuery({
    queryKey: ['client-info', initialProject?.client_id, initialProject?.id],
    queryFn: async () => {
      if (!initialProject?.client_id) return null;

      // 1) Try reading from clients (works for authenticated/internal)
      try {
        const { data } = await supabase
          .from('clients')
          .select('id, name, company, email, phone, status, created_at, plan_billing_day')
          .eq('id', initialProject.client_id)
          .maybeSingle();

        if (data) return data;
      } catch {
        // ignore and fallback
      }

      // 2) Fallback for public shared dashboards
      const { data: shared } = await supabase
        .from('shared_project_clients')
        .select('id, name, company')
        .eq('project_id', initialProject.id)
        .maybeSingle();

      if (!shared) return null;

      return {
        id: shared.id,
        name: shared.name,
        company: shared.company,
        email: null,
        phone: null,
        status: 'active',
        created_at: new Date().toISOString(),
        plan_billing_day: 1,
      };
    },
    enabled: !!initialProject?.client_id && !!initialProject?.id,
  });

  // Public dashboard only has access to the shared project itself
  const allProjects = useMemo<any[]>(() => {
    return initialProject ? [initialProject as any] : [];
  }, [initialProject]);

  const isLoading = initialLoading;

  // Detect project types for this client
  const clientProjectTypes = useMemo(() => {
    return detectProjectTypes(allProjects || []);
  }, [allProjects]);

  const hasTraffic = hasTrafficType(clientProjectTypes);
  const hasDesign = hasDesignType(clientProjectTypes);
  const hasCopy = hasCopyType(clientProjectTypes);
  const hasSocial = hasSocialType(clientProjectTypes);

  // Get all campaigns for all projects (only if has traffic)
  const { data: allCampaigns } = useQuery({
    queryKey: ['all-client-campaigns', initialProject?.client_id],
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
    enabled: !!allProjects?.length && hasTraffic,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Get all campaign metrics (only if has traffic)
  const { data: allMetrics } = useQuery({
    queryKey: ['all-campaign-metrics', initialProject?.client_id],
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
    enabled: !!allCampaigns?.length && hasTraffic,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Log access
  useEffect(() => {
    if (initialProject && token) {
      logDashboardAccess(initialProject.id, token);
    }
  }, [initialProject, token]);

  // Calculate monthly data helper with client billing day
  const calculateMonthlyTotals = (metrics: any[], projects: any[], campaigns: any[], month: string, billingDay: number = 1) => {
    const [year, m] = month.split('-').map(Number);
    const referenceDate = new Date(year, m - 1);
    const { start: monthStart, end: monthEnd } = getClientFiscalMonthRange(referenceDate, billingDay);

    const monthMetrics = metrics.filter(metric => {
      const date = new Date(metric.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

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

    // Calculate creative totals from projects
    let totalStaticCreatives = 0;
    let totalCarouselCreatives = 0;
    let projectsDelivered = 0;
    let activeProjects = 0;
    let totalProjectValue = 0;

    projects.forEach(p => {
      totalStaticCreatives += p.static_creatives || 0;
      totalCarouselCreatives += p.carousel_creatives || 0;
      totalProjectValue += Number(p.total_value) || 0;
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

    // Campaign breakdown (include campaigns even when there are no metrics in the period)
    const campaignBreakdown = campaigns?.map(campaign => {
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
    }) || [];

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
      totalProjectValue,
      dailyData,
      campaignBreakdown,
    };
  };

  // Get client billing day (default to 1 = standard calendar month)
  const clientBillingDay = clientData?.plan_billing_day || 1;

  // Update selectedMonth when clientData loads to reflect the correct fiscal month
  useEffect(() => {
    if (clientData?.plan_billing_day && clientData.plan_billing_day > 1) {
      const currentFiscalMonth = getClientFiscalMonthFromDate(new Date(), clientData.plan_billing_day);
      setSelectedMonth(format(currentFiscalMonth, 'yyyy-MM'));
    }
  }, [clientData?.plan_billing_day]);


  const campaignsForSelectedMonth = useMemo(() => {
    if (!allCampaigns?.length) return [];

    const [year, m] = selectedMonth.split('-').map(Number);
    const referenceDate = new Date(year, m - 1);
    const { start: monthStart, end: monthEnd } = getClientFiscalMonthRange(referenceDate, clientBillingDay);

    const overlapsFiscalMonth = (campaign: any) => {
      // If there are no dates, keep it visible (legacy data)
      if (!campaign.start_date && !campaign.end_date) return true;

      const start = campaign.start_date ? new Date(campaign.start_date) : null;
      const end = campaign.end_date ? new Date(campaign.end_date) : null;

      // Single-sided ranges
      if (start && !end) return start <= monthEnd;
      if (!start && end) return end >= monthStart;

      // Full range
      if (start && end) return start <= monthEnd && end >= monthStart;

      return true;
    };

    const hasMetricsInMonth = (campaignId: string) => {
      return (allMetrics || []).some(m =>
        m.campaign_id === campaignId &&
        isWithinInterval(new Date(m.date), { start: monthStart, end: monthEnd })
      );
    };

    // A campaign is considered part of the month if its date range overlaps OR it has at least one metric in the month
    return allCampaigns.filter(c => overlapsFiscalMonth(c) || hasMetricsInMonth(c.id));
  }, [allCampaigns, allMetrics, selectedMonth, clientBillingDay]);

  // Calculate current month data
  const monthlyData = useMemo(() => {
    if (!allProjects?.length) {
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
        totalProjectValue: 0,
        dailyData: [],
        campaignBreakdown: [],
      };
    }
    return calculateMonthlyTotals(allMetrics || [], allProjects, campaignsForSelectedMonth, selectedMonth, clientBillingDay);
  }, [allMetrics, allProjects, campaignsForSelectedMonth, selectedMonth, clientBillingDay]);

  // Calculate previous month data for comparison
  const previousMonthData = useMemo(() => {
    if (!allProjects?.length) {
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
        totalProjectValue: 0,
        dailyData: [],
        campaignBreakdown: [],
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = subMonths(new Date(year, month - 1), 1);
    const prevMonth = format(prevDate, 'yyyy-MM');

    const [py, pm] = prevMonth.split('-').map(Number);
    const prevReference = new Date(py, pm - 1);
    const { start: prevStart, end: prevEnd } = getClientFiscalMonthRange(prevReference, clientBillingDay);

    const campaignsForPrevMonth = (allCampaigns || []).filter(c => {
      if (!c.start_date && !c.end_date) return true;
      const start = c.start_date ? new Date(c.start_date) : null;
      const end = c.end_date ? new Date(c.end_date) : null;
      if (start && !end) return start <= prevEnd;
      if (!start && end) return end >= prevStart;
      if (start && end) return start <= prevEnd && end >= prevStart;

      return (allMetrics || []).some(m =>
        m.campaign_id === c.id &&
        isWithinInterval(new Date(m.date), { start: prevStart, end: prevEnd })
      );
    });

    return calculateMonthlyTotals(allMetrics || [], allProjects, campaignsForPrevMonth, prevMonth, clientBillingDay);
  }, [allMetrics, allProjects, allCampaigns, selectedMonth, clientBillingDay]);

  // Generate insights (only for traffic)
  const insights = useMemo(() => {
    if (!hasTraffic) return [];
    return generateInsights(monthlyData, previousMonthData, monthlyData.campaignBreakdown);
  }, [monthlyData, previousMonthData, hasTraffic]);

  // Spend by project
  const projectSpendData = useMemo(() => {
    if (!allCampaigns?.length || !allMetrics?.length || !allProjects?.length) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    const referenceDate = new Date(year, month - 1);
    const { start: monthStart, end: monthEnd } = getClientFiscalMonthRange(referenceDate, clientBillingDay);

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
  }, [allProjects, allCampaigns, allMetrics, selectedMonth, clientBillingDay]);

  // Generate month options with billing cycle display
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      const { start, end } = getClientFiscalMonthRange(date, clientBillingDay);
      const periodLabel = clientBillingDay > 1 
        ? ` (${format(start, 'dd/MM')} - ${format(end, 'dd/MM')})`
        : '';
      options.push({
        value: format(date, 'yyyy-MM'),
        label: `${format(date, 'MMMM yyyy', { locale: ptBR })}${periodLabel}`,
      });
    }
    return options;
  }, [clientBillingDay]);

  // Comparison data for KPIs
  const comparisons = useMemo(() => ({
    impressions: calcChange(monthlyData.totalImpressions, previousMonthData.totalImpressions),
    clicks: calcChange(monthlyData.totalClicks, previousMonthData.totalClicks),
    ctr: calcChange(monthlyData.avgCTR, previousMonthData.avgCTR),
    conversions: calcChange(monthlyData.totalConversions, previousMonthData.totalConversions),
    leads: calcChange(monthlyData.totalLeads, previousMonthData.totalLeads),
    reach: calcChange(monthlyData.totalReach, previousMonthData.totalReach),
    spend: calcChange(monthlyData.totalSpend, previousMonthData.totalSpend),
    cpc: calcChange(monthlyData.avgCPC, previousMonthData.avgCPC),
  }), [monthlyData, previousMonthData]);

  // Client totals across all time
  const lifetimeTotals = useMemo(() => {
    const totalProjects = allProjects?.length || 0;
    const totalValue = allProjects?.reduce((acc, p) => acc + (Number(p.total_value) || 0), 0) || 0;
    const totalStatic = allProjects?.reduce((acc, p) => acc + (p.static_creatives || 0), 0) || 0;
    const totalCarousel = allProjects?.reduce((acc, p) => acc + (p.carousel_creatives || 0), 0) || 0;
    const completedProjects = allProjects?.filter(p => p.status === 'completed').length || 0;
    const activeProjects = allProjects?.filter(p => p.status === 'active').length || 0;
    const cancelledProjects = allProjects?.filter(p => p.status === 'cancelled').length || 0;
    
    const totalSpendAllTime = allMetrics?.reduce((acc, m) => acc + (Number(m.spend) || 0), 0) || 0;
    const totalImpressionsAllTime = allMetrics?.reduce((acc, m) => acc + (Number(m.impressions) || 0), 0) || 0;
    const totalClicksAllTime = allMetrics?.reduce((acc, m) => acc + (Number(m.clicks) || 0), 0) || 0;
    const totalConversionsAllTime = allMetrics?.reduce((acc, m) => acc + (Number(m.conversions) || 0), 0) || 0;
    const totalLeadsAllTime = allMetrics?.reduce((acc, m) => acc + (Number(m.leads) || 0), 0) || 0;

    return {
      totalProjects,
      totalValue,
      totalStatic,
      totalCarousel,
      completedProjects,
      activeProjects,
      cancelledProjects,
      totalSpendAllTime,
      totalImpressionsAllTime,
      totalClicksAllTime,
      totalConversionsAllTime,
      totalLeadsAllTime,
    };
  }, [allProjects, allMetrics]);

  // Check if month is closed (must be called before any conditional returns)
  const { isMonthClosed, closures: clientClosures } = useClientClosures(clientData?.id);

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

  if (!initialProject) {
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

  const clientName = clientData?.company || clientData?.name || 'Cliente';
  const hasCampaigns = campaignsForSelectedMonth.length > 0;
  const hasMetrics = monthlyData.totalImpressions > 0 || monthlyData.totalSpend > 0;
  const hasCreatives = lifetimeTotals.totalStatic > 0 || lifetimeTotals.totalCarousel > 0;
  const selectedMonthClosed = isMonthClosed(selectedMonth);

  const ComparisonBadge = ({ change, inverted = false }: { change: { value: number; isPositive: boolean }; inverted?: boolean }) => {
    const isGood = inverted ? !change.isPositive : change.isPositive;
    if (change.value === 0) return null;
    
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-green-500' : 'text-red-500'}`}>
        {change.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {change.value.toFixed(0)}%
      </span>
    );
  };

  // Determine if traffic is the majority project type
  const isTrafficMajority = useMemo(() => {
    if (!allProjects?.length) return false;
    
    let trafficCount = 0;
    let totalTypeCount = 0;
    
    allProjects.forEach(project => {
      const types = project.project_types || (project.project_type ? project.project_type.split(',').map((t: string) => t.trim()) : []);
      types.forEach((type: string) => {
        totalTypeCount++;
        if (type === 'traffic' || type === 'trafego_pago' || type === 'trafego') {
          trafficCount++;
        }
      });
    });
    
    return totalTypeCount > 0 && trafficCount / totalTypeCount >= 0.5;
  }, [allProjects]);

  // Build dynamic tabs based on client project types
  const tabs = useMemo(() => {
    const result = [];
    
    // Show traffic tab only if client has traffic projects
    if (hasTraffic && (hasCampaigns || hasMetrics)) {
      result.push({ id: 'traffic', label: 'Tráfego Pago' });
    }
    
    // Always show projects tab
    result.push({ id: 'projects', label: 'Projetos' });
    
    // Show deliverables tab if has design/creative work
    if (hasDesign || hasCreatives) {
      result.push({ id: 'deliverables', label: 'Entregas' });
    }
    
    return result;
  }, [hasTraffic, hasCampaigns, hasMetrics, hasDesign, hasCreatives]);

  // Determine the default tab - traffic first if it's the majority type
  const defaultTab = isTrafficMajority && hasTraffic && (hasCampaigns || hasMetrics) 
    ? 'traffic' 
    : (tabs[0]?.id || 'projects');

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
          <div className="flex items-center gap-2">
            {clientData?.id && clientClosures.length > 0 && (
              <ClientMonthHistory clientId={clientData.id} clientName={clientName} />
            )}
            <PDFExport contentRef={contentRef} fileName={`relatorio-${clientName}-${selectedMonth}`} />
          </div>
        </div>
      </header>

      <main ref={contentRef} className="container mx-auto px-4 py-8 space-y-8">
        {/* Client Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                    Relatório de Performance
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {clientName}
                </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                   {clientData?.created_at && (
                     <span className="flex items-center gap-1.5">
                       <Calendar className="h-4 w-4" />
                       Cliente desde {format(new Date(clientData.created_at), 'MMMM yyyy', { locale: ptBR })}
                     </span>
                   )}
                  {clientData?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {clientData.email}
                    </span>
                  )}
                  {clientData?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {clientData.phone}
                    </span>
                  )}
                </div>
                {/* Project types badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from(clientProjectTypes).map(type => {
                    const config = projectTypeConfig[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <Badge key={type} variant="secondary" className="text-xs">
                        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              {/* Month Selector with closed badge */}
              <div className="flex items-center gap-3">
                {selectedMonthClosed && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Mês Fechado
                  </Badge>
                )}
                {hasTraffic && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary capitalize"
                  >
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value} className="capitalize">
                        {option.label}{isMonthClosed(option.value) ? ' ✓' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Lifetime Summary - Adaptive based on project types */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-8">
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Activity className="h-3.5 w-3.5" />
                  Total Projetos
                </div>
                <p className="text-2xl font-bold">{lifetimeTotals.totalProjects}</p>
              </div>
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Concluídos
                </div>
                <p className="text-2xl font-bold text-green-500">{lifetimeTotals.completedProjects}</p>
              </div>
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  Em Andamento
                </div>
                <p className="text-2xl font-bold text-yellow-500">{lifetimeTotals.activeProjects}</p>
              </div>
              {(hasDesign || hasCreatives) && (
                <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Image className="h-3.5 w-3.5" />
                    Criativos Entregues
                  </div>
                  <p className="text-2xl font-bold">{lifetimeTotals.totalStatic + lifetimeTotals.totalCarousel}</p>
                </div>
              )}
              <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Valor Total
                </div>
                <p className="text-xl font-bold">R$ {lifetimeTotals.totalValue.toLocaleString('pt-BR')}</p>
              </div>
              {hasTraffic && lifetimeTotals.totalSpendAllTime > 0 && (
                <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    Investido em Ads
                  </div>
                  <p className="text-xl font-bold">R$ {lifetimeTotals.totalSpendAllTime.toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights Section - Only for Traffic */}
        {hasTraffic && insights.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Insights do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                      insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      insight.type === 'alert' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <insight.icon className={`h-5 w-5 mt-0.5 ${
                        insight.type === 'success' ? 'text-green-500' :
                        insight.type === 'warning' ? 'text-yellow-500' :
                        insight.type === 'alert' ? 'text-red-500' :
                        'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-semibold text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs - Dynamic based on project types */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-card border border-border/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Traffic Tab - Only visible if has traffic projects */}
          {hasTraffic && (
            <TabsContent value="traffic" className="space-y-6">
              {/* Monthly Period Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold capitalize">
                  {monthOptions.find(m => m.value === selectedMonth)?.label}
                </h2>
                <Badge variant="outline">
                  vs. mês anterior
                </Badge>
              </div>

              {/* Performance KPIs with Comparison */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-blue-500">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-medium">Impressões</span>
                      </div>
                      <ComparisonBadge change={comparisons.impressions} />
                    </div>
                    <p className="text-2xl font-bold">
                      {monthlyData.totalImpressions.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-green-500">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-xs font-medium">Cliques</span>
                      </div>
                      <ComparisonBadge change={comparisons.clicks} />
                    </div>
                    <p className="text-2xl font-bold">
                      {monthlyData.totalClicks.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-purple-500">
                        <Percent className="h-4 w-4" />
                        <span className="text-xs font-medium">CTR</span>
                      </div>
                      <ComparisonBadge change={comparisons.ctr} />
                    </div>
                    <p className="text-2xl font-bold">
                      {monthlyData.avgCTR.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-orange-500">
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-medium">Conversões</span>
                      </div>
                      <ComparisonBadge change={comparisons.conversions} />
                    </div>
                    <p className="text-2xl font-bold">
                      {monthlyData.totalConversions.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-pink-500">
                        <Users2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Leads</span>
                      </div>
                      <ComparisonBadge change={comparisons.leads} />
                    </div>
                    <p className="text-2xl font-bold">
                      {monthlyData.totalLeads.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-cyan-500">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-xs font-medium">Alcance</span>
                      </div>
                      <ComparisonBadge change={comparisons.reach} />
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
                      <div className="mt-2">
                        <ComparisonBadge change={comparisons.spend} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">CPC Médio</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            R$ {monthlyData.avgCPC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <ComparisonBadge change={comparisons.cpc} inverted />
                        </div>
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

              {/* Campaigns Section */}
              {hasCampaigns && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Campanhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaignsForSelectedMonth.map((campaign, index) => {
                      const campaignData = monthlyData.campaignBreakdown.find(c => c.id === campaign.id);
                      
                      return (
                        <div 
                          key={campaign.id} 
                          className="border border-border/50 rounded-lg overflow-hidden"
                        >
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedCampaign(
                              expandedCampaign === campaign.id ? null : campaign.id
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-2 h-8 rounded-full"
                                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                />
                                <div>
                                  <p className="font-medium flex items-center gap-2">
                                    {campaign.platform && platformIcons[campaign.platform]}
                                    {campaign.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                      {campaign.status === 'active' ? 'Ativa' : campaign.status}
                                    </Badge>
                                    {campaignData && (
                                      <span>R$ {campaignData.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {expandedCampaign === campaign.id ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          {expandedCampaign === campaign.id && campaignData && (
                            <div className="border-t border-border/50 p-4 bg-muted/20 space-y-4">
                              {/* Primary KPIs */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Impressões</p>
                                  <p className="font-bold">{campaignData.impressions.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <MousePointer className="h-4 w-4 text-green-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Cliques</p>
                                  <p className="font-bold">{campaignData.clicks.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <Percent className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">CTR</p>
                                  <p className="font-bold">{campaignData.ctr.toFixed(2)}%</p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <DollarSign className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">CPC</p>
                                  <p className="font-bold">R$ {campaignData.cpc.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              {/* Secondary KPIs - Leads, CPL, Reach, Conversions */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <Users2 className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Leads / Conversas</p>
                                  <p className="font-bold">{campaignData.leads.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <MessageCircle className="h-4 w-4 text-teal-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">CPL / Custo por Conversa</p>
                                  <p className="font-bold">
                                    R$ {campaignData.leads > 0 ? (campaignData.spend / campaignData.leads).toFixed(2) : '0.00'}
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <BarChart3 className="h-4 w-4 text-cyan-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Alcance</p>
                                  <p className="font-bold">{campaignData.reach.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="p-3 bg-background rounded-lg text-center">
                                  <Target className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Conversões</p>
                                  <p className="font-bold">{campaignData.conversions.toLocaleString('pt-BR')}</p>
                                </div>
                              </div>

                              {/* Investment & ROI Row */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="p-3 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg text-center border border-green-500/20">
                                  <DollarSign className="h-4 w-4 text-green-500 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Investimento</p>
                                  <p className="font-bold text-green-500">R$ {campaignData.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                {campaignData.revenue > 0 && (
                                  <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg text-center border border-emerald-500/20">
                                    <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">Receita</p>
                                    <p className="font-bold text-emerald-500">R$ {campaignData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                )}
                                {campaignData.roas > 0 && (
                                  <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-lg text-center border border-yellow-500/20">
                                    <Zap className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground">ROAS</p>
                                    <p className="font-bold text-yellow-500">{campaignData.roas.toFixed(2)}x</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProjects?.map((project, index) => {
                const types = project.project_types || (project.project_type ? project.project_type.split(',') : []);
                
                return (
                  <Card key={project.id} className="border-border/50 overflow-hidden">
                    <div 
                      className="h-1.5"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge variant={
                          project.status === 'completed' ? 'default' : 
                          project.status === 'active' ? 'secondary' : 
                          'destructive'
                        }>
                          {project.status === 'completed' ? 'Concluído' : 
                           project.status === 'active' ? 'Ativo' : 
                           'Cancelado'}
                        </Badge>
                      </div>
                      {/* Project type badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {types.map((type: string, i: number) => {
                          const config = projectTypeConfig[type.trim()];
                          if (!config) return null;
                          const Icon = config.icon;
                          return (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                              {config.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Value and Payment Info */}
                      {project.total_value > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Valor do Projeto</span>
                            <span className="font-bold">
                              {project.currency === 'BRL' ? 'R$' : '$'} {Number(project.total_value).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {project.advance_payment && project.advance_percentage && (
                            <div className="flex justify-between items-center mt-2 text-xs">
                              <span className="text-muted-foreground">Entrada ({project.advance_percentage}%)</span>
                              <span className="text-green-500">
                                R$ {(Number(project.total_value) * Number(project.advance_percentage) / 100).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Creatives Count - only if has design */}
                      {((project.static_creatives || 0) + (project.carousel_creatives || 0) > 0) && (
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
                      )}

                      {/* Dates */}
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Criado em {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        {project.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Prazo: {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Deliverables Tab - Only visible if has design/creative work */}
          {(hasDesign || hasCreatives) && (
            <TabsContent value="deliverables" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-6 text-center">
                    <Image className="h-8 w-8 text-pink-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold">{lifetimeTotals.totalStatic}</p>
                    <p className="text-sm text-muted-foreground mt-1">Criativos Estáticos</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-6 text-center">
                    <Layers className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold">{lifetimeTotals.totalCarousel}</p>
                    <p className="text-sm text-muted-foreground mt-1">Carrosséis</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="text-3xl font-bold">{lifetimeTotals.totalStatic + lifetimeTotals.totalCarousel}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total de Peças</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold">{lifetimeTotals.completedProjects}</p>
                    <p className="text-sm text-muted-foreground mt-1">Projetos Finalizados</p>
                  </CardContent>
                </Card>
              </div>

              {/* Projects with Deliverables */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Entregas por Projeto</CardTitle>
                  <CardDescription>Detalhamento de criativos entregues em cada projeto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allProjects?.filter(p => (p.static_creatives || 0) + (p.carousel_creatives || 0) > 0).map((project, index) => {
                      const total = (project.static_creatives || 0) + (project.carousel_creatives || 0);
                      
                      return (
                        <div key={project.id} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="font-medium">{project.name}</span>
                              <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {project.status === 'completed' ? 'Concluído' : 'Ativo'}
                              </Badge>
                            </div>
                            <span className="font-bold">{total} peças</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Image className="h-3 w-3 text-pink-500" />
                              {project.static_creatives || 0} estáticos
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3 text-blue-500" />
                              {project.carousel_creatives || 0} carrosséis
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {!allProjects?.some(p => (p.static_creatives || 0) + (p.carousel_creatives || 0) > 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma entrega registrada ainda</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Content Fields from All Projects */}
              {allProjects?.some(p => p.project_fields?.length > 0) && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Conteúdos Entregues</CardTitle>
                    <CardDescription>Materiais e arquivos de todos os projetos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {allProjects?.flatMap(project => 
                        (project.project_fields || []).map((field: any, fieldIndex: number) => {
                          if (!field.content && (!field.attachments || field.attachments.length === 0)) return null;
                          
                          const fieldIcons: Record<string, any> = {
                            design: { icon: Palette, color: 'text-pink-500', label: 'Design' },
                            copy: { icon: FileText, color: 'text-blue-500', label: 'Copywriting' },
                            traffic: { icon: TrendingUp, color: 'text-green-500', label: 'Tráfego' },
                            social_media: { icon: MessageSquare, color: 'text-purple-500', label: 'Social Media' },
                          };
                          
                          const fieldInfo = fieldIcons[field.field_type] || { icon: FileIcon, color: 'text-muted-foreground', label: field.field_type };
                          const Icon = fieldInfo.icon;

                          return (
                            <div key={`${project.id}-${fieldIndex}`} className="p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`h-4 w-4 ${fieldInfo.color}`} />
                                <span className="text-sm font-medium">{fieldInfo.label}</span>
                                <span className="text-xs text-muted-foreground">• {project.name}</span>
                              </div>
                              {field.content && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{field.content}</p>
                              )}
                              {field.attachments && field.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.attachments.slice(0, 4).map((url: string, i: number) => {
                                    const ext = url.split('.').pop()?.toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
                                    
                                    return (
                                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                        {isImage ? (
                                          <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                                        ) : (
                                          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-lg border">
                                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                                          </div>
                                        )}
                                      </a>
                                    );
                                  })}
                                  {field.attachments.length > 4 && (
                                    <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-lg border">
                                      <span className="text-xs text-muted-foreground">+{field.attachments.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ).filter(Boolean)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Relatório gerado automaticamente • {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p className="mt-1">
            Desenvolvido por <span className="text-primary font-medium">Refine Cubo</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
