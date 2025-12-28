import { useState, useEffect } from 'react';
import { 
  Lightbulb, Users, Zap, ExternalLink, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProjectStrategy } from '@/hooks/useProjectModules';

interface StrategyModuleProps {
  projectId: string;
}

export function StrategyModule({ projectId }: StrategyModuleProps) {
  const { strategy, isLoading, upsertStrategy } = useProjectStrategy(projectId);

  const [form, setForm] = useState({
    offer_big_idea: '',
    personas: '',
    funnel_structure: '',
    landing_page_url: '',
    landing_page_test_url: '',
  });

  useEffect(() => {
    if (strategy) {
      setForm({
        offer_big_idea: strategy.offer_big_idea || '',
        personas: strategy.personas || '',
        funnel_structure: strategy.funnel_structure || '',
        landing_page_url: strategy.landing_page_url || '',
        landing_page_test_url: strategy.landing_page_test_url || '',
      });
    }
  }, [strategy]);

  const handleSave = () => {
    upsertStrategy.mutate(form);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              A Oferta (Big Idea)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.offer_big_idea}
              onChange={(e) => setForm(prev => ({ ...prev, offer_big_idea: e.target.value }))}
              placeholder="Resuma a proposta de valor em uma frase clara..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Público-Alvo / Personas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.personas}
              onChange={(e) => setForm(prev => ({ ...prev, personas: e.target.value }))}
              placeholder="Descreva o público-alvo, dores, desejos..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Estrutura / Jornada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={form.funnel_structure}
            onChange={(e) => setForm(prev => ({ ...prev, funnel_structure: e.target.value }))}
            placeholder="Descreva a jornada do cliente ou estrutura do projeto..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Link Principal</Label>
              <div className="flex gap-2">
                <Input
                  value={form.landing_page_url}
                  onChange={(e) => setForm(prev => ({ ...prev, landing_page_url: e.target.value }))}
                  placeholder="https://..."
                />
                {form.landing_page_url && (
                  <Button size="icon" variant="ghost" asChild>
                    <a href={form.landing_page_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link de Teste</Label>
              <div className="flex gap-2">
                <Input
                  value={form.landing_page_test_url}
                  onChange={(e) => setForm(prev => ({ ...prev, landing_page_test_url: e.target.value }))}
                  placeholder="https://..."
                />
                {form.landing_page_test_url && (
                  <Button size="icon" variant="ghost" asChild>
                    <a href={form.landing_page_test_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsertStrategy.isPending}>
        <Save className="h-4 w-4 mr-2" /> Salvar Estratégia
      </Button>
    </div>
  );
}
