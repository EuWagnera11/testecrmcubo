import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Target, DollarSign, MousePointer, Eye, Users, BarChart3, Calendar, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampaigns, useCampaignMetrics, Campaign, CampaignMetric } from '@/hooks/useCampaigns';
import { CampaignCharts } from './CampaignCharts';
import { FacebookMetricsImport } from './FacebookMetricsImport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignMetricsManagerProps {
  projectId: string;
  currency: string;
}

const platformIcons: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  google: '🔍',
  tiktok: '🎵',
  linkedin: '💼',
};

const objectiveLabels: Record<string, string> = {
  conversions: 'Conversões',
  leads: 'Leads',
  traffic: 'Tráfego',
  awareness: 'Reconhecimento',
  engagement: 'Engajamento',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-500',
  paused: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-blue-500/20 text-blue-500',
};

export function CampaignMetricsManager({ projectId, currency }: CampaignMetricsManagerProps) {
  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns(projectId);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: '',
    objective: '',
    start_date: '',
    end_date: '',
    budget: 0,
  });

  const handleCreateCampaign = async () => {
    await createCampaign.mutateAsync({
      project_id: projectId,
      name: newCampaign.name,
      platform: newCampaign.platform || null,
      objective: newCampaign.objective || null,
      start_date: newCampaign.start_date || null,
      end_date: newCampaign.end_date || null,
      budget: newCampaign.budget,
      status: 'active',
    });
    setIsNewCampaignOpen(false);
    setNewCampaign({ name: '', platform: '', objective: '', start_date: '', end_date: '', budget: 0 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
          </TabsList>

          <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Campanha</Label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Ex: Black Friday 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plataforma</Label>
                    <Select
                      value={newCampaign.platform}
                      onValueChange={(v) => setNewCampaign({ ...newCampaign, platform: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Objetivo</Label>
                    <Select
                      value={newCampaign.objective}
                      onValueChange={(v) => setNewCampaign({ ...newCampaign, objective: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversions">Conversões</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="traffic">Tráfego</SelectItem>
                        <SelectItem value="awareness">Reconhecimento</SelectItem>
                        <SelectItem value="engagement">Engajamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={newCampaign.start_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={newCampaign.end_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Orçamento</Label>
                  <Input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <Button onClick={handleCreateCampaign} disabled={!newCampaign.name} className="w-full">
                  Criar Campanha
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma campanha criada ainda.<br />
                  Crie sua primeira campanha para começar a registrar métricas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  currency={currency}
                  onSelect={() => {
                    setSelectedCampaign(campaign);
                    setIsMetricsOpen(true);
                  }}
                  onDelete={() => deleteCampaign.mutate(campaign.id)}
                  onStatusChange={(status) => updateCampaign.mutate({ id: campaign.id, status })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <CampaignCharts projectId={projectId} currency={currency} />
        </TabsContent>
      </Tabs>

      <MetricsDialog
        campaign={selectedCampaign}
        currency={currency}
        open={isMetricsOpen && !!selectedCampaign}
        onOpenChange={(open) => {
          setIsMetricsOpen(open);
          if (!open) setSelectedCampaign(null);
        }}
      />
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  currency: string;
  onSelect: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}

function CampaignCard({ campaign, currency, onSelect, onDelete, onStatusChange }: CampaignCardProps) {
  const { metrics } = useCampaignMetrics(campaign.id);

  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      clicks: acc.clicks + (m.clicks || 0),
      spend: acc.spend + (m.spend || 0),
      conversions: acc.conversions + (m.conversions || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {campaign.platform && (
              <span className="text-xl">{platformIcons[campaign.platform] || '📊'}</span>
            )}
            <div>
              <CardTitle className="text-base">{campaign.name}</CardTitle>
              {campaign.objective && (
                <p className="text-xs text-muted-foreground">
                  {objectiveLabels[campaign.objective] || campaign.objective}
                </p>
              )}
            </div>
          </div>
          <Badge className={statusColors[campaign.status] || 'bg-muted'}>
            {campaign.status === 'active' ? 'Ativa' : 
             campaign.status === 'paused' ? 'Pausada' : 'Concluída'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Impressões:</span>
            <span className="font-medium">{totals.impressions.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Cliques:</span>
            <span className="font-medium">{totals.clicks.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">CTR:</span>
            <span className="font-medium">{avgCtr.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Gasto:</span>
            <span className="font-medium">{formatCurrency(totals.spend)}</span>
          </div>
        </div>

        {campaign.start_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })}
              {campaign.end_date && ` - ${format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSelect}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Métricas
          </Button>
          <Select value={campaign.status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsDialogProps {
  campaign: Campaign | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetricsDialog({ campaign, currency, open, onOpenChange }: MetricsDialogProps) {
  const campaignId = campaign?.id || '';
  const { metrics, addMetric, deleteMetric } = useCampaignMetrics(campaignId || undefined);
  const [newMetric, setNewMetric] = useState<Partial<CampaignMetric>>({
    date: new Date().toISOString().split('T')[0],
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    spend: 0,
    conversions: 0,
    cost_per_conversion: 0,
    leads: 0,
    cost_per_lead: 0,
    roas: 0,
    revenue: 0,
  });

  const handleSave = async () => {
    // Auto-calculate CTR if not provided
    let ctr = newMetric.ctr || 0;
    if (!ctr && newMetric.impressions && newMetric.clicks) {
      ctr = (newMetric.clicks / newMetric.impressions) * 100;
    }

    // Auto-calculate CPC if not provided
    let cpc = newMetric.cpc || 0;
    if (!cpc && newMetric.spend && newMetric.clicks) {
      cpc = newMetric.spend / newMetric.clicks;
    }

    // Auto-calculate CPM if not provided
    let cpm = newMetric.cpm || 0;
    if (!cpm && newMetric.spend && newMetric.impressions) {
      cpm = (newMetric.spend / newMetric.impressions) * 1000;
    }

    // Auto-calculate cost per conversion
    let cost_per_conversion = newMetric.cost_per_conversion || 0;
    if (!cost_per_conversion && newMetric.spend && newMetric.conversions) {
      cost_per_conversion = newMetric.spend / newMetric.conversions;
    }

    // Auto-calculate cost per lead
    let cost_per_lead = newMetric.cost_per_lead || 0;
    if (!cost_per_lead && newMetric.spend && newMetric.leads) {
      cost_per_lead = newMetric.spend / newMetric.leads;
    }

    // Auto-calculate ROAS
    let roas = newMetric.roas || 0;
    if (!roas && newMetric.revenue && newMetric.spend) {
      roas = newMetric.revenue / newMetric.spend;
    }
    if (!campaign) return;
    await addMetric.mutateAsync({
      campaign_id: campaign.id,
      date: newMetric.date!,
      impressions: newMetric.impressions || 0,
      reach: newMetric.reach || 0,
      clicks: newMetric.clicks || 0,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      spend: newMetric.spend || 0,
      conversions: newMetric.conversions || 0,
      cost_per_conversion: Math.round(cost_per_conversion * 100) / 100,
      leads: newMetric.leads || 0,
      cost_per_lead: Math.round(cost_per_lead * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      revenue: newMetric.revenue || 0,
    });

    // Reset form with today's date
    setNewMetric({
      date: new Date().toISOString().split('T')[0],
      impressions: 0,
      reach: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      spend: 0,
      conversions: 0,
      cost_per_conversion: 0,
      leads: 0,
      cost_per_lead: 0,
      roas: 0,
      revenue: 0,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign?.platform && platformIcons[campaign.platform]}
            {campaign?.name} - Métricas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Metric Form */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Adicionar Métricas</CardTitle>
              {campaign && (
                <FacebookMetricsImport 
                  campaignId={campaign.id} 
                  onImportComplete={() => {}} 
                />
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newMetric.date}
                    onChange={(e) => setNewMetric({ ...newMetric, date: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Impressões</Label>
                    <Input
                      type="number"
                      value={newMetric.impressions || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, impressions: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alcance</Label>
                    <Input
                      type="number"
                      value={newMetric.reach || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, reach: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cliques</Label>
                    <Input
                      type="number"
                      value={newMetric.clicks || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, clicks: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Valor Gasto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMetric.spend || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, spend: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Conversões</Label>
                    <Input
                      type="number"
                      value={newMetric.conversions || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, conversions: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Leads</Label>
                    <Input
                      type="number"
                      value={newMetric.leads || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, leads: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Receita</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMetric.revenue || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, revenue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSave} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  CTR, CPC, CPM, Custo por Conversão, Custo por Lead e ROAS são calculados automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metrics History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Histórico de Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma métrica registrada ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1">Data</th>
                        <th className="text-right py-2 px-1">Impr.</th>
                        <th className="text-right py-2 px-1">Cliques</th>
                        <th className="text-right py-2 px-1">CTR</th>
                        <th className="text-right py-2 px-1">Gasto</th>
                        <th className="text-right py-2 px-1">CPC</th>
                        <th className="text-right py-2 px-1">Conv.</th>
                        <th className="text-right py-2 px-1">Leads</th>
                        <th className="text-right py-2 px-1">ROAS</th>
                        <th className="py-2 px-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-1">{format(new Date(m.date), "dd/MM", { locale: ptBR })}</td>
                          <td className="text-right py-2 px-1">{m.impressions.toLocaleString('pt-BR')}</td>
                          <td className="text-right py-2 px-1">{m.clicks.toLocaleString('pt-BR')}</td>
                          <td className="text-right py-2 px-1">{m.ctr}%</td>
                          <td className="text-right py-2 px-1">{formatCurrency(m.spend)}</td>
                          <td className="text-right py-2 px-1">{formatCurrency(m.cpc)}</td>
                          <td className="text-right py-2 px-1">{m.conversions}</td>
                          <td className="text-right py-2 px-1">{m.leads}</td>
                          <td className="text-right py-2 px-1">{m.roas}x</td>
                          <td className="py-2 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => deleteMetric.mutate(m.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
