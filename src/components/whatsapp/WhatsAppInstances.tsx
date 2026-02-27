import { useState, useEffect } from 'react';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { useWhatsAppBackend } from '@/hooks/useWhatsAppBackend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Wifi, WifiOff, QrCode, Webhook, Server, RotateCcw, Save, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppInstances() {
  const { instances, isLoading, createInstance, deleteInstance } = useWhatsAppInstances();
  const { url, key, isConfigured, setConfig, clearConfig, callFunction, DEFAULT_URL, DEFAULT_KEY } = useWhatsAppBackend();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', api_url: '', api_key: '', instance_name: '' });
  const { toast } = useToast();

  // Backend config form state
  const [configUrl, setConfigUrl] = useState(url);
  const [configKey, setConfigKey] = useState(key);

  // QR Code modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [qrPairingCode, setQrPairingCode] = useState<string | null>(null);

  // Auto-refresh QR code
  useEffect(() => {
    if (!qrOpen || !qrInstanceId) return;
    const interval = setInterval(() => {
      fetchQR(qrInstanceId);
    }, 15000);
    return () => clearInterval(interval);
  }, [qrOpen, qrInstanceId]);

  const handleSaveConfig = () => {
    if (!configUrl || !configKey) {
      toast({ title: 'Preencha URL e Chave', variant: 'destructive' });
      return;
    }
    setConfig(configUrl, configKey);
    toast({ title: '✅ Backend configurado com sucesso' });
  };

  const handleResetConfig = () => {
    clearConfig();
    setConfigUrl(DEFAULT_URL);
    setConfigKey(DEFAULT_KEY);
    toast({ title: 'Backend resetado para o padrão' });
  };

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
    if (!isConfigured) {
      toast({ title: '⚠️ Configure o backend primeiro', variant: 'destructive' });
      return;
    }
    try {
      const data = await callFunction('whatsapp-instance', { action: 'check-status', instanceId });
      toast({ title: `Status: ${data.status}` });
    } catch (err: any) {
      toast({ title: 'Erro ao verificar status', description: err.message, variant: 'destructive' });
    }
  };

  const handleSetWebhook = async (instanceId: string) => {
    if (!isConfigured) {
      toast({ title: '⚠️ Configure o backend primeiro', variant: 'destructive' });
      return;
    }
    try {
      await callFunction('whatsapp-instance', { action: 'set-webhook', instanceId });
      toast({ title: 'Webhook configurado com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao configurar webhook', description: err.message, variant: 'destructive' });
    }
  };

  const fetchQR = async (instanceId: string) => {
    setQrLoading(true);
    try {
      const data = await callFunction('whatsapp-instance', { action: 'get-qrcode', instanceId });
      const img = data?.data?.base64 || data?.data?.qrcode?.base64 || data?.data?.code;
      if (img) {
        setQrImage(img);
        setQrPairingCode(null);
      } else if (data?.data?.pairingCode) {
        setQrImage(null);
        setQrPairingCode(data.data.pairingCode);
      } else {
        setQrImage(null);
        setQrPairingCode(null);
        toast({ title: 'QR Code não disponível. Verifique se a instância existe na Evolution API.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao buscar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  const handleGetQR = async (instanceId: string) => {
    if (!isConfigured) {
      toast({ title: '⚠️ Configure o backend primeiro', variant: 'destructive' });
      return;
    }
    setQrInstanceId(instanceId);
    setQrImage(null);
    setQrPairingCode(null);
    setQrOpen(true);
    fetchQR(instanceId);
  };

  return (
    <div className="space-y-6">
      {/* Backend Configuration Panel */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Configuração do Backend</CardTitle>
                <CardDescription className="text-xs">URL e chave do Supabase para as Edge Functions do WhatsApp</CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? 'default' : 'destructive'} className="gap-1">
              {isConfigured ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {isConfigured ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">URL do Backend</Label>
            <Input
              placeholder="https://xxx.supabase.co"
              value={configUrl}
              onChange={e => setConfigUrl(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Chave Anônima (anon key)</Label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={configKey}
              onChange={e => setConfigKey(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveConfig} className="gap-1">
              <Save className="h-3 w-3" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetConfig} className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Management */}
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

      {/* QR Code Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrLoading && !qrImage && !qrPairingCode && (
              <p className="text-sm text-muted-foreground">Carregando QR Code...</p>
            )}
            {qrImage && (
              <img src={qrImage} alt="QR Code WhatsApp" className="w-64 h-64 object-contain rounded-md border" />
            )}
            {qrPairingCode && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Código de pareamento:</p>
                <p className="text-2xl font-mono font-bold tracking-widest">{qrPairingCode}</p>
              </div>
            )}
            {!qrLoading && !qrImage && !qrPairingCode && (
              <p className="text-sm text-muted-foreground">QR Code não disponível</p>
            )}
            <p className="text-xs text-muted-foreground">Atualização automática a cada 15s</p>
            <Button size="sm" variant="outline" onClick={() => qrInstanceId && fetchQR(qrInstanceId)} disabled={qrLoading}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Atualizar agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
