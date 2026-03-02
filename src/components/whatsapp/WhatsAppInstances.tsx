import { useState, useEffect } from 'react';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Wifi, WifiOff, QrCode, Webhook, RotateCcw, Edit2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppInstances() {
  const { instances, isLoading, createInstance, deleteInstance, updateInstance } = useWhatsAppInstances();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', api_url: '', api_key: '', instance_name: '' });
  const { toast } = useToast();

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', api_url: '', api_key: '', instance_name: '' });
  const [showApiKey, setShowApiKey] = useState(false);

  // QR Code modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [qrPairingCode, setQrPairingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!qrOpen || !qrInstanceId) return;
    const interval = setInterval(() => { fetchQR(qrInstanceId); }, 15000);
    return () => clearInterval(interval);
  }, [qrOpen, qrInstanceId]);

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

  const handleEdit = (inst: typeof instances[0]) => {
    setEditForm({ id: inst.id, name: inst.name, api_url: inst.api_url, api_key: inst.api_key, instance_name: inst.instance_name });
    setShowApiKey(false);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.api_url || !editForm.api_key || !editForm.instance_name) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (!editForm.api_url.startsWith('https://')) {
      toast({ title: 'URL deve começar com https://', variant: 'destructive' });
      return;
    }
    try {
      await updateInstance.mutateAsync(editForm);
      toast({ title: 'Conexão atualizada com sucesso' });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  };

  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleCheckStatus = async (instanceId: string) => {
    setCheckingStatus(instanceId);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'check-status', instanceId },
      });
      if (error) throw error;
      setRetryCount(0);
      toast({ title: `Status: ${data.status}` });
      await supabase.from('whatsapp_instances').update({ status: data.status === 'open' ? 'open' : data.status }).eq('id', instanceId);
    } catch (err: any) {
      const newCount = retryCount + 1;
      setRetryCount(newCount);
      if (newCount >= 3) {
        toast({ title: 'Falha ao conectar', description: 'Verifique a configuração da instância.', variant: 'destructive' });
        setRetryCount(0);
      } else {
        toast({ title: 'Erro ao verificar status', description: err.message, variant: 'destructive' });
      }
    } finally {
      setCheckingStatus(null);
    }
  };

  const handleSetWebhook = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'set-webhook', instanceId },
      });
      if (error) throw error;
      toast({ title: 'Webhook configurado com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao configurar webhook', description: err.message, variant: 'destructive' });
    }
  };

  const fetchQR = async (instanceId: string) => {
    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'get-qrcode', instanceId },
      });
      if (error) throw error;
      const img = data?.data?.base64 || data?.data?.qrcode?.base64 || data?.data?.code;
      if (img) { setQrImage(img); setQrPairingCode(null); }
      else if (data?.data?.pairingCode) { setQrImage(null); setQrPairingCode(data.data.pairingCode); }
      else { setQrImage(null); setQrPairingCode(null); toast({ title: 'QR Code não disponível.' }); }
    } catch (err: any) {
      toast({ title: 'Erro ao buscar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  const handleGetQR = async (instanceId: string) => {
    setQrInstanceId(instanceId);
    setQrImage(null);
    setQrPairingCode(null);
    setQrOpen(true);
    fetchQR(instanceId);
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
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nova Conexão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conexão WhatsApp</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome da Conexão</Label><Input placeholder="Ex: WhatsApp Principal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>URL da Evolution API</Label><Input placeholder="https://api.evolution.com.br" value={form.api_url} onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>API Key</Label><Input type="password" placeholder="Sua chave da API" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Nome da Instância</Label><Input placeholder="Ex: cubo-whatsapp" value={form.instance_name} onChange={e => setForm(f => ({ ...f, instance_name: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={handleCreate} disabled={createInstance.isPending}>{createInstance.isPending ? 'Criando...' : 'Criar Conexão'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : instances.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><WifiOff className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma conexão configurada</p><p className="text-sm text-muted-foreground">Clique em "Nova Conexão" para configurar sua Evolution API</p></CardContent></Card>
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
                  <Button size="sm" variant="outline" onClick={() => handleCheckStatus(instance.id)} disabled={checkingStatus === instance.id} className="gap-1">
                    <Wifi className="h-3 w-3" />{checkingStatus === instance.id ? 'Verificando...' : 'Verificar Status'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleGetQR(instance.id)} className="gap-1"><QrCode className="h-3 w-3" />QR Code</Button>
                  <Button size="sm" variant="outline" onClick={() => handleSetWebhook(instance.id)} className="gap-1"><Webhook className="h-3 w-3" />Configurar Webhook</Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(instance)} className="gap-1"><Edit2 className="h-3 w-3" />Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm('Tem certeza que deseja excluir esta conexão?')) deleteInstance.mutate(instance.id); }} className="gap-1 ml-auto"><Trash2 className="h-3 w-3" />Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Instance Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Conexão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome da Conexão</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>URL da Evolution API</Label><Input value={editForm.api_url} onChange={e => setEditForm(f => ({ ...f, api_url: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input type={showApiKey ? 'text' : 'password'} value={editForm.api_key} onChange={e => setEditForm(f => ({ ...f, api_key: e.target.value }))} />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2"><Label>Nome da Instância</Label><Input value={editForm.instance_name} onChange={e => setEditForm(f => ({ ...f, instance_name: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleUpdate} disabled={updateInstance.isPending}>{updateInstance.isPending ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code WhatsApp</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrLoading && !qrImage && !qrPairingCode && <p className="text-sm text-muted-foreground">Carregando QR Code...</p>}
            {qrImage && <img src={qrImage} alt="QR Code WhatsApp" className="w-64 h-64 object-contain rounded-md border" />}
            {qrPairingCode && <div className="text-center space-y-2"><p className="text-sm text-muted-foreground">Código de pareamento:</p><p className="text-2xl font-mono font-bold tracking-widest">{qrPairingCode}</p></div>}
            {!qrLoading && !qrImage && !qrPairingCode && <p className="text-sm text-muted-foreground">QR Code não disponível</p>}
            <p className="text-xs text-muted-foreground">Atualização automática a cada 15s</p>
            <Button size="sm" variant="outline" onClick={() => qrInstanceId && fetchQR(qrInstanceId)} disabled={qrLoading}><RotateCcw className="h-3 w-3 mr-1" />Atualizar agora</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
