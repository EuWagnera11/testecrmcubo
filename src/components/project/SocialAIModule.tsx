import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Bot, MessageSquare, Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SocialAIModule({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    auto_reply_comments: false, auto_reply_dms: false,
    ai_tone: 'professional', ai_instructions: '',
    excluded_keywords: '', response_delay_minutes: 5,
    instagram_token: '', facebook_token: '',
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('project_social_ai').select('*').eq('project_id', projectId).maybeSingle().then(({ data: row }) => {
      if (row) {
        setExistingId(row.id);
        setData({
          auto_reply_comments: row.auto_reply_comments ?? false,
          auto_reply_dms: row.auto_reply_dms ?? false,
          ai_tone: row.ai_tone || 'professional',
          ai_instructions: row.ai_instructions || '',
          excluded_keywords: row.excluded_keywords || '',
          response_delay_minutes: row.response_delay_minutes ?? 5,
          instagram_token: row.instagram_token || '',
          facebook_token: row.facebook_token || '',
        });
      }
    });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase.from('project_social_ai').update(data).eq('id', existingId);
      } else {
        const { data: created } = await supabase.from('project_social_ai').insert({ project_id: projectId, ...data }).select('id').single();
        if (created) setExistingId(created.id);
      }
      toast({ title: 'Social Media IA salvo!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-500" />
          Social Media com IA
        </h2>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Respostas Automáticas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label>Responder Comentários</Label>
              </div>
              <Switch checked={data.auto_reply_comments} onCheckedChange={v => setData(d => ({ ...d, auto_reply_comments: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-muted-foreground" />
                <Label>Responder DMs</Label>
              </div>
              <Switch checked={data.auto_reply_dms} onCheckedChange={v => setData(d => ({ ...d, auto_reply_dms: v }))} />
            </div>
            <div>
              <Label className="text-xs">Delay de Resposta (minutos)</Label>
              <Input type="number" value={data.response_delay_minutes} onChange={e => setData(d => ({ ...d, response_delay_minutes: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Configuração da IA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Tom de Voz</Label>
              <Select value={data.ai_tone} onValueChange={v => setData(d => ({ ...d, ai_tone: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="humorous">Bem-humorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Instruções para a IA</Label>
              <Textarea value={data.ai_instructions} onChange={e => setData(d => ({ ...d, ai_instructions: e.target.value }))} placeholder="Ex: Sempre mencionar o nome da clínica, não falar de preço..." rows={4} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Palavras-chave Excluídas (não responder)</Label>
              <Input value={data.excluded_keywords} onChange={e => setData(d => ({ ...d, excluded_keywords: e.target.value }))} placeholder="spam, concorrente, reclamação..." className="mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tokens de Acesso</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Token Instagram</Label>
              <Input type="password" value={data.instagram_token} onChange={e => setData(d => ({ ...d, instagram_token: e.target.value }))} placeholder="Token de acesso do Instagram" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Token Facebook</Label>
              <Input type="password" value={data.facebook_token} onChange={e => setData(d => ({ ...d, facebook_token: e.target.value }))} placeholder="Token de acesso do Facebook" className="mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
