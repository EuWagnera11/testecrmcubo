import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Target, Zap, Link2, Settings, FlaskConical, ClipboardList,
  Plus, Save, Trash2, ExternalLink, CheckCircle, XCircle, Clock,
  Lightbulb, TrendingUp, Users, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useProjectStrategy, 
  useProjectTechnicalSetup, 
  useProjectTests,
  useProjectOptimizationLog 
} from '@/hooks/useProjectModules';

interface TrafficModuleProps {
  projectId: string;
  project: {
    monthly_budget?: number;
    target_cpa?: number;
    target_roas?: number;
    target_cpl?: number;
    status?: string;
  };
  onUpdateProject?: (data: any) => void;
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Ativo', color: 'bg-success/15 text-success', icon: CheckCircle },
  paused: { label: 'Pausado', color: 'bg-warning/15 text-warning', icon: Clock },
  onboarding: { label: 'Onboarding', color: 'bg-blue-500/15 text-blue-500', icon: Settings },
  churn_risk: { label: 'Risco de Churn', color: 'bg-destructive/15 text-destructive', icon: AlertCircle },
};

const testStatusLabels: Record<string, { label: string; color: string }> = {
  running: { label: 'Em Teste', color: 'bg-blue-500/15 text-blue-500' },
  winner: { label: 'Vencedor', color: 'bg-success/15 text-success' },
  loser: { label: 'Perdedor', color: 'bg-destructive/15 text-destructive' },
  inconclusive: { label: 'Inconclusivo', color: 'bg-muted text-muted-foreground' },
};

