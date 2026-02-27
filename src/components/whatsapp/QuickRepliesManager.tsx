import { useState } from 'react';
import { useQuickReplies, QuickReply } from '@/hooks/useQuickReplies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function QuickRepliesManager() {
  const { replies, isLoading, createReply, updateReply, deleteReply } = useQuickReplies();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'geral', shortcut: '' });

  const handleCreate = () => {
    createReply.mutate(form, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setForm({ title: '', content: '', category: 'geral', shortcut: '' });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateReply.mutate({ id: editingId, ...form }, {
      onSuccess: () => {
        setEditingId(null);
        setForm({ title: '', content: '', category: 'geral', shortcut: '' });
      },
    });
  };

  const startEdit = (reply: QuickReply) => {
    setEditingId(reply.id);
    setForm({ title: reply.title, content: reply.content, category: reply.category, shortcut: reply.shortcut || '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Respostas Rápidas</CardTitle>
                <CardDescription>Templates de mensagens para uso no chat WhatsApp</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {replies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma resposta rápida cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {replies.map(reply => (
                <div key={reply.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                  {editingId === reply.id ? (
                    <div className="space-y-3">
                      <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título" />
                      <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Conteúdo" rows={3} />
                      <div className="flex gap-2">
                        <Input value={form.shortcut} onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))} placeholder="Atalho (ex: /oi)" className="w-32" />
                        <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Categoria" className="w-32" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" onClick={handleUpdate} disabled={updateReply.isPending}><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{reply.title}</span>
                          {reply.shortcut && <Badge variant="outline" className="text-[10px]">/{reply.shortcut}</Badge>}
                          <Badge variant="secondary" className="text-[10px]">{reply.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{reply.use_count}x</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(reply)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteReply.mutate(reply.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Resposta Rápida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Boas-vindas" />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Olá {{nome}}! Como posso ajudar?" rows={4} />
              <p className="text-[10px] text-muted-foreground mt-1">Variáveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{clinica}}'}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Atalho</Label>
                <Input value={form.shortcut} onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))} placeholder="oi" />
              </div>
              <div className="flex-1">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="geral" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.content || createReply.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
