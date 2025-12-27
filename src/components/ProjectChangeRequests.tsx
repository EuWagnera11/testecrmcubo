import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Edit2 } from 'lucide-react';
import { useProjectChangeRequests, ProjectChangeRequest } from '@/hooks/useProjectChangeRequests';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectChangeRequestsProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
  completed: { label: 'Concluída', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  rejected: { label: 'Rejeitada', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
};

export function ProjectChangeRequests({ projectId }: ProjectChangeRequestsProps) {
  const { changeRequests, isLoading, createChangeRequest, updateChangeRequest, deleteChangeRequest } = useProjectChangeRequests(projectId);
  const [open, setOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ProjectChangeRequest | null>(null);
  const [description, setDescription] = useState('');
  const [requestedAt, setRequestedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (editingRequest) {
      updateChangeRequest.mutate({
        id: editingRequest.id,
        description,
        requested_at: requestedAt,
        notes: notes || null,
      });
    } else {
      createChangeRequest.mutate({
        project_id: projectId,
        description,
        requested_at: requestedAt,
        notes: notes || undefined,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setRequestedAt(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setEditingRequest(null);
    setOpen(false);
  };

  const handleEdit = (request: ProjectChangeRequest) => {
    setEditingRequest(request);
    setDescription(request.description);
    setRequestedAt(request.requested_at);
    setNotes(request.notes || '');
    setOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateChangeRequest.mutate({ id, status: status as 'pending' | 'completed' | 'rejected' });
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Alterações Solicitadas</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Alteração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRequest ? 'Editar Alteração' : 'Registrar Alteração'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição da alteração *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que o cliente solicitou..."
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data da solicitação</label>
                <Input
                  type="date"
                  value={requestedAt}
                  onChange={(e) => setRequestedAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createChangeRequest.isPending || updateChangeRequest.isPending}>
                  {editingRequest ? 'Salvar' : 'Registrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {changeRequests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Nenhuma alteração registrada
          </p>
        ) : (
          <div className="space-y-3">
            {changeRequests.map((request) => {
              const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{request.description}</p>
                      {request.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{request.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(request)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteChangeRequest.mutate(request.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {format(new Date(request.requested_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Select
                      value={request.status}
                      onValueChange={(value) => handleStatusChange(request.id, value)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                          <span>{status.label}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-yellow-600" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            Concluída
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                            Rejeitada
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
