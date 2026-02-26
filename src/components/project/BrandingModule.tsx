import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function BrandingModule({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    brand_voice: '', visual_identity_notes: '', positioning_statement: '',
    target_audience: '', competitors: '', brand_guidelines_url: '',
    color_palette: '', typography_notes: '',
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('project_branding').select('*').eq('project_id', projectId).maybeSingle().then(({ data: row }) => {
      if (row) {
        setExistingId(row.id);
        setData({
          brand_voice: row.brand_voice || '', visual_identity_notes: row.visual_identity_notes || '',
          positioning_statement: row.positioning_statement || '', target_audience: row.target_audience || '',
          competitors: row.competitors || '', brand_guidelines_url: row.brand_guidelines_url || '',
          color_palette: row.color_palette || '', typography_notes: row.typography_notes || '',
        });
      }
    });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase.from('project_branding').update(data).eq('id', existingId);
      } else {
        const { data: created } = await supabase.from('project_branding').insert({ project_id: projectId, ...data }).select('id').single();
        if (created) setExistingId(created.id);
      }
      toast({ title: 'Branding salvo!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Branding & Posicionamento
        </h2>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Posicionamento</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.positioning_statement} onChange={e => setData(d => ({ ...d, positioning_statement: e.target.value }))} placeholder="Declaração de posicionamento da marca..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tom de Voz</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.brand_voice} onChange={e => setData(d => ({ ...d, brand_voice: e.target.value }))} placeholder="Como a marca se comunica..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Público-Alvo</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.target_audience} onChange={e => setData(d => ({ ...d, target_audience: e.target.value }))} placeholder="Personas, demografia, comportamento..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Concorrentes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.competitors} onChange={e => setData(d => ({ ...d, competitors: e.target.value }))} placeholder="Análise de concorrentes..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Identidade Visual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Paleta de Cores</Label>
              <Input value={data.color_palette} onChange={e => setData(d => ({ ...d, color_palette: e.target.value }))} placeholder="#FF0000, #00FF00, #0000FF" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tipografia</Label>
              <Input value={data.typography_notes} onChange={e => setData(d => ({ ...d, typography_notes: e.target.value }))} placeholder="Fontes principais e secundárias" className="mt-1" />
            </div>
            <Textarea value={data.visual_identity_notes} onChange={e => setData(d => ({ ...d, visual_identity_notes: e.target.value }))} placeholder="Notas sobre identidade visual..." rows={2} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Brand Guidelines</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={data.brand_guidelines_url} onChange={e => setData(d => ({ ...d, brand_guidelines_url: e.target.value }))} placeholder="Link do manual de marca..." />
              {data.brand_guidelines_url && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={data.brand_guidelines_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
