import { useParams } from 'react-router-dom';
import { 
  Eye, MousePointer, ShoppingCart, DollarSign, TrendingUp, 
  Heart, Users2, BarChart3, Palette, FileText, MessageSquare
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

  const getMetricValue = (type: string) => {
    const metric = project.project_metrics?.find((m: any) => m.metric_type === type);
    return Number(metric?.value || 0);
  };

  const metrics = [
    { type: 'impressions', label: 'Impressões', icon: Eye, value: getMetricValue('impressions') },
    { type: 'clicks', label: 'Cliques', icon: MousePointer, value: getMetricValue('clicks') },
    { type: 'conversions', label: 'Conversões', icon: ShoppingCart, value: getMetricValue('conversions') },
    { type: 'spend', label: 'Investimento', icon: DollarSign, value: getMetricValue('spend'), isCurrency: true },
    { type: 'revenue', label: 'Receita', icon: TrendingUp, value: getMetricValue('revenue'), isCurrency: true },
    { type: 'engagement', label: 'Engajamento', icon: Heart, value: getMetricValue('engagement') },
    { type: 'followers', label: 'Seguidores', icon: Users2, value: getMetricValue('followers') },
    { type: 'reach', label: 'Alcance', icon: BarChart3, value: getMetricValue('reach') },
  ];

  const fields = project.project_fields || [];
  const designField = fields.find((f: any) => f.field_type === 'design');
  const copyField = fields.find((f: any) => f.field_type === 'copy');
  const trafficField = fields.find((f: any) => f.field_type === 'traffic');
  const socialField = fields.find((f: any) => f.field_type === 'social_media');

  // Mock chart data (in real app, this would come from metrics history)
  const chartData = [
    { name: 'Sem 1', impressions: 4000, clicks: 240 },
    { name: 'Sem 2', impressions: 5000, clicks: 350 },
    { name: 'Sem 3', impressions: 6200, clicks: 420 },
    { name: 'Sem 4', impressions: 8100, clicks: 580 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-primary font-medium italic">refine</span>
            <span className="font-bold text-xl tracking-tight">CUBO</span>
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
          {designField?.content && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-pink-500" />
                  <CardTitle className="text-base">Design</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{designField.content}</p>
              </CardContent>
            </Card>
          )}

          {copyField?.content && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Copywriting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{copyField.content}</p>
              </CardContent>
            </Card>
          )}

          {trafficField?.content && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Tráfego Pago</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{trafficField.content}</p>
              </CardContent>
            </Card>
          )}

          {socialField?.content && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">Social Media</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{socialField.content}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>Dashboard gerado por <span className="text-primary font-medium">Refine Cubo</span></p>
        </footer>
      </main>
    </div>
  );
}
