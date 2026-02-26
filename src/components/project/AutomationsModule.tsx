import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, ExternalLink, GripVertical, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomationFlow {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  project_id: string | null;
  status: string;
  category: string;
  n8n_workflow_url: string | null;
  assigned_to: string | null;
  priority: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

const COLUMNS = [
  { status: 'backlog', label: 'Backlog', color: 'bg-muted' },
  { status: 'configuring', label: 'Configurando', color: 'bg-yellow-500/15' },
  { status: 'testing', label: 'Testando', color: 'bg-blue-500/15' },
  { status: 'active', label: 'Ativo', color: 'bg-green-500/15' },
  { status: 'paused', label: 'Pausado', color: 'bg-gray-500/15' },
];

const CATEGORIES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'crm', label: 'CRM' },
  { value: 'social', label: 'Social Media' },
  { value: 'other', label: 'Outro' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Média', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-red-600' },
];

interface AutomationsModuleProps {
  projectId: string;
}

export function AutomationsModule({ projectId }: AutomationsModuleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { users } = useUsers();
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'whatsapp', n8n_workflow_url: '', assigned_to: '', priority: 'medium' });

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ['automation-flows', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_flows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AutomationFlow[];
    },
    enabled: !!user && !!projectId,
  });

  const createFlow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('automation_flows').insert({
        name: form.name,
        description: form.description || null,
        project_id: projectId,
        category: form.category,
        n8n_workflow_url: form.n8n_workflow_url || null,
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-flows', projectId] });
      toast({ title: 'Automação criada!' });
      setNewOpen(false);
      setForm({ name: '', description: '', category: 'whatsapp', n8n_workflow_url: '', assigned_to: '', priority: 'medium' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('automation_flows').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-flows', projectId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" /> Automações do Projeto
        </h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nova Automação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Chatbot de Boas-vindas" className="mt-1" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do fluxo..." rows={2} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Responsável</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Atribuir a..." /></SelectTrigger>
                  <SelectContent>{users.filter(u => u.status === 'approved').map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Link n8n Workflow</Label><Input value={form.n8n_workflow_url} onChange={e => setForm(f => ({ ...f, n8n_workflow_url: e.target.value }))} placeholder="https://n8n.cubo.com/workflow/..." className="mt-1" /></div>
            </div>
            <DialogFooter><Button onClick={() => createFlow.mutate()} disabled={!form.name || createFlow.isPending}>{createFlow.isPending ? 'Criando...' : 'Criar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : flows.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma automação neste projeto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {COLUMNS.map(col => {
            const colFlows = flows.filter(f => f.status === col.status);
            return (
              <div key={col.status} className="min-w-0">
                <div className={`rounded-t-lg px-3 py-2 ${col.color} border border-b-0`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{col.label}</span>
                    <Badge variant="secondary" className="text-xs">{colFlows.length}</Badge>
                  </div>
                </div>
                <div className="border rounded-b-lg p-2 space-y-2 min-h-[120px] bg-card">
                  {colFlows.map(flow => (
                    <Card key={flow.id} className="border-border/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm leading-tight">{flow.name}</p>
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                        </div>
                        {flow.description && <p className="text-xs text-muted-foreground line-clamp-2">{flow.description}</p>}
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.value === flow.category)?.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${PRIORITIES.find(p => p.value === flow.priority)?.color}`}>
                            {PRIORITIES.find(p => p.value === flow.priority)?.label}
                          </Badge>
                        </div>
                        {flow.n8n_workflow_url && (
                          <a href={flow.n8n_workflow_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <ExternalLink className="h-3 w-3" />n8n
                          </a>
                        )}
                        <Select value={flow.status} onValueChange={v => updateStatus.mutate({ id: flow.id, status: v })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{COLUMNS.map(c => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
