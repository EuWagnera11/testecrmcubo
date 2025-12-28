import { useState } from 'react';
import { 
  Image, FileText, Plus, Trash2, ExternalLink, 
  Tag, Copy, Video, Layers, Grid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProjectCopyBank, useProjectCreatives } from '@/hooks/useProjectModules';
import { useToast } from '@/hooks/use-toast';

interface CreativesModuleProps {
  projectId: string;
}

const copyAngleLabels: Record<string, { label: string; color: string }> = {
  dor: { label: 'Baseada em Dor', color: 'bg-red-500/15 text-red-500' },
  prova_social: { label: 'Prova Social', color: 'bg-blue-500/15 text-blue-500' },
  urgencia: { label: 'Urgência/Escassez', color: 'bg-orange-500/15 text-orange-500' },
  beneficio: { label: 'Benefícios', color: 'bg-green-500/15 text-green-500' },
  autoridade: { label: 'Autoridade', color: 'bg-purple-500/15 text-purple-500' },
  curiosidade: { label: 'Curiosidade', color: 'bg-yellow-500/15 text-yellow-600' },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground' },
};

const copyStatusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  approved: { label: 'Aprovada', color: 'bg-success/15 text-success' },
  testing: { label: 'Em Teste', color: 'bg-blue-500/15 text-blue-500' },
  saturated: { label: 'Saturada', color: 'bg-orange-500/15 text-orange-500' },
};

const mediaTypeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  image: { label: 'Imagem Estática', icon: Image },
  video: { label: 'Vídeo', icon: Video },
  carousel: { label: 'Carrossel', icon: Layers },
  testimonial: { label: 'Depoimento', icon: FileText },
};

export function CreativesModule({ projectId }: CreativesModuleProps) {
  const { copyBank, createCopy, updateCopy, deleteCopy } = useProjectCopyBank(projectId);
  const { creatives, createCreative, updateCreative, deleteCreative } = useProjectCreatives(projectId);
  const { toast } = useToast();

  // Copy form
  const [newCopy, setNewCopy] = useState({ angle: 'dor', content: '', status: 'draft' });
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  // Creative form
  const [newCreative, setNewCreative] = useState({ 
    title: '', 
    media_url: '', 
    media_type: 'image', 
    dark_post_id: '',
    tags: '' 
  });
  const [creativeDialogOpen, setCreativeDialogOpen] = useState(false);

  const handleAddCopy = () => {
    if (!newCopy.content.trim()) return;
    createCopy.mutate(newCopy);
    setNewCopy({ angle: 'dor', content: '', status: 'draft' });
    setCopyDialogOpen(false);
  };

  const handleAddCreative = () => {
    if (!newCreative.title.trim()) return;
    createCreative.mutate({
      title: newCreative.title,
      media_url: newCreative.media_url || undefined,
      media_type: newCreative.media_type,
      dark_post_id: newCreative.dark_post_id || undefined,
      tags: newCreative.tags ? newCreative.tags.split(',').map(t => t.trim()) : undefined,
    });
    setNewCreative({ title: '', media_url: '', media_type: 'image', dark_post_id: '', tags: '' });
    setCreativeDialogOpen(false);
  };

  const handleCopyDarkPostId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'ID copiado!' });
  };

  return (
    <Tabs defaultValue="copy" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="copy" className="gap-2">
          <FileText className="h-4 w-4" /> Banco de Copys
        </TabsTrigger>
        <TabsTrigger value="creatives" className="gap-2">
          <Grid className="h-4 w-4" /> Galeria de Criativos
        </TabsTrigger>
      </TabsList>

      {/* Copy Bank Tab */}
      <TabsContent value="copy" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Copys por Ângulo</h3>
          <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nova Copy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Copy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Ângulo</Label>
                  <Select
                    value={newCopy.angle}
                    onValueChange={(v) => setNewCopy(prev => ({ ...prev, angle: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(copyAngleLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newCopy.content}
                    onChange={(e) => setNewCopy(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite a copy completa aqui..."
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newCopy.status}
                    onValueChange={(v) => setNewCopy(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(copyStatusLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCopy} className="w-full">
                  Adicionar Copy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {copyBank.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma copy cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {copyBank.map(copy => (
              <Card key={copy.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={copyAngleLabels[copy.angle]?.color || 'bg-muted'}>
                        {copyAngleLabels[copy.angle]?.label || copy.angle}
                      </Badge>
                      <Badge variant="outline" className={copyStatusLabels[copy.status]?.color}>
                        {copyStatusLabels[copy.status]?.label || copy.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Select
                        value={copy.status}
                        onValueChange={(v) => updateCopy.mutate({ id: copy.id, status: v })}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(copyStatusLabels).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive h-7 w-7"
                        onClick={() => deleteCopy.mutate(copy.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">{copy.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Creatives Gallery Tab */}
      <TabsContent value="creatives" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Galeria de Criativos</h3>
          <Dialog open={creativeDialogOpen} onOpenChange={setCreativeDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Novo Criativo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Criativo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newCreative.title}
                    onChange={(e) => setNewCreative(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: VSL Principal - Versão 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Mídia</Label>
                  <Select
                    value={newCreative.media_type}
                    onValueChange={(v) => setNewCreative(prev => ({ ...prev, media_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(mediaTypeLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL da Mídia (opcional)</Label>
                  <Input
                    value={newCreative.media_url}
                    onChange={(e) => setNewCreative(prev => ({ ...prev, media_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID do Dark Post (opcional)</Label>
                  <Input
                    value={newCreative.dark_post_id}
                    onChange={(e) => setNewCreative(prev => ({ ...prev, dark_post_id: e.target.value }))}
                    placeholder="Ex: 123456789012345_987654321"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={newCreative.tags}
                    onChange={(e) => setNewCreative(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Ex: vídeo nutella, depoimento, carrossel"
                  />
                </div>
                <Button onClick={handleAddCreative} className="w-full">
                  Adicionar Criativo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {creatives.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Image className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum criativo cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creatives.map(creative => {
              const TypeIcon = mediaTypeLabels[creative.media_type]?.icon || Image;
              return (
                <Card key={creative.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                    {creative.media_url ? (
                      <img 
                        src={creative.media_url} 
                        alt={creative.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`flex flex-col items-center justify-center ${creative.media_url ? 'hidden' : ''}`}>
                      <TypeIcon className="h-10 w-10 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {mediaTypeLabels[creative.media_type]?.label}
                      </span>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-background/80">
                      {mediaTypeLabels[creative.media_type]?.label || creative.media_type}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{creative.title}</p>
                        {creative.tags && creative.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {creative.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {creative.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                +{creative.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        {creative.dark_post_id && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-2 text-xs mt-1"
                            onClick={() => handleCopyDarkPostId(creative.dark_post_id!)}
                          >
                            <Copy className="h-3 w-3 mr-1" /> Dark Post ID
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {creative.media_url && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                            <a href={creative.media_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive h-7 w-7"
                          onClick={() => deleteCreative.mutate(creative.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
