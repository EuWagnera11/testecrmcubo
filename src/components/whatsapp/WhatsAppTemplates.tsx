import { useState } from 'react';
import { useWhatsAppTemplates } from '@/hooks/useWhatsApp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'closing', label: 'Fechamento' },
  { value: 'support', label: 'Suporte' },
];

export function WhatsAppTemplates() {
  const { templates, isLoading, createTemplate, deleteTemplate } = useWhatsAppTemplates();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', content: '', category: 'general' });
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!form.name || !form.content) {
      toast({ title: 'Preencha nome e conteúdo', variant: 'destructive' });
      return;
    }
    try {
      await createTemplate.mutateAsync(form);
      toast({ title: 'Template criado com sucesso' });
      setOpen(false);
      setForm({ name: '', content: '', category: 'general' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Templates de Mensagem</h2>
          <p className="text-sm text-muted-foreground">Mensagens pré-prontas para envio rápido</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Boas-vindas Lead" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Olá! Tudo bem? Vi que você se interessou..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                {createTemplate.isPending ? 'Criando...' : 'Criar Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum template criado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteTemplate.mutate(t.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{t.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
