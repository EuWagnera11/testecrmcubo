import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  History, Calendar, TrendingUp, Users2, DollarSign, 
  Eye, MousePointer, Target, Percent, FileDown, ChevronRight,
  Loader2, Lock, CheckCircle2, Image, Layers, BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientClosures, useClosureDetails, ClientClosure } from '@/hooks/useClientClosures';

interface ClientMonthHistoryProps {
  clientId: string;
  clientName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

function ClosureCard({ closure, onClick }: { closure: ClientClosure; onClick: () => void }) {
  const periodDate = parseISO(`${closure.period_key}-01`);
  const monthName = format(periodDate, 'MMMM yyyy', { locale: ptBR });

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold capitalize">{monthName}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(closure.period_start), 'dd/MM')} - {format(parseISO(closure.period_end), 'dd/MM')}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Investimento</p>
          <p className="font-medium">{formatCurrency(Number(closure.total_spend))}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Leads</p>
          <p className="font-medium">{formatNumber(closure.total_leads)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">ROAS</p>
          <p className="font-medium">{Number(closure.total_roas).toFixed(2)}x</p>
        </div>
      </div>
    </button>
  );
}

function ClosureDetailsView({ closureId }: { closureId: string }) {
  const { data, isLoading } = useClosureDetails(closureId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Dados não encontrados.
      </div>
    );
  }

  const { closure, commissions } = data;
  const periodDate = parseISO(`${closure.period_key}-01`);
  const monthName = format(periodDate, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold capitalize">{monthName}</h3>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(closure.period_start), 'dd/MM/yyyy')} - {format(parseISO(closure.period_end), 'dd/MM/yyyy')}
          </p>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Fechado
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Investimento</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(Number(closure.total_spend))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Impressões</span>
              </div>
              <p className="text-lg font-bold">{formatNumber(Number(closure.total_impressions))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <MousePointer className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Cliques</span>
              </div>
              <p className="text-lg font-bold">{formatNumber(Number(closure.total_clicks))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users2 className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Leads</span>
              </div>
              <p className="text-lg font-bold">{formatNumber(closure.total_leads)}</p>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">CTR</span>
              </div>
              <p className="text-lg font-bold">{formatPercent(Number(closure.avg_ctr))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">CPC</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(Number(closure.avg_cpc))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">CPL</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(Number(closure.avg_cpl))}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">ROAS</span>
              </div>
              <p className="text-lg font-bold">{Number(closure.total_roas).toFixed(2)}x</p>
            </Card>
          </div>

          {/* Projects & Creatives */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Projetos</span>
              </div>
              <p className="text-lg font-bold">{closure.projects_count}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Campanhas</span>
              </div>
              <p className="text-lg font-bold">{closure.campaigns_count}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Image className="h-4 w-4 text-pink-500" />
                <span className="text-xs text-muted-foreground">Estáticos</span>
              </div>
              <p className="text-lg font-bold">{closure.total_static_creatives}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-muted-foreground">Carrosséis</span>
              </div>
              <p className="text-lg font-bold">{closure.total_carousel_creatives}</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <ScrollArea className="h-[300px]">
            {closure.snapshot_data?.campaigns?.length > 0 ? (
              <div className="space-y-3">
                {closure.snapshot_data.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{campaign.name}</p>
                      <Badge variant="outline">{campaign.platform}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Gasto</p>
                        <p className="font-medium">{formatCurrency(campaign.spend)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Cliques</p>
                        <p className="font-medium">{formatNumber(campaign.clicks)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">CTR</p>
                        <p className="font-medium">{formatPercent(campaign.ctr)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">ROAS</p>
                        <p className="font-medium">{campaign.roas.toFixed(2)}x</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma campanha registrada neste período.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <ScrollArea className="h-[300px]">
            {commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{commission.user_name}</p>
                        <p className="text-sm text-muted-foreground">{commission.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(Number(commission.amount))}</p>
                        {commission.percentage && (
                          <p className="text-xs text-muted-foreground">
                            {commission.percentage}% de {formatCurrency(Number(commission.base_value))}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={commission.paid ? 'default' : 'outline'}>
                        {commission.paid ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comissão calculada para este período.
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ClientMonthHistory({ clientId, clientName }: ClientMonthHistoryProps) {
  const [open, setOpen] = useState(false);
  const [selectedClosureId, setSelectedClosureId] = useState<string | null>(null);
  const { closures, isLoading } = useClientClosures(clientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Fechamentos
            {clientName && <span className="text-muted-foreground">- {clientName}</span>}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          {selectedClosureId ? (
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedClosureId(null)}
                className="mb-4"
              >
                ← Voltar para lista
              </Button>
              <ClosureDetailsView closureId={selectedClosureId} />
            </div>
          ) : (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : closures.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum mês fechado ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Os fechamentos aparecerão aqui quando forem realizados.
                  </p>
                </div>
              ) : (
                closures.map((closure) => (
                  <ClosureCard
                    key={closure.id}
                    closure={closure}
                    onClick={() => setSelectedClosureId(closure.id)}
                  />
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
