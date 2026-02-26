import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Save, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function GMBModule({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    business_name: '', gmb_url: '', review_response_strategy: '',
    posting_schedule: '', keywords: '', categories: '',
    photos_notes: '', performance_notes: '',
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('project_gmb').select('*').eq('project_id', projectId).maybeSingle().then(({ data: row }) => {
      if (row) {
        setExistingId(row.id);
        setData({
          business_name: row.business_name || '', gmb_url: row.gmb_url || '',
          review_response_strategy: row.review_response_strategy || '',
          posting_schedule: row.posting_schedule || '', keywords: row.keywords || '',
          categories: row.categories || '', photos_notes: row.photos_notes || '',
          performance_notes: row.performance_notes || '',
        });
      }
    });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase.from('project_gmb').update(data).eq('id', existingId);
      } else {
        const { data: created } = await supabase.from('project_gmb').insert({ project_id: projectId, ...data }).select('id').single();
        if (created) setExistingId(created.id);
      }
      toast({ title: 'Google Meu Negócio salvo!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-500" />
          Google Meu Negócio
        </h2>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Informações do Negócio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={data.business_name} onChange={e => setData(d => ({ ...d, business_name: e.target.value }))} placeholder="Nome do negócio no Google" />
            <div className="flex gap-2">
              <Input value={data.gmb_url} onChange={e => setData(d => ({ ...d, gmb_url: e.target.value }))} placeholder="Link do perfil Google Meu Negócio" />
              {data.gmb_url && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={data.gmb_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
            <Input value={data.categories} onChange={e => setData(d => ({ ...d, categories: e.target.value }))} placeholder="Categorias do negócio" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">SEO Local / Keywords</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.keywords} onChange={e => setData(d => ({ ...d, keywords: e.target.value }))} placeholder="Palavras-chave para SEO local..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estratégia de Avaliações</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.review_response_strategy} onChange={e => setData(d => ({ ...d, review_response_strategy: e.target.value }))} placeholder="Como responder avaliações positivas e negativas..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cronograma de Posts</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.posting_schedule} onChange={e => setData(d => ({ ...d, posting_schedule: e.target.value }))} placeholder="Frequência e tipos de posts..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fotos</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.photos_notes} onChange={e => setData(d => ({ ...d, photos_notes: e.target.value }))} placeholder="Anotações sobre fotos, atualizações..." rows={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Performance</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.performance_notes} onChange={e => setData(d => ({ ...d, performance_notes: e.target.value }))} placeholder="Métricas, insights, ações..." rows={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
