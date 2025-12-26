import { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone, Building, ArrowRight, Trash2, Power, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients, CreateClientData, Client } from '@/hooks/useClients';

export default function Clients() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState('all');

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' || c.status === filter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateClientData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      company: formData.get('company') as string || undefined,
    };
    await createClient.mutateAsync(data);
    setIsOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editClient) return;
    
    const formData = new FormData(e.currentTarget);
    await updateClient.mutateAsync({
      id: editClient.id,
      name: formData.get('name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      company: formData.get('company') as string || null,
    });
    setEditClient(null);
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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
              <Button type="submit" className="w-full h-11 mt-2" disabled={createClient.isPending}>
                {createClient.isPending ? 'Salvando...' : 'Salvar Cliente'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent className="sm:max-w-md">
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
            <Button type="submit" className="w-full h-11 mt-2" disabled={updateClient.isPending}>
              {updateClient.isPending ? 'Salvando...' : 'Salvar Alterações'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
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
                    {client.status === 'inactive' && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground mt-1">Inativo</Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
