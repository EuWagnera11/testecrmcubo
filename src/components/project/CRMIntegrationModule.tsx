import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Database, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CRMIntegrationModule({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    crm_platform: '', integration_status: 'pending', api_endpoint: '',
    sync_frequency: 'daily', fields_mapped: '', notes: '',
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('project_crm_integration').select('*').eq('project_id', projectId).maybeSingle().then(({ data: row }) => {
      if (row) {
        setExistingId(row.id);
        setData({
          crm_platform: row.crm_platform || '', integration_status: row.integration_status || 'pending',
          api_endpoint: row.api_endpoint || '', sync_frequency: row.sync_frequency || 'daily',
          fields_mapped: row.fields_mapped || '', notes: row.notes || '',
        });
      }
    });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase.from('project_crm_integration').update(data).eq('id', existingId);
      } else {
        const { data: created } = await supabase.from('project_crm_integration').insert({ project_id: projectId, ...data }).select('id').single();
        if (created) setExistingId(created.id);
      }
      toast({ title: 'Integração CRM salva!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-600',
    active: 'bg-green-500/15 text-green-600',
    error: 'bg-red-500/15 text-red-600',
    paused: 'bg-gray-500/15 text-gray-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-500" />
          Integração CRM
          <Badge className={statusColors[data.integration_status] || ''}>
            {data.integration_status === 'active' ? 'Ativo' : data.integration_status === 'error' ? 'Erro' : data.integration_status === 'paused' ? 'Pausado' : 'Pendente'}
          </Badge>
        </h2>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Plataforma CRM</Label>
              <Input value={data.crm_platform} onChange={e => setData(d => ({ ...d, crm_platform: e.target.value }))} placeholder="HubSpot, RD Station, Pipedrive..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={data.integration_status} onValueChange={v => setData(d => ({ ...d, integration_status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Frequência de Sincronização</Label>
              <Select value={data.sync_frequency} onValueChange={v => setData(d => ({ ...d, sync_frequency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Tempo real</SelectItem>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Endpoint / API</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={data.api_endpoint} onChange={e => setData(d => ({ ...d, api_endpoint: e.target.value }))} placeholder="URL do endpoint..." />
              {data.api_endpoint && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={data.api_endpoint} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
            <div>
              <Label className="text-xs">Campos Mapeados</Label>
              <Textarea value={data.fields_mapped} onChange={e => setData(d => ({ ...d, fields_mapped: e.target.value }))} placeholder="nome → name, email → email..." rows={3} className="mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notas</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} placeholder="Observações sobre a integração..." rows={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
