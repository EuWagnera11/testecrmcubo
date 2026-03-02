import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSendWhatsAppMessage, useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 13) {
    const rest = digits.slice(2);
    if (rest.startsWith('55') && (rest.length - 2 === 10 || rest.length - 2 === 11)) {
      digits = '55' + rest.slice(2);
    }
  }
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length === 0) return '';

  let d = digits;
  if (!d.startsWith('55') && d.length >= 3) d = '55' + d;
  if (d.startsWith('55') && d.length > 13) d = d.slice(0, 13);

  const country = d.slice(0, 2);
  const ddd = d.slice(2, 4);
  const rest = d.slice(4);

  let result = `+${country}`;
  if (ddd) result += ` (${ddd}`;
  if (rest.length > 0) result += `) ${rest.slice(0, 1)}`;
  if (rest.length > 1) result += ` ${rest.slice(1, 5)}`;
  if (rest.length > 5) result += `-${rest.slice(5, 9)}`;

  return result;
}

interface WhatsAppNewChatProps {
  onConversationCreated?: (id: string) => void;
}

export function WhatsAppNewChat({ onConversationCreated }: WhatsAppNewChatProps) {
  const [open, setOpen] = useState(false);
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [message, setMessage] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const sendMessage = useSendWhatsAppMessage();
  const { instances } = useWhatsAppInstances();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openInstances = instances.filter(i => i.status === 'open' || i.status === 'connected');

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    setPhoneDigits(digits);
    setPhoneDisplay(formatPhoneBR(digits));
  };

  const handleSend = async () => {
    if (!phoneDigits) {
      toast({ title: 'Preencha o telefone', variant: 'destructive' });
      return;
    }
    if (!selectedInstanceId) {
      toast({ title: 'Selecione uma instância', variant: 'destructive' });
      return;
    }

    const normalizedPhone = normalizePhone(phoneDigits);
    setIsCreating(true);

    try {
      // Upsert contact
      const { data: contact } = await supabase
        .from('whatsapp_contacts')
        .upsert({ phone: normalizedPhone, source: 'manual' }, { onConflict: 'phone' })
        .select('id')
        .single();

      if (!contact) throw new Error('Erro ao criar contato');

      // Upsert conversation
      const { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .upsert(
          {
            contact_id: contact.id,
            instance_id: selectedInstanceId,
            last_message_at: new Date().toISOString(),
            status: 'open',
          },
          { onConflict: 'contact_id,instance_id' }
        )
        .select('id')
        .single();

      if (!conversation) throw new Error('Erro ao criar conversa');

      // Send message if provided
      if (message.trim()) {
        await sendMessage.mutateAsync({ instanceId: selectedInstanceId, phone: normalizedPhone, message });
      }

      // Close modal and navigate immediately
      setOpen(false);
      setPhoneDigits('');
      setPhoneDisplay('');
      setMessage('');
      setSelectedInstanceId('');

      // Invalidate queries in background
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });

      // Navigate to the new conversation
      onConversationCreated?.(conversation.id);

      toast({ title: message.trim() ? 'Mensagem enviada!' : 'Conversa iniciada!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
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
            <Label>Instância WhatsApp</Label>
            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a instância..." />
              </SelectTrigger>
              <SelectContent>
                {openInstances.length === 0 && instances.length > 0 ? (
                  instances.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))
                ) : openInstances.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma instância configurada</div>
                ) : (
                  openInstances.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Telefone (com DDD)</Label>
            <Input
              placeholder="+55 (85) 9 9167-0420"
              value={phoneDisplay}
              onChange={e => handlePhoneChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem (opcional)</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Digite uma mensagem ou deixe vazio para apenas iniciar..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={isCreating || !selectedInstanceId}>
            {isCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Iniciando...</> : 'Iniciar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