export function TrafficModule({ projectId, project, onUpdateProject }: TrafficModuleProps) {
  const { strategy, upsertStrategy } = useProjectStrategy(projectId);
  const { technicalSetup, upsertTechnicalSetup } = useProjectTechnicalSetup(projectId);
  const { tests, createTest, updateTest, deleteTest } = useProjectTests(projectId);
  const { logs, createLog, deleteLog } = useProjectOptimizationLog(projectId);

  // Strategy form state
  const [strategyForm, setStrategyForm] = useState({
    offer_big_idea: strategy?.offer_big_idea || '',
    personas: strategy?.personas || '',
    funnel_structure: strategy?.funnel_structure || '',
    landing_page_url: strategy?.landing_page_url || '',
    landing_page_test_url: strategy?.landing_page_test_url || '',
  });

  // Technical setup form state
  const [techForm, setTechForm] = useState({
    meta_pixel_id: technicalSetup?.meta_pixel_id || '',
    tiktok_pixel_id: technicalSetup?.tiktok_pixel_id || '',
    ad_account_id: technicalSetup?.ad_account_id || '',
    capi_status: technicalSetup?.capi_status || 'inactive',
    utm_pattern: technicalSetup?.utm_pattern || '',
    ads_manager_link: technicalSetup?.ads_manager_link || '',
    drive_link: technicalSetup?.drive_link || '',
  });

  // New test form
  const [newTest, setNewTest] = useState({ hypothesis: '', variables: '' });
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // New log form
  const [newLog, setNewLog] = useState({ action_description: '', reason: '' });
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // KPIs form
  const [kpisForm, setKpisForm] = useState({
    monthly_budget: project.monthly_budget || 0,
    target_cpa: project.target_cpa || 0,
    target_roas: project.target_roas || 0,
    target_cpl: project.target_cpl || 0,
  });

  const handleSaveStrategy = () => {
    upsertStrategy.mutate(strategyForm);
  };

  const handleSaveTechSetup = () => {
    upsertTechnicalSetup.mutate(techForm);
  };

  const handleSaveKPIs = () => {
    if (onUpdateProject) {
      onUpdateProject(kpisForm);
    }
  };

  const handleAddTest = () => {
    if (!newTest.hypothesis.trim()) return;
    createTest.mutate(newTest);
    setNewTest({ hypothesis: '', variables: '' });
    setTestDialogOpen(false);
  };

  const handleAddLog = () => {
    if (!newLog.action_description.trim()) return;
    createLog.mutate(newLog);
    setNewLog({ action_description: '', reason: '' });
    setLogDialogOpen(false);
  };

  // Update form when data loads
  useState(() => {
    if (strategy) {
      setStrategyForm({
        offer_big_idea: strategy.offer_big_idea || '',
        personas: strategy.personas || '',
        funnel_structure: strategy.funnel_structure || '',
        landing_page_url: strategy.landing_page_url || '',
        landing_page_test_url: strategy.landing_page_test_url || '',
      });
    }
  });

  useState(() => {
    if (technicalSetup) {
      setTechForm({
        meta_pixel_id: technicalSetup.meta_pixel_id || '',
        tiktok_pixel_id: technicalSetup.tiktok_pixel_id || '',
        ad_account_id: technicalSetup.ad_account_id || '',
        capi_status: technicalSetup.capi_status || 'inactive',
        utm_pattern: technicalSetup.utm_pattern || '',
        ads_manager_link: technicalSetup.ads_manager_link || '',
        drive_link: technicalSetup.drive_link || '',
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Resumo Executivo</CardTitle>
                <CardDescription>Visão rápida do projeto de tráfego</CardDescription>
              </div>
            </div>
            <Badge className={statusLabels[project.status || 'active']?.color || 'bg-muted'}>
              {statusLabels[project.status || 'active']?.label || project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Orçamento Mensal</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={kpisForm.monthly_budget}
                  onChange={(e) => setKpisForm(prev => ({ ...prev, monthly_budget: Number(e.target.value) }))}
                  className="h-9"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">CPA Meta</Label>
              <Input
                type="number"
                value={kpisForm.target_cpa}
                onChange={(e) => setKpisForm(prev => ({ ...prev, target_cpa: Number(e.target.value) }))}
                className="h-9"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ROAS Mínimo</Label>
              <Input
                type="number"
                step="0.1"
                value={kpisForm.target_roas}
                onChange={(e) => setKpisForm(prev => ({ ...prev, target_roas: Number(e.target.value) }))}
                className="h-9"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">CPL Meta</Label>
              <Input
                type="number"
                value={kpisForm.target_cpl}
                onChange={(e) => setKpisForm(prev => ({ ...prev, target_cpl: Number(e.target.value) }))}
                className="h-9"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {technicalSetup?.ads_manager_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={technicalSetup.ads_manager_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Ads Manager
                </a>
              </Button>
            )}
            {technicalSetup?.drive_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={technicalSetup.drive_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Drive
                </a>
              </Button>
            )}
            <Button size="sm" onClick={handleSaveKPIs} disabled={!onUpdateProject}>
              <Save className="h-4 w-4 mr-1" /> Salvar KPIs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategy" className="gap-2">
            <Target className="h-4 w-4" /> Estratégia
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-2">
            <Settings className="h-4 w-4" /> Setup Técnico
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <FlaskConical className="h-4 w-4" /> Lab de Testes
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Otimizações
          </TabsTrigger>
        </TabsList>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  A Oferta (Big Idea)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={strategyForm.offer_big_idea}
                  onChange={(e) => setStrategyForm(prev => ({ ...prev, offer_big_idea: e.target.value }))}
                  placeholder="Resuma a promessa única em uma frase..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Personas / Avatars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={strategyForm.personas}
                  onChange={(e) => setStrategyForm(prev => ({ ...prev, personas: e.target.value }))}
                  placeholder="Ex: Mães de primeira viagem, 25-35 anos. Dores: Falta de tempo..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Estrutura do Funil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={strategyForm.funnel_structure}
                onChange={(e) => setStrategyForm(prev => ({ ...prev, funnel_structure: e.target.value }))}
                placeholder="Ex: Anúncio → Landing Page → VSL → Checkout → Obrigado"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Landing Page Final</Label>
                  <div className="flex gap-2">
                    <Input
                      value={strategyForm.landing_page_url}
                      onChange={(e) => setStrategyForm(prev => ({ ...prev, landing_page_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {strategyForm.landing_page_url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={strategyForm.landing_page_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Landing Page Teste</Label>
                  <div className="flex gap-2">
                    <Input
                      value={strategyForm.landing_page_test_url}
                      onChange={(e) => setStrategyForm(prev => ({ ...prev, landing_page_test_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {strategyForm.landing_page_test_url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={strategyForm.landing_page_test_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveStrategy} disabled={upsertStrategy.isPending}>
            <Save className="h-4 w-4 mr-2" /> Salvar Estratégia
          </Button>
        </TabsContent>

        {/* Technical Setup Tab */}
        <TabsContent value="technical" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rastreamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Meta Pixel ID</Label>
                  <Input
                    value={techForm.meta_pixel_id}
                    onChange={(e) => setTechForm(prev => ({ ...prev, meta_pixel_id: e.target.value }))}
                    placeholder="Ex: 123456789012345"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">TikTok Pixel ID</Label>
                  <Input
                    value={techForm.tiktok_pixel_id}
                    onChange={(e) => setTechForm(prev => ({ ...prev, tiktok_pixel_id: e.target.value }))}
                    placeholder="Ex: C1234567890"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ID da Conta de Anúncios</Label>
                  <Input
                    value={techForm.ad_account_id}
                    onChange={(e) => setTechForm(prev => ({ ...prev, ad_account_id: e.target.value }))}
                    placeholder="Ex: act_123456789"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status CAPI</Label>
                  <Select
                    value={techForm.capi_status}
                    onValueChange={(v) => setTechForm(prev => ({ ...prev, capi_status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="partial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Links & UTMs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Padrão de UTMs</Label>
                  <Textarea
                    value={techForm.utm_pattern}
                    onChange={(e) => setTechForm(prev => ({ ...prev, utm_pattern: e.target.value }))}
                    placeholder="?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link do Ads Manager</Label>
                  <Input
                    value={techForm.ads_manager_link}
                    onChange={(e) => setTechForm(prev => ({ ...prev, ads_manager_link: e.target.value }))}
                    placeholder="https://business.facebook.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link do Drive</Label>
                  <Input
                    value={techForm.drive_link}
                    onChange={(e) => setTechForm(prev => ({ ...prev, drive_link: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSaveTechSetup} disabled={upsertTechnicalSetup.isPending}>
            <Save className="h-4 w-4 mr-2" /> Salvar Setup Técnico
          </Button>
        </TabsContent>

        {/* Tests Lab Tab */}
        <TabsContent value="tests" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Laboratório de Testes</h3>
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Novo Teste
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Teste A/B</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Hipótese</Label>
                    <Textarea
                      value={newTest.hypothesis}
                      onChange={(e) => setNewTest(prev => ({ ...prev, hypothesis: e.target.value }))}
                      placeholder="Ex: Testar se o fundo preto converte mais que o branco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Variáveis (o que está sendo mudado)</Label>
                    <Input
                      value={newTest.variables}
                      onChange={(e) => setNewTest(prev => ({ ...prev, variables: e.target.value }))}
                      placeholder="Ex: Cor de fundo, Headline"
                    />
                  </div>
                  <Button onClick={handleAddTest} className="w-full">
                    Adicionar Teste
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FlaskConical className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum teste registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tests.map(test => (
                <Card key={test.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={testStatusLabels[test.status]?.color || 'bg-muted'}>
                            {testStatusLabels[test.status]?.label || test.status}
                          </Badge>
                          {test.variables && (
                            <span className="text-xs text-muted-foreground">
                              Variáveis: {test.variables}
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{test.hypothesis}</p>
                        {test.result && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Resultado:</strong> {test.result}
                          </p>
                        )}
                        {test.learnings && (
                          <p className="text-sm text-primary mt-1">
                            <strong>Aprendizado:</strong> {test.learnings}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Select
                          value={test.status}
                          onValueChange={(v) => updateTest.mutate({ id: test.id, status: v })}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="running">Em Teste</SelectItem>
                            <SelectItem value="winner">Vencedor</SelectItem>
                            <SelectItem value="loser">Perdedor</SelectItem>
                            <SelectItem value="inconclusive">Inconclusivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteTest.mutate(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Optimization Log Tab */}
        <TabsContent value="log" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Log de Otimizações</h3>
            <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Otimização</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>O que foi feito</Label>
                    <Textarea
                      value={newLog.action_description}
                      onChange={(e) => setNewLog(prev => ({ ...prev, action_description: e.target.value }))}
                      placeholder="Ex: Pausei anúncio X"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Por que foi feito</Label>
                    <Textarea
                      value={newLog.reason}
                      onChange={(e) => setNewLog(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Ex: CPA subiu para R$50,00 (acima da meta)"
                    />
                  </div>
                  <Button onClick={handleAddLog} className="w-full">
                    Registrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {logs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Nenhuma otimização registrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <Card key={log.id}>
                  <CardContent className="p-3 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(log.action_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{log.action_description}</p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-destructive h-8 w-8"
                      onClick={() => deleteLog.mutate(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
