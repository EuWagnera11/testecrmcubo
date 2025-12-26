import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts, CreateContractData } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400',
  sent: 'bg-yellow-500/20 text-yellow-400',
  signed: 'bg-green-500/20 text-green-400',
};

const statusLabels = { draft: 'Rascunho', sent: 'Enviado', signed: 'Assinado' };

export default function Contracts() {
  const { contracts, isLoading, createContract } = useContracts();
  const { clients } = useClients();
  const { projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateContractData = {
      title: formData.get('title') as string,
      client_id: formData.get('client_id') as string || undefined,
      project_id: formData.get('project_id') as string || undefined,
      terms: formData.get('terms') as string || undefined,
      signatories: [
        { name: formData.get('sig_name') as string, email: formData.get('sig_email') as string, role: 'contratante' as const },
      ],
    };
    await createContract.mutateAsync(data);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Proposta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Nova Proposta</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required placeholder="Título do contrato" />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select name="client_id">
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Signatário Principal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="sig_name" placeholder="Nome" required />
                  <Input name="sig_email" type="email" placeholder="Email" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Termos</Label>
                <Textarea id="terms" name="terms" placeholder="Termos principais do contrato..." rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={createContract.isPending}>
                {createContract.isPending ? 'Criando...' : 'Criar Contrato'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="draft">Rascunho</TabsTrigger>
          <TabsTrigger value="sent">Enviado</TabsTrigger>
          <TabsTrigger value="signed">Assinado</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum contrato encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contract) => (
            <Card key={contract.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{contract.title}</h3>
                  <Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{contract.clients?.name || 'Sem cliente'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
