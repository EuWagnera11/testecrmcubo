import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, ArrowRight, ExternalLink, MoreVertical, Trash2, Power, CheckCircle, Image, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects, CreateProjectData } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

const currencies = [
  { value: 'BRL', label: 'R$ (Real)' },
  { value: 'USD', label: '$ (Dólar)' },
  { value: 'EUR', label: '€ (Euro)' },
];

const projectTypes = [
  { value: 'one_time', label: 'Pontual' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'campaign', label: 'Campanha' },
  { value: 'branding', label: 'Branding' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-success/15 text-success border-success/30' },
  completed: { label: 'Concluído', className: 'bg-primary/15 text-primary border-primary/30' },
  paused: { label: 'Pausado', className: 'bg-warning/15 text-warning border-warning/30' },
  inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
};

const projectTypeLabels: Record<string, string> = {
  one_time: 'Pontual',
  monthly: 'Mensal',
  campaign: 'Campanha',
  branding: 'Branding',
};

export default function Projects() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { clients } = useClients();
  const { isAdmin, isDirector } = useUserRole();
  const canSeeFinancials = isAdmin || isDirector;
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showDesignFields, setShowDesignFields] = useState(false);

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || p.status === filter;
    return matchSearch && matchStatus;
  });

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
      project_type: formData.get('project_type') as string || 'one_time',
      static_creatives: Number(formData.get('static_creatives')) || 0,
      carousel_creatives: Number(formData.get('carousel_creatives')) || 0,
    };
    await createProject.mutateAsync(data);
    setIsOpen(false);
    setShowDesignFields(false);
  };

  const handleToggleStatus = async (project: any) => {
    const newStatus = project.status === 'inactive' ? 'active' : 'inactive';
    await updateProject.mutateAsync({ id: project.id, status: newStatus });
  };

  const handleComplete = async (project: any) => {
    await updateProject.mutateAsync({ id: project.id, status: 'completed' });
  };

  const handleDelete = async (id: string) => {
    await deleteProject.mutateAsync(id);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1 font-body">Gestão</p>
          <h1 className="text-3xl font-display tracking-wide">Projetos</h1>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setShowDesignFields(false); }}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Novo Projeto</DialogTitle>
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
                    {clients.filter(c => c.status !== 'inactive').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Projeto</Label>
                <Select name="project_type" defaultValue="one_time">
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                  <Label htmlFor="total_value">Valor Total (Cliente)</Label>
                  <Input id="total_value" name="total_value" type="number" step="0.01" placeholder="0.00" className="h-11" />
                </div>
              </div>
              
              {/* Design Fields Toggle */}
              <div className="flex items-center gap-3 py-2">
                <Checkbox 
                  id="has_design" 
                  checked={showDesignFields}
                  onCheckedChange={(checked) => setShowDesignFields(!!checked)}
                />
                <Label htmlFor="has_design" className="text-sm font-normal cursor-pointer">
                  Projeto de Design (definir criativos)
                </Label>
              </div>
              
              {showDesignFields && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="space-y-2">
                    <Label htmlFor="static_creatives" className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-primary" />
                      Estáticos
                    </Label>
                    <Input 
                      id="static_creatives" 
                      name="static_creatives" 
                      type="number" 
                      min="0"
                      placeholder="0" 
                      className="h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carousel_creatives" className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Carrosséis
                    </Label>
                    <Input 
                      id="carousel_creatives" 
                      name="carousel_creatives" 
                      type="number" 
                      min="0"
                      placeholder="0" 
                      className="h-11" 
                    />
                  </div>
                </div>
              )}

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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar projetos..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-11 h-11" 
          />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-11">
            <TabsTrigger value="all" className="px-4">Todos</TabsTrigger>
            <TabsTrigger value="active" className="px-4">Ativos</TabsTrigger>
            <TabsTrigger value="completed" className="px-4">Concluídos</TabsTrigger>
            <TabsTrigger value="inactive" className="px-4">Inativos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-border/50 border-dashed glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1 font-body">
              {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
            </h3>
            <p className="text-muted-foreground text-sm font-body">
              {search ? 'Tente buscar por outro termo.' : 'Crie seu primeiro projeto para começar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <Card 
              key={project.id}
              className="card-hover border-border/50 glass-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/projetos/${project.id}`} className="flex-1">
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors font-body">{project.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusConfig[project.status]?.className}>
                      {statusConfig[project.status]?.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {project.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleComplete(project)}>
                            <CheckCircle className="h-4 w-4 mr-2 text-success" />
                            Concluir
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleToggleStatus(project)}>
                          <Power className="h-4 w-4 mr-2" />
                          {project.status === 'inactive' ? 'Ativar' : 'Desativar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover projeto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O projeto será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(project.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1 font-body">{project.clients?.name || 'Sem cliente'}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {projectTypeLabels[project.project_type] || project.project_type}
                  </Badge>
                  {(project.static_creatives || project.carousel_creatives) ? (
                    <Badge variant="outline" className="text-xs">
                      <Image className="h-3 w-3 mr-1" />
                      {project.static_creatives || 0} + {project.carousel_creatives || 0}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  {canSeeFinancials ? (
                    <p className="text-2xl font-display text-primary">
                      {formatCurrency(Number(project.total_value), project.currency)}
                    </p>
                  ) : (
                    <Badge variant="secondary">Ver detalhes</Badge>
                  )}
                  <Link to={`/projetos/${project.id}`}>
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
