import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, MousePointer, ShoppingCart, DollarSign, TrendingUp, 
  Heart, Users2, BarChart3, Palette, FileText, MessageSquare,
  FileIcon, Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['public-project', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (name),
          project_fields (*),
          project_metrics (*)
        `)
        .eq('share_token', token!)
        .eq('share_enabled', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Dashboard não encontrado</h1>
            <p className="text-muted-foreground">
              Este link pode ter expirado ou o compartilhamento foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number, currency: string) => {
    const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(locales[currency] || 'pt-BR', { style: 'currency', currency }).format(value);
  };

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

  const metrics = [
    { type: 'impressions', label: 'Impressões', icon: Eye, value: getLatestMetricValue('impressions') },
    { type: 'clicks', label: 'Cliques', icon: MousePointer, value: getLatestMetricValue('clicks') },
    { type: 'conversions', label: 'Conversões', icon: ShoppingCart, value: getLatestMetricValue('conversions') },
    { type: 'spend', label: 'Investimento', icon: DollarSign, value: getLatestMetricValue('spend'), isCurrency: true },
    { type: 'revenue', label: 'Receita', icon: TrendingUp, value: getLatestMetricValue('revenue'), isCurrency: true },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-1">
            <span className="text-primary font-medium italic text-xl">refine</span>
            <span className="font-black text-2xl tracking-tighter">CUBO</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Project Info */}
        <div>
          <Badge variant="secondary" className="mb-2">Dashboard do Cliente</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1">
            {project.clients?.name} • {formatCurrency(Number(project.total_value), project.currency)}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ type, label, icon: Icon, value, isCurrency }) => (
            <Card key={type} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold">
                  {isCurrency 
                    ? formatCurrency(value, project.currency)
                    : value.toLocaleString('pt-BR')
                  }
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
