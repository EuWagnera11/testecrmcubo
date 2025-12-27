import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Plus, Trash2, FileText, Image, Folder, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClientFiles, CreateClientFileData } from '@/hooks/useClientFiles';
import { useProjects } from '@/hooks/useProjects';

interface ClientFilesSectionProps {
  clientId: string;
  clientName: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  drive: <Folder className="h-4 w-4" />,
  docs: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
};

const fileTypeLabels: Record<string, string> = {
  drive: 'Google Drive',
  docs: 'Google Docs',
  image: 'Imagem',
  link: 'Link',
};

export function ClientFilesSection({ clientId, clientName }: ClientFilesSectionProps) {
  const { files, isLoading, createFile, deleteFile } = useClientFiles(clientId);
  const { projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateClientFileData>({
    client_id: clientId,
    title: '',
    url: '',
    file_type: 'link',
    description: '',
    project_id: null,
  });

  const clientProjects = projects?.filter(p => p.client_id === clientId) ?? [];

  const detectFileType = (url: string): string => {
    if (url.includes('drive.google.com')) return 'drive';
    if (url.includes('docs.google.com')) return 'docs';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return 'image';
    return 'link';
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      url,
      file_type: detectFileType(url),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) return;

    createFile.mutate(formData, {
      onSuccess: () => {
        setFormData({
          client_id: clientId,
          title: '',
          url: '',
          file_type: 'link',
          description: '',
          project_id: null,
        });
        setIsOpen(false);
      },
    });
  };

  // Group files by month/year
  const groupedFiles = files.reduce((acc, file) => {
    const date = new Date(file.created_at);
    const key = format(date, 'MMMM yyyy', { locale: ptBR });
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {} as Record<string, typeof files>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Arquivos do Cliente
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Arquivo/Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Fotos da campanha de verão"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_type">Tipo</Label>
                <Select
                  value={formData.file_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drive">Google Drive</SelectItem>
                    <SelectItem value="docs">Google Docs</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {clientProjects.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="project">Projeto (opcional)</Label>
                  <Select
                    value={formData.project_id ?? 'none'}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      project_id: value === 'none' ? null : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum projeto</SelectItem>
                      {clientProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do conteúdo..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createFile.isPending}>
                  {createFile.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum arquivo salvo ainda</p>
            <p className="text-sm">Adicione links de Drive, Docs ou outros arquivos</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedFiles).map(([monthYear, monthFiles]) => (
                <div key={monthYear}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                    {monthYear}
                  </h4>
                  <div className="space-y-2">
                    {monthFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {fileTypeIcons[file.file_type] || <LinkIcon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline truncate flex items-center gap-1"
                            >
                              {file.title}
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {fileTypeLabels[file.file_type] || 'Link'}
                            </Badge>
                            {file.project && (
                              <Badge variant="outline" className="text-xs">
                                {file.project.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(file.created_at), "dd 'de' MMM", { locale: ptBR })}
                            </span>
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {file.description}
                            </p>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{file.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFile.mutate(file.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
