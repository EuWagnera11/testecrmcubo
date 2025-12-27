import { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { PDFExport } from '@/components/PDFExport';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, MousePointer, ShoppingCart, TrendingUp, 
  Heart, Users2, BarChart3, Palette, FileText, MessageSquare,
  FileIcon, AlertCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
    // Silently fail - don't block user experience for logging
    console.error('Failed to log dashboard access:', error);
  }
};

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  
  // Check if token is valid UUID
  const isTokenValid = token && isValidUUID(token);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['public-project', token],
    queryFn: async () => {
      if (!token) throw new Error('Token não fornecido');
      
      // Only fetch necessary data - exclude sensitive financial details
      // Only fetch client name (not email/phone)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          currency,
          status,
          share_token,
          clients (name),
          project_fields (field_type, content, attachments, link_url),
          project_metrics (metric_type, value, date)
        `)
        .eq('share_token', token)
        .eq('share_enabled', true)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erro ao carregar dashboard: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Dashboard não encontrado ou compartilhamento desativado');
      }
      
      return data;
    },
    enabled: isTokenValid,
    retry: 1,
    staleTime: 30000,
  });

  // Log access when dashboard is loaded successfully
  useEffect(() => {
    if (project && token) {
      logDashboardAccess(project.id, token);
    }
  }, [project, token]);

  // Invalid token format
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

  // Loading state with text
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state with details
  if (error || !project) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Dashboard não encontrado</h1>
            <p className="text-muted-foreground">
              Este link pode ter expirado ou o compartilhamento foi desativado.
            </p>
            {import.meta.env.DEV && (
              <div className="bg-muted p-3 rounded-lg text-left">
                <p className="text-xs font-mono text-destructive break-all">
                  {errorMessage}
                </p>
              </div>
            )}
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group metrics by type and get latest value
  const getLatestMetricValue = (type: string) => {
    const typeMetrics = project.project_metrics?.filter((m: any) => m.metric_type === type) || [];
    if (typeMetrics.length === 0) return 0;
    const sorted = typeMetrics.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Number(sorted[0]?.value || 0);
  };

  // Build chart data from real metrics history
  const buildChartData = () => {
    const metricsData = project.project_metrics || [];
    const dateMap = new Map<string, any>();
    
    metricsData.forEach((m: any) => {
      const dateKey = m.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, name: format(new Date(dateKey), 'dd/MM', { locale: ptBR }) });
      }
      dateMap.get(dateKey)[m.metric_type] = Number(m.value);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  };

  const chartData = buildChartData();

  // Only show non-sensitive performance metrics (no financial data like spend/revenue)
  const metrics = [
    { type: 'impressions', label: 'Impressões', icon: Eye, value: getLatestMetricValue('impressions') },
    { type: 'clicks', label: 'Cliques', icon: MousePointer, value: getLatestMetricValue('clicks') },
    { type: 'conversions', label: 'Conversões', icon: ShoppingCart, value: getLatestMetricValue('conversions') },
    { type: 'engagement', label: 'Engajamento', icon: Heart, value: getLatestMetricValue('engagement') },
    { type: 'followers', label: 'Seguidores', icon: Users2, value: getLatestMetricValue('followers') },
    { type: 'reach', label: 'Alcance', icon: BarChart3, value: getLatestMetricValue('reach') },
  ];

  const fields = project.project_fields || [];
  const designField = fields.find((f: any) => f.field_type === 'design');
  const copyField = fields.find((f: any) => f.field_type === 'copy');
  const trafficField = fields.find((f: any) => f.field_type === 'traffic');
  const socialField = fields.find((f: any) => f.field_type === 'social_media');

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-primary font-medium italic text-xl">refine</span>
            <span className="font-black text-2xl tracking-tighter">CUBO</span>
          </div>
          <PDFExport contentRef={contentRef} fileName={`relatorio-${project.name}`} />
        </div>
      </header>

      <main ref={contentRef} className="container mx-auto px-4 py-8 space-y-8">
        {/* Project Info */}
        <div>
          <Badge variant="secondary" className="mb-2">Dashboard do Cliente</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1">
            {project.clients?.name}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map(({ type, label, icon: Icon, value }) => (
            <Card key={type} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold">
                  {value.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Performance Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorImpressions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Cliques por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Content Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { field: designField, icon: Palette, color: 'text-pink-500', label: 'Design' },
            { field: copyField, icon: FileText, color: 'text-blue-500', label: 'Copywriting' },
            { field: trafficField, icon: TrendingUp, color: 'text-green-500', label: 'Tráfego Pago' },
            { field: socialField, icon: MessageSquare, color: 'text-purple-500', label: 'Social Media' },
          ].map(({ field, icon: Icon, color, label }) => {
            if (!field?.content && (!field?.attachments || field.attachments.length === 0)) return null;
            return (
              <Card key={label} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <CardTitle className="text-base">{label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {field.content && (
                    <p className="text-muted-foreground whitespace-pre-wrap">{field.content}</p>
                  )}
                  {field.attachments && field.attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {field.attachments.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          {isImage(url) ? (
                            <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                          ) : (
                            <div className="flex items-center justify-center h-20 bg-muted rounded-lg border">
                              <FileIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>Dashboard gerado por <span className="text-primary font-medium">Refine Cubo</span></p>
        </footer>
      </main>
    </div>
  );
}
