import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, MousePointer, ShoppingCart, DollarSign, TrendingUp, 
  Heart, Users2, BarChart3, Plus, Calendar, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useProjectMetrics, ProjectMetric } from '@/hooks/useProjectMetrics';

const metricConfig: { type: ProjectMetric['metric_type']; label: string; icon: typeof Eye; isCurrency?: boolean }[] = [
  { type: 'impressions', label: 'Impressões', icon: Eye },
  { type: 'clicks', label: 'Cliques', icon: MousePointer },
  { type: 'conversions', label: 'Conversões', icon: ShoppingCart },
  { type: 'spend', label: 'Investimento', icon: DollarSign, isCurrency: true },
  { type: 'revenue', label: 'Receita', icon: TrendingUp, isCurrency: true },
  { type: 'engagement', label: 'Engajamento', icon: Heart },
  { type: 'followers', label: 'Seguidores', icon: Users2 },
  { type: 'reach', label: 'Alcance', icon: BarChart3 },
];

interface MetricsEditorProps {
  projectId: string;
  currency: string;
}

export function MetricsEditor({ projectId, currency }: MetricsEditorProps) {
  const { metrics, addMetric } = useProjectMetrics(projectId);
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProjectMetric['metric_type']>('impressions');
  const [value, setValue] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const fmtCurrency = (val: number) => formatCurrency(val, currency);

  const handleSave = async () => {
    if (!value) return;
    await addMetric.mutateAsync({
      metricType: selectedType,
      value: parseFloat(value),
      date: format(date, 'yyyy-MM-dd'),
    });
    setValue('');
    setOpen(false);
  };

  // Get latest value for each metric type
  const getLatestMetric = (type: string) => {
    return metrics.find(m => m.metric_type === type);
  };

  // Get history for a specific metric type
  const getMetricHistory = (type: string) => {
    return metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Métricas do Projeto</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Métrica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Métrica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo de Métrica</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ProjectMetric['metric_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metricConfig.map(({ type, label, icon: Icon }) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(date, "PPP", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={addMetric.isPending}>
                <Save className="h-4 w-4 mr-1" /> Salvar Métrica
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricConfig.map(({ type, label, icon: Icon, isCurrency }) => {
          const metric = getLatestMetric(type);
          const history = getMetricHistory(type);
          const hasHistory = history.length > 1;
          
          return (
            <Card key={type} className="border-border/50 group relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold">
                  {isCurrency 
                    ? fmtCurrency(Number(metric?.value || 0))
                    : (metric?.value || 0).toLocaleString('pt-BR')
                  }
                </p>
                {metric?.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(metric.date), "dd/MM/yyyy")}
                  </p>
                )}
                {hasHistory && (
                  <div className="mt-3 flex items-end gap-0.5 h-8">
                    {history.map((h, i) => (
                      <div
                        key={h.id}
                        className="bg-primary/30 rounded-sm flex-1 min-w-1"
                        style={{ 
                          height: `${Math.max(10, (Number(h.value) / Math.max(...history.map(x => Number(x.value)))) * 100)}%` 
                        }}
                        title={`${format(new Date(h.date), "dd/MM")}: ${h.value}`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
