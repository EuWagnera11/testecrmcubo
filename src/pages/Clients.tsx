import { useState } from 'react';
import { Plus, Search, Users, Mail, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useClients, CreateClientData } from '@/hooks/useClients';

export default function Clients() {
  const { clients, isLoading, createClient } = useClients();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" name="company" placeholder="Nome da empresa" />
              </div>
              <Button type="submit" className="w-full" disabled={createClient.isPending}>
                {createClient.isPending ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredClients.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{client.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {client.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {client.email}</p>}
                  {client.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {client.phone}</p>}
                  {client.company && <p className="flex items-center gap-2"><Building className="h-3 w-3" /> {client.company}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
