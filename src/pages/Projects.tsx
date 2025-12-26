import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useProjects, CreateProjectData } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

const currencies = [
  { value: 'BRL', label: 'R$ (Real)' },
  { value: 'USD', label: '$ (Dólar)' },
  { value: 'EUR', label: '€ (Euro)' },
];

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-success/15 text-success border-success/30' },
  completed: { label: 'Concluído', className: 'bg-primary/15 text-primary border-primary/30' },
  paused: { label: 'Pausado', className: 'bg-warning/15 text-warning border-warning/30' },
};

export default function Projects() {
  const { projects, isLoading, createProject } = useProjects();
  const { clients } = useClients();
  const { isAdmin, isDirector } = useUserRole();
  const canSeeFinancials = isAdmin || isDirector;
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Gestão</p>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Novo Projeto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input id="name" name="name" required placeholder="Nome do projeto" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select name="client_id">
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select name="currency" defaultValue="BRL">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Total</Label>
                  <Input id="total_value" name="total_value" type="number" step="0.01" placeholder="0.00" className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo</Label>
                <Input id="deadline" name="deadline" type="date" className="h-11" />
              </div>
              <div className="flex items-center gap-3 py-2">
                <Checkbox id="advance_payment" name="advance_payment" />
                <Label htmlFor="advance_payment" className="text-sm font-normal cursor-pointer">
                  Pagamento adiantado
                </Label>
              </div>
              <Button type="submit" className="w-full h-11" disabled={createProject.isPending}>
                {createProject.isPending ? 'Criando...' : 'Criar Projeto'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar projetos..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-11 h-11" 
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search ? 'Tente buscar por outro termo.' : 'Crie seu primeiro projeto para começar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <Link 
              key={project.id} 
              to={`/projetos/${project.id}`}
              className="block"
            >
              <Card 
                className="card-hover border-border/50 cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <Badge variant="outline" className={statusConfig[project.status].className}>
                      {statusConfig[project.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{project.clients?.name || 'Sem cliente'}</p>
                  <div className="flex items-center justify-between">
                    {canSeeFinancials ? (
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(Number(project.total_value), project.currency)}
                      </p>
                    ) : (
                      <Badge variant="secondary">Ver detalhes</Badge>
                    )}
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
