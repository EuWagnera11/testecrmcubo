import { useState, useMemo } from 'react';
import { Plus, Trash2, Phone, Mail, DollarSign, ArrowRight, Filter, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, PIPELINE_STAGES, PipelineItem } from '@/hooks/usePipeline';
import { useUsers } from '@/hooks/useUsers';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Pipeline() {
  const { items, isLoading, createItem, updateItem, deleteItem } = usePipeline();
  const { users } = useUsers();
  const [open, setOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStageConfig = (key: string) => PIPELINE_STAGES.find(s => s.key === key);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-1">Vendas</p>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h1>
        </div>
        <div className="flex gap-2">
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
            <div key={stage.key} className="min-w-[280px] flex-shrink-0">
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
                        {item.value > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(item.value)}
                          </Badge>
                        )}
                        {assignedUser && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {assignedUser.full_name}
                          </div>
                        )}
                        <div className="flex gap-1 pt-1">
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
                                onClick={() => moveToStage(item.id, 'won')}>
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
    </div>
  );
}
