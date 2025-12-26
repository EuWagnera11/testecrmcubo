import { useState } from 'react';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useProjects, CreateProjectData } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';

const currencies = [
  { value: 'BRL', label: 'R$ (Real)' },
  { value: 'USD', label: '$ (Dólar)' },
  { value: 'EUR', label: '€ (Euro)' },
];

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
};

export default function Projects() {
  const { projects, isLoading, createProject } = useProjects();
  const { clients } = useClients();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const formatCurrency = (value: number, currency: string) => {
    const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(locales[currency] || 'pt-BR', { style: 'currency', currency }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateProjectData = {
      name: formData.get('name') as string,
      client_id: formData.get('client_id') as string || undefined,
      currency: formData.get('currency') as string || 'BRL',
      total_value: Number(formData.get('total_value')) || 0,
      deadline: formData.get('deadline') as string || undefined,
      advance_payment: formData.get('advance_payment') === 'on',
    };
    await createProject.mutateAsync(data);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input id="name" name="name" required placeholder="Nome do projeto" />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select name="client_id">
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select name="currency" defaultValue="BRL">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Total</Label>
                  <Input id="total_value" name="total_value" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo</Label>
                <Input id="deadline" name="deadline" type="date" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="advance_payment" name="advance_payment" />
                <Label htmlFor="advance_payment" className="text-sm">Pagamento adiantado</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{search ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{project.name}</h3>
                  <Badge className={statusColors[project.status]}>{project.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{project.clients?.name || 'Sem cliente'}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(project.total_value), project.currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
