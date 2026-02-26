import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useWhatsAppTemplates, useSendWhatsAppMessage } from '@/hooks/useWhatsApp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppNewChat({ instanceId }: { instanceId: string }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const { templates } = useWhatsAppTemplates();
  const sendMessage = useSendWhatsAppMessage();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!phone || !message) {
      toast({ title: 'Preencha telefone e mensagem', variant: 'destructive' });
      return;
    }
    try {
      await sendMessage.mutateAsync({ instanceId, phone: phone.replace(/\D/g, ''), message });
      toast({ title: 'Mensagem enviada!' });
      setOpen(false);
      setPhone('');
      setMessage('');
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Telefone (com DDD e código do país)</Label>
            <Input placeholder="5511999999999" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Usar Template</Label>
              <Select onValueChange={v => {
                const t = templates.find(t => t.id === v);
                if (t) setMessage(t.content);
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Digite sua mensagem..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={sendMessage.isPending}>
            {sendMessage.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
