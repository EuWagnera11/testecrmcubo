import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialAdvisoryModuleProps {
  projectId: string;
}

export function FinancialAdvisoryModule({ projectId }: FinancialAdvisoryModuleProps) {
  const { toast } = useToast();
  const [data, setData] = useState({
    financial_goals: '',
    budget_analysis: '',
    investment_recommendations: '',
    cash_flow_notes: '',
    report_frequency: 'monthly',
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('project_financial_advisory').select('*').eq('project_id', projectId).maybeSingle().then(({ data: row }) => {
      if (row) {
        setExistingId(row.id);
        setData({
          financial_goals: row.financial_goals || '',
          budget_analysis: row.budget_analysis || '',
          investment_recommendations: row.investment_recommendations || '',
          cash_flow_notes: row.cash_flow_notes || '',
          report_frequency: row.report_frequency || 'monthly',
        });
      }
    });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await supabase.from('project_financial_advisory').update(data).eq('id', existingId);
      } else {
        const { data: created } = await supabase.from('project_financial_advisory').insert({ project_id: projectId, ...data }).select('id').single();
        if (created) setExistingId(created.id);
      }
      toast({ title: 'Assessoria financeira salva!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Assessoria Financeira
        </h2>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Objetivos Financeiros</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.financial_goals} onChange={e => setData(d => ({ ...d, financial_goals: e.target.value }))} placeholder="Metas de faturamento, margem de lucro..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Análise de Orçamento</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.budget_analysis} onChange={e => setData(d => ({ ...d, budget_analysis: e.target.value }))} placeholder="Distribuição de investimento, ROI esperado..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recomendações de Investimento</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.investment_recommendations} onChange={e => setData(d => ({ ...d, investment_recommendations: e.target.value }))} placeholder="Onde investir, realocação de budget..." rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fluxo de Caixa</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.cash_flow_notes} onChange={e => setData(d => ({ ...d, cash_flow_notes: e.target.value }))} placeholder="Anotações sobre fluxo de caixa..." rows={3} />
            <div className="mt-3">
              <Label className="text-xs">Frequência de Relatório</Label>
              <Select value={data.report_frequency} onValueChange={v => setData(d => ({ ...d, report_frequency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
