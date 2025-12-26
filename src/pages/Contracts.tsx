import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, ArrowRight, MoreVertical, Trash2, Send, CheckCircle2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts, CreateContractData, Contract } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { ContractTemplateSelector } from '@/components/ContractTemplateSelector';
import { ContractTemplate } from '@/hooks/useContractTemplates';

const statusConfig = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviado', className: 'bg-warning/15 text-warning border-warning/30' },
  signed: { label: 'Assinado', className: 'bg-success/15 text-success border-success/30' },
};

const contractTypes = [
  { value: 'one_time', label: 'Pontual' },
  { value: 'monthly', label: 'Mensal' },
];

export default function Contracts() {
  const { contracts, isLoading, createContract, updateContract, deleteContract } = useContracts();
  const { clients } = useClients();
  const { projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [termsValue, setTermsValue] = useState('');

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);

  const handleSelectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setTermsValue(template.terms);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateContractData = {
      title: formData.get('title') as string,
      client_id: formData.get('client_id') as string || undefined,
      project_id: formData.get('project_id') as string || undefined,
      terms: termsValue || formData.get('terms') as string || undefined,
      signatories: [
        { name: formData.get('sig_name') as string, email: formData.get('sig_email') as string, role: 'contratante' as const },
      ],
    };
    await createContract.mutateAsync(data);
    setIsOpen(false);
    setSelectedTemplate(null);
    setTermsValue('');
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContract) return;
    
    const formData = new FormData(e.currentTarget);
    await updateContract.mutateAsync({
      id: editingContract.id,
      title: formData.get('title') as string,
      terms: formData.get('terms') as string || null,
    });
    setIsEditOpen(false);
    setEditingContract(null);
  };

  const handleSendContract = async (contract: Contract) => {
    await updateContract.mutateAsync({ id: contract.id, status: 'sent' });
  };

  const handleSignContract = async (contract: Contract) => {
    await updateContract.mutateAsync({ id: contract.id, status: 'signed' });
  };

  const handleDelete = async (id: string) => {
    await deleteContract.mutateAsync(id);
  };

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Documentos</p>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="h-4 w-4 mr-2" /> Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Criar Nova Proposta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Template Selector */}
              <ContractTemplateSelector onSelectTemplate={handleSelectTemplate} />
              
              {selectedTemplate && (
                <div className="p-3 bg-primary/10 rounded-lg text-sm">
                  <span className="font-medium">Template aplicado:</span> {selectedTemplate.name}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required placeholder="Título do contrato" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select name="contract_type" defaultValue="one_time">
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select name="client_id">
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select name="project_id">
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Signatário Principal</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input name="sig_name" placeholder="Nome" required className="h-11" />
                  <Input name="sig_email" type="email" placeholder="Email" required className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Termos</Label>
                <Textarea 
                  id="terms" 
                  name="terms" 
                  placeholder="Termos principais do contrato..." 
                  rows={4}
                  value={termsValue}
                  onChange={(e) => setTermsValue(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={createContract.isPending}>
                {createContract.isPending ? 'Criando...' : 'Criar Contrato'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingContract(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Contrato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Título *</Label>
              <Input 
                id="edit_title" 
                name="title" 
                required 
                placeholder="Título do contrato" 
                className="h-11"
                defaultValue={editingContract?.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_terms">Termos</Label>
              <Textarea 
                id="edit_terms" 
                name="terms" 
                placeholder="Termos principais do contrato..." 
                rows={6}
                defaultValue={editingContract?.terms || ''}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={updateContract.isPending}>
              {updateContract.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="h-11">
          <TabsTrigger value="all" className="px-4">Todos</TabsTrigger>
          <TabsTrigger value="draft" className="px-4">Rascunho</TabsTrigger>
          <TabsTrigger value="sent" className="px-4">Enviado</TabsTrigger>
          <TabsTrigger value="signed" className="px-4">Assinado</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground text-sm">Crie sua primeira proposta para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contract, index) => (
            <Link key={contract.id} to={`/contratos/${contract.id}`}>
            <Card 
              className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusConfig[contract.status].className}>
                      {statusConfig[contract.status].label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); openEditDialog(contract); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        {contract.status === 'draft' && (
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSendContract(contract); }}>
                            <Send className="h-4 w-4 mr-2 text-warning" />
                            Enviar
                          </DropdownMenuItem>
                        )}
                        
                        {contract.status === 'sent' && (
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSignContract(contract); }}>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                            Marcar como Assinado
                          </DropdownMenuItem>
                        )}
                        
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
                              <AlertDialogTitle>Remover contrato?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(contract.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{contract.clients?.name || 'Sem cliente'}</p>
                {contract.projects && (
                  <p className="text-xs text-muted-foreground mt-1">Projeto: {contract.projects.name}</p>
                )}
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
