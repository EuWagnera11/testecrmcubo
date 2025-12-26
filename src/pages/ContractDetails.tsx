import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, FileText, Mail, User, 
  Calendar, Building2, Check, Clock, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground', icon: Pencil },
  sent: { label: 'Enviado', className: 'bg-warning/15 text-warning border-warning/30', icon: Send },
  signed: { label: 'Assinado', className: 'bg-success/15 text-success border-success/30', icon: Check },
};

const contractTypes = [
  { value: 'one_time', label: 'Pontual' },
  { value: 'monthly', label: 'Mensal' },
];

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const { contracts, updateContract } = useContracts();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();

  const contract = contracts.find(c => c.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    terms: '',
    client_id: '',
    project_id: '',
    contract_type: 'one_time',
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title,
        terms: contract.terms || '',
        client_id: contract.client_id || '',
        project_id: contract.project_id || '',
        contract_type: (contract as any).contract_type || 'one_time',
      });
    }
  }, [contract]);

  const handleSave = async () => {
    if (!contract) return;
    await updateContract.mutateAsync({
      id: contract.id,
      ...formData,
    });
    setIsEditing(false);
  };

  const handleSendForSignature = async () => {
    if (!contract) return;
    await updateContract.mutateAsync({
      id: contract.id,
      status: 'sent' as any,
    });
    setSendDialogOpen(false);
    toast({
      title: 'Contrato enviado!',
      description: 'O contrato foi enviado para assinatura.',
    });
  };

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Contrato não encontrado</p>
      </div>
    );
  }

  const StatusIcon = statusConfig[contract.status].icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to="/contratos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 font-body">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display tracking-wide">{contract.title}</h1>
            <Badge variant="outline" className={statusConfig[contract.status].className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[contract.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 font-body">
            Criado em {format(parseISO(contract.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex gap-3">
          {contract.status === 'draft' && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="pulse-glow">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Assinatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Enviar Contrato</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-muted-foreground font-body">
                      Deseja enviar este contrato para os signatários? Eles receberão um email com o link para assinatura.
                    </p>
                    {contract.signatories && contract.signatories.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Signatários:</p>
                        {contract.signatories.map(sig => (
                          <div key={sig.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {sig.name} ({sig.email})
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setSendDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={handleSendForSignature} className="flex-1" disabled={updateContract.isPending}>
                        {updateContract.isPending ? 'Enviando...' : 'Confirmar Envio'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 border-border/50 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-body">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Contrato</Label>
                    <Select 
                      value={formData.contract_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
                    >
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
                    <Select 
                      value={formData.client_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                    >
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
                </div>
                <div className="space-y-2">
                  <Label>Projeto Relacionado</Label>
                  <Select 
                    value={formData.project_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  >
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
                  <Label>Termos e Condições</Label>
                  <Textarea 
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={10}
                    placeholder="Descreva os termos do contrato..."
                  />
                </div>
                <Button onClick={handleSave} disabled={updateContract.isPending} className="w-full h-11">
                  <Save className="h-4 w-4 mr-2" />
                  {updateContract.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="p-4 rounded-xl bg-muted/30 whitespace-pre-wrap font-body">
                  {contract.terms || 'Nenhum termo definido.'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="border-border/50 glass-card">
            <CardHeader>
              <CardTitle className="text-base font-body">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-sm">{contract.clients?.name || 'Não definido'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projeto</p>
                  <p className="font-medium text-sm">{contract.projects?.name || 'Não definido'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atualizado</p>
                  <p className="font-medium text-sm">
                    {format(parseISO(contract.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signatories Card */}
          <Card className="border-border/50 glass-card">
            <CardHeader>
              <CardTitle className="text-base font-body flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Signatários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.signatories && contract.signatories.length > 0 ? (
                <div className="space-y-3">
                  {contract.signatories.map(sig => (
                    <div key={sig.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{sig.name}</p>
                        <p className="text-xs text-muted-foreground">{sig.email}</p>
                      </div>
                      {sig.signed_at ? (
                        <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                          <Check className="h-3 w-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum signatário adicionado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
