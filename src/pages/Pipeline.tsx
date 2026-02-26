import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Phone, Mail, DollarSign, ArrowRight, Filter, User, Download, Bell, CreditCard, QrCode, ExternalLink, Link2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, PIPELINE_STAGES, PipelineItem } from '@/hooks/usePipeline';
import { useWebhookLeads } from '@/hooks/useWebhookLeads';
import { useAsaas } from '@/hooks/useAsaas';
import { useUsers } from '@/hooks/useUsers';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function Pipeline() {
  const { items, isLoading, createItem, updateItem, deleteItem } = usePipeline();
  const { leads: webhookLeads, pendingCount, importLead, importAllLeads } = useWebhookLeads();
  const { listCustomers, createCustomer, createPayment, getPixQrCode, customers, loading: asaasLoading } = useAsaas();
  const { users } = useUsers();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [asaasDialog, setAsaasDialog] = useState<PipelineItem | null>(null);
  const [chargeForm, setChargeForm] = useState({ billingType: 'PIX', value: '', dueDate: '', description: '' });
  const [pixQr, setPixQr] = useState<{ encodedImage: string; payload: string } | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');

  const [form, setForm] = useState({
    title: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    stage: 'lead',
    value: '',
    notes: '',
    source: '',
    assigned_to: '',
  });

  const activeStages = PIPELINE_STAGES.filter(s => s.key !== 'won' && s.key !== 'lost');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchStage = filterStage === 'all' || item.stage === filterStage;
      const matchSearch = item.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStage && matchSearch;
    });
  }, [items, filterStage, searchTerm]);

  const stageGroups = useMemo(() => {
    const groups: Record<string, PipelineItem[]> = {};
    for (const stage of activeStages) {
      groups[stage.key] = filteredItems.filter(i => i.stage === stage.key);
    }
    return groups;
  }, [filteredItems, activeStages]);

  const totalValue = items.filter(i => i.stage !== 'lost').reduce((sum, i) => sum + (i.value || 0), 0);
  const wonValue = items.filter(i => i.stage === 'won').reduce((sum, i) => sum + (i.value || 0), 0);

  const handleCreate = () => {
    createItem.mutate({
      title: form.title,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      stage: form.stage,
      value: parseFloat(form.value) || 0,
      notes: form.notes || null,
      source: form.source || null,
      assigned_to: form.assigned_to || null,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: '', contact_name: '', contact_phone: '', contact_email: '', stage: 'lead', value: '', notes: '', source: '', assigned_to: '' });
      },
    });
  };

  const moveToStage = (id: string, newStage: string) => {
    const updates: Partial<PipelineItem> & { id: string } = { id, stage: newStage };
    if (newStage === 'won') updates.won_at = new Date().toISOString();
    if (newStage === 'lost') updates.lost_at = new Date().toISOString();
    updateItem.mutate(updates);
  };

  const openAsaasDialog = (item: PipelineItem) => {
    setAsaasDialog(item);
    setChargeForm({
      billingType: 'PIX',
      value: String(item.value || ''),
      dueDate: format(new Date(Date.now() + 3 * 86400000), 'yyyy-MM-dd'),
      description: `Cobrança - ${item.title}`,
    });
    setPixQr(null);
    if (item.contact_name) {
      listCustomers(item.contact_name);
    }
  };

  const handleLinkCustomer = async (customerId: string) => {
    if (!asaasDialog) return;
    updateItem.mutate({ id: asaasDialog.id, asaas_customer_id: customerId } as any);
    setAsaasDialog({ ...asaasDialog, asaas_customer_id: customerId });
    toast({ title: 'Cliente Asaas vinculado!' });
  };

  const handleCreateAsaasCustomer = async () => {
    if (!asaasDialog) return;
    const result = await createCustomer({
      name: asaasDialog.contact_name,
      cpfCnpj: '',
      email: asaasDialog.contact_email || undefined,
      phone: asaasDialog.contact_phone || undefined,
    });
    if (result) {
      handleLinkCustomer(result.id);
    }
  };

  const handleCreateCharge = async () => {
    if (!asaasDialog?.asaas_customer_id) {
      toast({ title: 'Vincule um cliente Asaas primeiro', variant: 'destructive' });
      return;
    }
    const result = await createPayment({
      customer: asaasDialog.asaas_customer_id,
      billingType: chargeForm.billingType,
      value: parseFloat(chargeForm.value) || 0,
      dueDate: chargeForm.dueDate,
      description: chargeForm.description,
    });
    if (result) {
      updateItem.mutate({
        id: asaasDialog.id,
        asaas_payment_id: result.id,
        asaas_payment_status: result.status,
        asaas_invoice_url: result.invoiceUrl || null,
      } as any);
      setAsaasDialog({
        ...asaasDialog,
        asaas_payment_id: result.id,
        asaas_payment_status: result.status,
        asaas_invoice_url: result.invoiceUrl || null,
      });
      toast({ title: 'Cobrança criada com sucesso!' });
    }
  };

  const handleGetPixQr = async () => {
    if (!asaasDialog?.asaas_payment_id) return;
    const result = await getPixQrCode(asaasDialog.asaas_payment_id);
    if (result) {
      setPixQr(result);
    }
  };

  const handleWonWithCharge = async (item: PipelineItem) => {
    moveToStage(item.id, 'won');
    if (!item.asaas_payment_id) {
      openAsaasDialog(item);
    }
  };

  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pendente', variant: 'outline' },
      RECEIVED: { label: 'Pago', variant: 'default' },
      CONFIRMED: { label: 'Confirmado', variant: 'default' },
      OVERDUE: { label: 'Vencido', variant: 'destructive' },
      REFUNDED: { label: 'Estornado', variant: 'secondary' },
      RECEIVED_IN_CASH: { label: 'Pago em dinheiro', variant: 'default' },
    };
    const config = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Vendas</p>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h1>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => importAllLeads.mutate(webhookLeads)}>
              <Download className="h-4 w-4 mr-1" />
              Importar {pendingCount} lead{pendingCount > 1 ? 's' : ''}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Clínica Sorriso" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contato</Label>
                    <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nome" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="email@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor estimado</Label>
                    <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Instagram, Indicação..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.status === 'approved').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name || 'Sem nome'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações..." rows={3} />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!form.title || !form.contact_name}>
                  Criar Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Webhook Leads Alert */}
      {pendingCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="h-5 w-5 text-primary" />
              <p className="font-medium">{pendingCount} novo{pendingCount > 1 ? 's' : ''} lead{pendingCount > 1 ? 's' : ''} via webhook</p>
            </div>
            <div className="space-y-2">
              {webhookLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between bg-background/50 rounded-lg p-2 text-sm">
                  <div>
                    <span className="font-medium">{lead.name}</span>
                    {lead.email && <span className="text-muted-foreground ml-2">{lead.email}</span>}
                    {lead.source && <Badge variant="outline" className="ml-2 text-xs">{lead.source}</Badge>}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => importLead.mutate(lead)}>
                    <ArrowRight className="h-3 w-3 mr-1" /> Importar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total no Funil</p>
            <p className="text-2xl font-bold mt-1">{items.filter(i => !['won', 'lost'].includes(i.stage)).length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor no Funil</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ganhos</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{items.filter(i => i.stage === 'won').length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Receita Ganha</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{formatCurrency(wonValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <Input placeholder="Buscar leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PIPELINE_STAGES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {activeStages.map(stage => (
            <div key={stage.key} className="min-w-[300px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={cn('h-2.5 w-2.5 rounded-full', stage.color)} />
                <span className="font-medium text-sm">{stage.label}</span>
                <Badge variant="secondary" className="text-xs h-5">
                  {stageGroups[stage.key]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {(stageGroups[stage.key] || []).map(item => {
                  const stageIdx = activeStages.findIndex(s => s.key === item.stage);
                  const nextStage = activeStages[stageIdx + 1];
                  const assignedUser = users.find(u => u.id === item.assigned_to);

                  return (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">{item.title}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1"
                            onClick={() => deleteItem.mutate(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.contact_name}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.value > 0 && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(item.value)}
                            </Badge>
                          )}
                          {item.asaas_payment_status && getPaymentStatusBadge(item.asaas_payment_status)}
                          {item.asaas_customer_id && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Asaas
                            </Badge>
                          )}
                        </div>
                        {assignedUser && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {assignedUser.full_name}
                          </div>
                        )}

                        {/* Asaas invoice link */}
                        {item.asaas_invoice_url && (
                          <a href={item.asaas_invoice_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Fatura
                          </a>
                        )}

                        <div className="flex flex-wrap gap-1 pt-1">
                          {/* Asaas button - available from proposal stage onwards */}
                          {['proposal', 'negotiation', 'won'].includes(item.stage) && (
                            <Button variant="outline" size="sm" className="text-xs h-7"
                              onClick={() => openAsaasDialog(item)}>
                              <CreditCard className="h-3 w-3 mr-1" />
                              {item.asaas_payment_id ? 'Pagamento' : 'Cobrar'}
                            </Button>
                          )}
                          {nextStage && (
                            <Button variant="outline" size="sm" className="text-xs h-7 flex-1"
                              onClick={() => moveToStage(item.id, nextStage.key)}>
                              <ArrowRight className="h-3 w-3 mr-1" />
                              {nextStage.label}
                            </Button>
                          )}
                          {stage.key === 'negotiation' && (
                            <>
                              <Button variant="default" size="sm" className="text-xs h-7"
                                onClick={() => handleWonWithCharge(item)}>
                                Ganho
                              </Button>
                              <Button variant="destructive" size="sm" className="text-xs h-7"
                                onClick={() => moveToStage(item.id, 'lost')}>
                                Perdido
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asaas Dialog */}
      <Dialog open={!!asaasDialog} onOpenChange={(o) => !o && setAsaasDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento - {asaasDialog?.title}
            </DialogTitle>
          </DialogHeader>

          {asaasDialog && (
            <div className="space-y-5 mt-2">
              {/* Step 1: Link Asaas Customer */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">1. Cliente Asaas</h4>
                {asaasDialog.asaas_customer_id ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Cliente vinculado: {asaasDialog.asaas_customer_id}
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Buscar cliente no Asaas..." value={searchCustomer}
                        onChange={e => setSearchCustomer(e.target.value)} className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => listCustomers(searchCustomer)}
                        disabled={asaasLoading}>
                        Buscar
                      </Button>
                    </div>
                    {customers.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                        {customers.map(c => (
                          <button key={c.id} onClick={() => handleLinkCustomer(c.id)}
                            className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground ml-2">{c.cpfCnpj}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="secondary" onClick={handleCreateAsaasCustomer}
                      disabled={asaasLoading}>
                      <Plus className="h-3 w-3 mr-1" /> Criar cliente "{asaasDialog.contact_name}" no Asaas
                    </Button>
                  </div>
                )}
              </div>

              {/* Step 2: Create Charge */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">2. Cobrança</h4>
                {asaasDialog.asaas_payment_id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(asaasDialog.asaas_payment_status)}
                      <span className="text-xs text-muted-foreground">ID: {asaasDialog.asaas_payment_id}</span>
                    </div>
                    {asaasDialog.asaas_invoice_url && (
                      <a href={asaasDialog.asaas_invoice_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="h-3 w-3" /> Link da Fatura
                        </Button>
                      </a>
                    )}
                    {asaasDialog.asaas_payment_status === 'PENDING' && (
                      <Button size="sm" variant="outline" onClick={handleGetPixQr} disabled={asaasLoading}>
                        <QrCode className="h-3 w-3 mr-1" /> Gerar QR Code PIX
                      </Button>
                    )}
                    {pixQr && (
                      <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                        <img src={`data:image/png;base64,${pixQr.encodedImage}`} alt="PIX QR Code" className="w-48 h-48" />
                        <Input value={pixQr.payload} readOnly className="text-xs" />
                        <Button size="sm" variant="outline"
                          onClick={() => { navigator.clipboard.writeText(pixQr.payload); toast({ title: 'Código PIX copiado!' }); }}>
                          Copiar código PIX
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <Select value={chargeForm.billingType}
                          onValueChange={v => setChargeForm(f => ({ ...f, billingType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="BOLETO">Boleto</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor (R$)</Label>
                        <Input type="number" value={chargeForm.value}
                          onChange={e => setChargeForm(f => ({ ...f, value: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vencimento</Label>
                      <Input type="date" value={chargeForm.dueDate}
                        onChange={e => setChargeForm(f => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input value={chargeForm.description}
                        onChange={e => setChargeForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <Button onClick={handleCreateCharge} className="w-full"
                      disabled={!asaasDialog.asaas_customer_id || !chargeForm.value || !chargeForm.dueDate || asaasLoading}>
                      <CreditCard className="h-4 w-4 mr-1" /> Criar Cobrança
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
