import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSendWhatsAppMessage } from '@/hooks/useWhatsApp';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 13) {
    const rest = digits.slice(2);
    if (rest.startsWith('55') && (rest.length - 2 === 10 || rest.length - 2 === 11)) {
      digits = '55' + rest.slice(2);
    }
  }
  return digits;
}

export function WhatsAppNewChat({ instanceId }: { instanceId: string }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const sendMessage = useSendWhatsAppMessage();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!phone) {
      toast({ title: 'Preencha o telefone', variant: 'destructive' });
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    try {
      if (message.trim()) {
        // Has message: send via edge function (creates contact+conversation+message)
        await sendMessage.mutateAsync({ instanceId, phone: normalizedPhone, message });
        toast({ title: 'Mensagem enviada!' });
      } else {
        // No message: just create contact + conversation
        const { data: contact } = await supabase
          .from('whatsapp_contacts')
          .upsert({ phone: normalizedPhone, source: 'manual' }, { onConflict: 'phone' })
          .select('id')
          .single();

        if (contact) {
          await supabase
            .from('whatsapp_conversations')
            .upsert(
              {
                contact_id: contact.id,
                instance_id: instanceId,
                last_message_at: new Date().toISOString(),
                status: 'open',
              },
              { onConflict: 'contact_id,instance_id' }
            );
        }
        toast({ title: 'Conversa iniciada!' });
      }

      setOpen(false);
      setPhone('');
      setMessage('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
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
          <div className="space-y-2">
            <Label>Mensagem (opcional)</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Digite uma mensagem ou deixe vazio para apenas iniciar..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={sendMessage.isPending}>
            {sendMessage.isPending ? 'Iniciando...' : 'Iniciar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
