import { useState } from 'react';
import { Plus, Search, Users, Mail, Phone, Building, ArrowRight, Trash2, Power, MoreVertical, Pencil, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useClients, CreateClientData, Client } from '@/hooks/useClients';
import { useUserRole } from '@/hooks/useUserRole';
import { ClientFilesSection } from '@/components/ClientFilesSection';

const currencies = [
  { value: 'BRL', label: 'R$ (Real)' },
  { value: 'USD', label: '$ (Dólar)' },
  { value: 'EUR', label: '€ (Euro)' },
];

export default function Clients() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const { canManageClients } = useUserRole();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState('all');
  const [showPlanFields, setShowPlanFields] = useState(false);
  const [editShowPlanFields, setEditShowPlanFields] = useState(false);

  const formatCurrency = (value: number, currency: string) => {
    const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(locales[currency] || 'pt-BR', { style: 'currency', currency }).format(value);
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || c.status === filter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hasPlan = formData.get('has_plan') === 'on';
    const data: CreateClientData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      company: formData.get('company') as string || undefined,
      monthly_plan_value: hasPlan ? Number(formData.get('monthly_plan_value')) || undefined : undefined,
      plan_currency: hasPlan ? (formData.get('plan_currency') as string) || 'BRL' : undefined,
      plan_start_date: hasPlan ? (formData.get('plan_start_date') as string) || undefined : undefined,
      plan_billing_day: hasPlan ? Number(formData.get('plan_billing_day')) || 1 : undefined,
    };
    await createClient.mutateAsync(data);
    setIsOpen(false);
    setShowPlanFields(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editClient) return;
    
    const formData = new FormData(e.currentTarget);
    const hasPlan = formData.get('edit_has_plan') === 'on';
    await updateClient.mutateAsync({
      id: editClient.id,
      name: formData.get('name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      company: formData.get('company') as string || null,
      monthly_plan_value: hasPlan ? Number(formData.get('monthly_plan_value')) || null : null,
      plan_currency: hasPlan ? (formData.get('plan_currency') as string) || 'BRL' : null,
      plan_start_date: hasPlan ? (formData.get('plan_start_date') as string) || null : null,
      plan_billing_day: hasPlan ? Number(formData.get('plan_billing_day')) || 1 : null,
    });
    setEditClient(null);
    setEditShowPlanFields(false);
  };

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    await updateClient.mutateAsync({ id: client.id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    await deleteClient.mutateAsync(id);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Gestão</p>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        </div>
        {canManageClients && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="h-11">
                <Plus className="h-4 w-4 mr-2" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Adicionar Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Nome do cliente" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="email@exemplo.com" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" placeholder="(11) 99999-9999" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" name="company" placeholder="Nome da empresa" className="h-11" />
                </div>

                {/* Monthly Plan Toggle */}
                <div className="flex items-center gap-3 py-2">
                  <Checkbox 
                    id="has_plan" 
                    name="has_plan"
                    checked={showPlanFields}
                    onCheckedChange={(checked) => setShowPlanFields(!!checked)}
                  />
                  <Label htmlFor="has_plan" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Cliente com plano mensal
                  </Label>
                </div>

                {showPlanFields && (
                  <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan_currency">Moeda</Label>
                        <Select name="plan_currency" defaultValue="BRL">
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
                        <Label htmlFor="monthly_plan_value">Valor Mensal</Label>
                        <Input 
                          id="monthly_plan_value" 
                          name="monthly_plan_value" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="h-11" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan_start_date">Data de Inicio</Label>
                        <Input 
                          id="plan_start_date" 
                          name="plan_start_date" 
                          type="date" 
                          className="h-11" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan_billing_day">Dia de Cobranca</Label>
                        <Input 
                          id="plan_billing_day" 
                          name="plan_billing_day" 
                          type="number" 
                          min="1"
                          max="31"
                          defaultValue="1"
                          placeholder="1" 
                          className="h-11" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 mt-2" disabled={createClient.isPending}>
                  {createClient.isPending ? 'Salvando...' : 'Salvar Cliente'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={(open) => {
        if (!open) {
          setEditClient(null);
          setEditShowPlanFields(false);
        } else if (editClient) {
          setEditShowPlanFields(!!editClient.monthly_plan_value);
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input 
                id="edit-name" 
                name="name" 
                required 
                placeholder="Nome do cliente" 
                className="h-11"
                defaultValue={editClient?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                name="email" 
                type="email" 
                placeholder="email@exemplo.com" 
                className="h-11"
                defaultValue={editClient?.email || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input 
                id="edit-phone" 
                name="phone" 
                placeholder="(11) 99999-9999" 
                className="h-11"
                defaultValue={editClient?.phone || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input 
                id="edit-company" 
                name="company" 
                placeholder="Nome da empresa" 
                className="h-11"
                defaultValue={editClient?.company || ''}
              />
            </div>

            {/* Monthly Plan Toggle */}
            <div className="flex items-center gap-3 py-2">
              <Checkbox 
                id="edit_has_plan" 
                name="edit_has_plan"
                checked={editShowPlanFields}
                onCheckedChange={(checked) => setEditShowPlanFields(!!checked)}
              />
              <Label htmlFor="edit_has_plan" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Cliente com plano mensal
              </Label>
            </div>

            {editShowPlanFields && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_plan_currency">Moeda</Label>
                    <Select name="plan_currency" defaultValue={editClient?.plan_currency || 'BRL'}>
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
                    <Label htmlFor="edit_monthly_plan_value">Valor Mensal</Label>
                    <Input 
                      id="edit_monthly_plan_value" 
                      name="monthly_plan_value" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="h-11"
                      defaultValue={editClient?.monthly_plan_value || ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_plan_start_date">Data de Inicio</Label>
                    <Input 
                      id="edit_plan_start_date" 
                      name="plan_start_date" 
                      type="date" 
                      className="h-11"
                      defaultValue={editClient?.plan_start_date || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_plan_billing_day">Dia de Cobranca</Label>
                    <Input 
                      id="edit_plan_billing_day" 
                      name="plan_billing_day" 
                      type="number" 
                      min="1"
                      max="31"
                      placeholder="1" 
                      className="h-11"
                      defaultValue={editClient?.plan_billing_day || 1}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 mt-2" disabled={updateClient.isPending}>
              {updateClient.isPending ? 'Salvando...' : 'Salvar Alterações'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={!!viewClient} onOpenChange={(open) => !open && setViewClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              {viewClient?.name}
              {viewClient?.status === 'inactive' && (
                <Badge variant="outline" className="bg-muted text-muted-foreground ml-2">Inativo</Badge>
              )}
              {viewClient?.monthly_plan_value && (
                <Badge className="bg-primary/15 text-primary border-primary/30 ml-2">
                  Plano {formatCurrency(viewClient.monthly_plan_value, viewClient.plan_currency || 'BRL')}/mes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewClient && (
            <div className="space-y-6 mt-4">
              {/* Client Info */}
              <div className="grid gap-3 text-sm">
                {viewClient.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{viewClient.email}</span>
                  </div>
                )}
                {viewClient.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{viewClient.phone}</span>
                  </div>
                )}
                {viewClient.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{viewClient.company}</span>
                  </div>
                )}
              </div>

              {/* Plan Details */}
              {viewClient.monthly_plan_value && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Plano Mensal
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-semibold">{formatCurrency(viewClient.monthly_plan_value, viewClient.plan_currency || 'BRL')}</p>
                    </div>
                    {viewClient.plan_start_date && (
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-semibold">{new Date(viewClient.plan_start_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {viewClient.plan_billing_day && (
                      <div>
                        <p className="text-muted-foreground">Dia de Cobranca</p>
                        <p className="font-semibold">Dia {viewClient.plan_billing_day}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Client Files Section */}
              <ClientFilesSection clientId={viewClient.id} clientName={viewClient.name} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar clientes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-11 h-11" 
          />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-11">
            <TabsTrigger value="all" className="px-4">Todos</TabsTrigger>
            <TabsTrigger value="active" className="px-4">Ativos</TabsTrigger>
            <TabsTrigger value="inactive" className="px-4">Inativos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredClients.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search ? 'Tente buscar por outro termo.' : 'Adicione seu primeiro cliente para começar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => (
            <Card 
              key={client.id} 
              className="card-hover border-border/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.status === 'inactive' && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">Inativo</Badge>
                      )}
                      {client.monthly_plan_value && (
                        <Badge className="bg-primary/15 text-primary border-primary/30">
                          Plano {formatCurrency(client.monthly_plan_value, client.plan_currency || 'BRL')}/mes
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewClient(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditClient(client)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(client)}>
                        <Power className="h-4 w-4 mr-2" />
                        {client.status === 'inactive' ? 'Ativar' : 'Desativar'}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {client.phone}
                    </p>
                  )}
                  {client.company && (
                    <p className="flex items-center gap-2">
                      <Building className="h-4 w-4" /> {client.company}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
