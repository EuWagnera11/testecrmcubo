import { useState } from 'react';
import { FileStack, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContractTemplates, ContractTemplate } from '@/hooks/useContractTemplates';

interface ContractTemplateSelectorProps {
  onSelectTemplate: (template: ContractTemplate) => void;
}

export function ContractTemplateSelector({ onSelectTemplate }: ContractTemplateSelectorProps) {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useContractTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('select');

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createTemplate.mutateAsync({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      terms: formData.get('terms') as string,
      contract_type: formData.get('contract_type') as string || 'one_time',
    });
    e.currentTarget.reset();
    setActiveTab('select');
  };

  const handleUpdateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      terms: formData.get('terms') as string,
      contract_type: formData.get('contract_type') as string,
    });
    setEditingTemplate(null);
    setActiveTab('select');
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full h-11">
          <FileStack className="h-4 w-4 mr-2" />
          Usar Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Templates de Contrato</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Selecionar</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4 mt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando templates...</p>
            ) : templates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Nenhum template criado ainda.
                    <br />
                    <button 
                      onClick={() => setActiveTab('create')} 
                      className="text-primary hover:underline mt-1"
                    >
                      Criar primeiro template
                    </button>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {templates.map(template => (
                  <Card key={template.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{template.name}</h4>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {template.contract_type === 'monthly' ? 'Mensal' : 'Pontual'}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                            "{template.terms.substring(0, 100)}..."
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTemplate(template);
                              setActiveTab('create');
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteTemplate.mutate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Usar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            {editingTemplate && (
              <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Editando: {editingTemplate.name}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setEditingTemplate(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar Edição
                </Button>
              </div>
            )}
            
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Nome do Template *</Label>
                <Input 
                  id="template_name" 
                  name="name" 
                  required 
                  placeholder="Ex: Contrato de Social Media"
                  defaultValue={editingTemplate?.name || ''}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template_description">Descrição</Label>
                <Input 
                  id="template_description" 
                  name="description" 
                  placeholder="Breve descrição do template"
                  defaultValue={editingTemplate?.description || ''}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select name="contract_type" defaultValue={editingTemplate?.contract_type || 'one_time'}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Pontual</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_terms">Termos do Contrato *</Label>
                <Textarea 
                  id="template_terms" 
                  name="terms" 
                  required
                  placeholder="Escreva os termos padrão do contrato..."
                  rows={8}
                  defaultValue={editingTemplate?.terms || ''}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? (
                  <>
                    {updateTemplate.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {createTemplate.isPending ? 'Criando...' : 'Criar Template'}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
