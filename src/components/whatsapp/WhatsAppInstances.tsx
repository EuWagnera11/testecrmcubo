import { useState } from 'react';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Wifi, WifiOff, QrCode, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function WhatsAppInstances() {
  const { instances, isLoading, createInstance, deleteInstance } = useWhatsAppInstances();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', api_url: '', api_key: '', instance_name: '' });
  const { toast } = useToast();


  const handleCreate = async () => {
    if (!form.name || !form.api_url || !form.api_key || !form.instance_name) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    try {
      await createInstance.mutateAsync(form);
      toast({ title: 'Conexão criada com sucesso' });
      setOpen(false);
      setForm({ name: '', api_url: '', api_key: '', instance_name: '' });
    } catch (err: any) {
      toast({ title: 'Erro ao criar conexão', description: err.message, variant: 'destructive' });
    }
  };

  const handleCheckStatus = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'check-status', instanceId },
      });
      if (error) throw error;
      toast({ title: `Status: ${data.status}` });
    } catch (err: any) {
      toast({ title: 'Erro ao verificar status', description: err.message, variant: 'destructive' });
    }
  };

  const handleSetWebhook = async (instanceId: string) => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'set-webhook', instanceId },
      });
      if (error) throw error;
      toast({ title: 'Webhook configurado com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao configurar webhook', description: err.message, variant: 'destructive' });
    }
  };

  const handleGetQR = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'get-qrcode', instanceId },
      });
      if (error) throw error;

      const qrImage = data?.data?.base64 || data?.data?.qrcode?.base64 || data?.data?.code;
      if (qrImage) {
        const w = window.open('', '_blank', 'width=400,height=400');
        if (w) {
          w.document.write(`<img src="${qrImage}" style="width:100%;height:auto;" />`);
        }
      } else if (data?.data?.pairingCode) {
        toast({ title: 'Código de pareamento', description: data.data.pairingCode });
      } else {
        toast({ title: 'QR Code não disponível. Verifique se a instância existe na Evolution API.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao buscar QR Code', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conexões WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas instâncias da Evolution API</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conexão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Conexão</Label>
                <Input placeholder="Ex: WhatsApp Principal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>URL da Evolution API</Label>
                <Input placeholder="https://api.evolution.com.br" value={form.api_url} onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="Sua chave da API" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nome da Instância</Label>
                <Input placeholder="Ex: cubo-whatsapp" value={form.instance_name} onChange={e => setForm(f => ({ ...f, instance_name: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createInstance.isPending}>
                {createInstance.isPending ? 'Criando...' : 'Criar Conexão'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <WifiOff className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma conexão configurada</p>
            <p className="text-sm text-muted-foreground">Clique em "Nova Conexão" para configurar sua Evolution API</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map(instance => (
            <Card key={instance.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{instance.name}</CardTitle>
                    <CardDescription className="text-xs">{instance.instance_name} • {instance.api_url}</CardDescription>
                  </div>
                  <Badge variant={instance.status === 'open' ? 'default' : 'secondary'} className="gap-1">
                    {instance.status === 'open' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {instance.status === 'open' ? 'Conectado' : instance.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleCheckStatus(instance.id)} className="gap-1">
                    <Wifi className="h-3 w-3" />
                    Verificar Status
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleGetQR(instance.id)} className="gap-1">
                    <QrCode className="h-3 w-3" />
                    QR Code
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSetWebhook(instance.id)} className="gap-1">
                    <Webhook className="h-3 w-3" />
                    Configurar Webhook
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta conexão?')) {
                        deleteInstance.mutate(instance.id);
                      }
                    }}
                    className="gap-1 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
