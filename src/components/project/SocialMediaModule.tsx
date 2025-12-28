import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, Users, Hash, MessageSquare, Target, Mic2 } from 'lucide-react';
import { useProjectSocialMedia } from '@/hooks/useProjectModules';

interface SocialMediaModuleProps {
  projectId: string;
}

const platformOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
];

export function SocialMediaModule({ projectId }: SocialMediaModuleProps) {
  const { socialMedia, isLoading, upsertSocialMedia } = useProjectSocialMedia(projectId);
  
  const [formData, setFormData] = useState({
    platforms: [] as string[],
    posting_frequency: '',
    content_pillars: '',
    brand_voice: '',
    hashtag_strategy: '',
    engagement_goals: '',
  });

  // Sync form with data
  useState(() => {
    if (socialMedia) {
      setFormData({
        platforms: socialMedia.platforms || [],
        posting_frequency: socialMedia.posting_frequency || '',
        content_pillars: socialMedia.content_pillars || '',
        brand_voice: socialMedia.brand_voice || '',
        hashtag_strategy: socialMedia.hashtag_strategy || '',
        engagement_goals: socialMedia.engagement_goals || '',
      });
    }
  });

  const handleTogglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSave = () => {
    upsertSocialMedia.mutate(formData);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-xl" />
      <div className="h-32 bg-muted rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Platforms */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Plataformas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map(platform => (
              <label
                key={platform.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  formData.platforms.includes(platform.value)
                    ? 'bg-purple-500/20 border border-purple-500/40'
                    : 'bg-muted/50 border border-border/50 hover:bg-muted'
                }`}
              >
                <Checkbox
                  checked={formData.platforms.includes(platform.value)}
                  onCheckedChange={() => handleTogglePlatform(platform.value)}
                />
                <span className="text-sm">{platform.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting & Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Frequência de Postagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={formData.posting_frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, posting_frequency: e.target.value }))}
              placeholder="Ex: 3x por semana no Instagram, 1x por dia no Stories"
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Metas de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={formData.engagement_goals}
              onChange={(e) => setFormData(prev => ({ ...prev, engagement_goals: e.target.value }))}
              placeholder="Ex: Aumentar engajamento em 20%, 500 novos seguidores/mês"
            />
          </CardContent>
        </Card>
      </div>

      {/* Content Strategy */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-orange-500" />
            Pilares de Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.content_pillars}
            onChange={(e) => setFormData(prev => ({ ...prev, content_pillars: e.target.value }))}
            placeholder="Descreva os principais pilares de conteúdo da marca..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Brand Voice */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-pink-500" />
            Tom de Voz da Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.brand_voice}
            onChange={(e) => setFormData(prev => ({ ...prev, brand_voice: e.target.value }))}
            placeholder="Descreva o tom de voz, personalidade e estilo de comunicação..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Hashtag Strategy */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-5 w-5 text-cyan-500" />
            Estratégia de Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.hashtag_strategy}
            onChange={(e) => setFormData(prev => ({ ...prev, hashtag_strategy: e.target.value }))}
            placeholder="Liste hashtags principais, secundárias e de nicho..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertSocialMedia.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {upsertSocialMedia.isPending ? 'Salvando...' : 'Salvar Social Media'}
        </Button>
      </div>
    </div>
  );
}
