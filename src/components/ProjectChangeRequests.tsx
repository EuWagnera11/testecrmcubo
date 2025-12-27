import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Edit2, Paperclip, Image, X, ExternalLink } from 'lucide-react';
import { useProjectChangeRequests, ProjectChangeRequest } from '@/hooks/useProjectChangeRequests';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectChangeRequestsProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
  completed: { label: 'Concluída', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  rejected: { label: 'Rejeitada', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
};

export function ProjectChangeRequests({ projectId }: ProjectChangeRequestsProps) {
  const { changeRequests, isLoading, createChangeRequest, updateChangeRequest, deleteChangeRequest, uploadAttachment } = useProjectChangeRequests(projectId);
  const [open, setOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ProjectChangeRequest | null>(null);
  const [description, setDescription] = useState('');
  const [requestedAt, setRequestedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadAttachment(file));
      const urls = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...urls]);
      toast.success(`${files.length} arquivo(s) anexado(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao anexar arquivo(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (editingRequest) {
      updateChangeRequest.mutate({
        id: editingRequest.id,
        description,
        requested_at: requestedAt,
        notes: notes || null,
        attachments,
      });
    } else {
      createChangeRequest.mutate({
        project_id: projectId,
        description,
        requested_at: requestedAt,
        notes: notes || undefined,
        attachments,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setRequestedAt(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setAttachments([]);
    setEditingRequest(null);
    setOpen(false);
  };

  const handleEdit = (request: ProjectChangeRequest) => {
    setEditingRequest(request);
    setDescription(request.description);
    setRequestedAt(request.requested_at);
    setNotes(request.notes || '');
    setAttachments(request.attachments || []);
    setOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateChangeRequest.mutate({ id, status: status as 'pending' | 'completed' | 'rejected' });
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
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
          <DialogContent className="max-w-lg">
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
              <div>
                <label className="text-sm font-medium">Anexos</label>
                <div className="mt-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    {uploading ? 'Enviando...' : 'Anexar arquivo'}
                  </Button>
                  
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attachments.map((url, index) => (
                        <div key={index} className="relative group">
                          {isImageUrl(url) ? (
                            <div className="relative">
                              <img
                                src={url}
                                alt={`Anexo ${index + 1}`}
                                className="h-16 w-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                              <Paperclip className="h-3 w-3" />
                              <span className="max-w-[80px] truncate">Arquivo</span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createChangeRequest.isPending || updateChangeRequest.isPending || uploading}>
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
              const requestAttachments = request.attachments || [];

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
                  
                  {requestAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {requestAttachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          {isImageUrl(url) ? (
                            <div className="relative">
                              <img
                                src={url}
                                alt={`Anexo ${index + 1}`}
                                className="h-12 w-12 object-cover rounded border hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
                                <ExternalLink className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors">
                              <Paperclip className="h-3 w-3" />
                              <span>Ver arquivo</span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  
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
