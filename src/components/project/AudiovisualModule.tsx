import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Video, Camera, Film, FileVideo, Clapperboard, Settings } from 'lucide-react';
import { useProjectAudiovisual } from '@/hooks/useProjectModules';

interface AudiovisualModuleProps {
  projectId: string;
}

const videoTypeOptions = [
  { value: 'reels', label: 'Reels/Shorts' },
  { value: 'stories', label: 'Stories' },
  { value: 'youtube', label: 'Vídeos YouTube' },
  { value: 'ads', label: 'Anúncios em Vídeo' },
  { value: 'institutional', label: 'Institucional' },
  { value: 'product', label: 'Produto' },
  { value: 'testimonial', label: 'Depoimentos' },
  { value: 'tutorial', label: 'Tutorial/How-to' },
];

export function AudiovisualModule({ projectId }: AudiovisualModuleProps) {
  const { audiovisual, isLoading, upsertAudiovisual } = useProjectAudiovisual(projectId);
  
  const [formData, setFormData] = useState({
    video_types: [] as string[],
    production_notes: '',
    equipment_requirements: '',
    delivery_formats: '',
    style_references: '',
    script_notes: '',
  });

  // Sync form with data
  useEffect(() => {
    if (audiovisual) {
      setFormData({
        video_types: audiovisual.video_types || [],
        production_notes: audiovisual.production_notes || '',
        equipment_requirements: audiovisual.equipment_requirements || '',
        delivery_formats: audiovisual.delivery_formats || '',
        style_references: audiovisual.style_references || '',
        script_notes: audiovisual.script_notes || '',
      });
    }
  }, [audiovisual]);

  const handleToggleVideoType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      video_types: prev.video_types.includes(type)
        ? prev.video_types.filter(t => t !== type)
        : [...prev.video_types, type]
    }));
  };

  const handleSave = () => {
    upsertAudiovisual.mutate(formData);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-xl" />
      <div className="h-32 bg-muted rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Video Types */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-5 w-5 text-orange-500" />
            Tipos de Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {videoTypeOptions.map(type => (
              <label
                key={type.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  formData.video_types.includes(type.value)
                    ? 'bg-orange-500/20 border border-orange-500/40'
                    : 'bg-muted/50 border border-border/50 hover:bg-muted'
                }`}
              >
                <Checkbox
                  checked={formData.video_types.includes(type.value)}
                  onCheckedChange={() => handleToggleVideoType(type.value)}
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Production Notes & Equipment */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-blue-500" />
              Notas de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.production_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, production_notes: e.target.value }))}
              placeholder="Detalhes sobre a produção, locações, equipe necessária..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-500" />
              Equipamentos Necessários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.equipment_requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_requirements: e.target.value }))}
              placeholder="Câmeras, iluminação, áudio, acessórios..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delivery & Style */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileVideo className="h-5 w-5 text-purple-500" />
              Formatos de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.delivery_formats}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_formats: e.target.value }))}
              placeholder="Resoluções, formatos de arquivo, aspect ratios..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-5 w-5 text-pink-500" />
              Referências de Estilo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.style_references}
              onChange={(e) => setFormData(prev => ({ ...prev, style_references: e.target.value }))}
              placeholder="Links de referência, estilo visual, mood..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Script Notes */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-500" />
            Notas de Roteiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.script_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, script_notes: e.target.value }))}
            placeholder="Estrutura do roteiro, mensagens-chave, call to actions..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertAudiovisual.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {upsertAudiovisual.isPending ? 'Salvando...' : 'Salvar Audiovisual'}
        </Button>
      </div>
    </div>
  );
}
