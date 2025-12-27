import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCampaignMetrics, CampaignMetric } from '@/hooks/useCampaigns';

interface FacebookMetricsImportProps {
  campaignId: string;
  onImportComplete: () => void;
}

// Expected Facebook Ads Manager columns (in Portuguese and English)
const COLUMN_MAP: Record<string, keyof CampaignMetric> = {
  // Portuguese
  'data': 'date',
  'impressões': 'impressions',
  'impressoes': 'impressions',
  'alcance': 'reach',
  'cliques': 'clicks',
  'cliques no link': 'clicks',
  'ctr': 'ctr',
  'ctr (cliques no link)': 'ctr',
  'cpc': 'cpc',
  'cpc (custo por clique no link)': 'cpc',
  'cpm': 'cpm',
  'valor gasto': 'spend',
  'custo': 'spend',
  'conversões': 'conversions',
  'conversoes': 'conversions',
  'resultados': 'conversions',
  'custo por resultado': 'cost_per_conversion',
  'custo por conversão': 'cost_per_conversion',
  'leads': 'leads',
  'cadastros': 'leads',
  'custo por lead': 'cost_per_lead',
  'custo por cadastro': 'cost_per_lead',
  'roas': 'roas',
  'retorno sobre gasto com anúncio': 'roas',
  'receita': 'revenue',
  'valor de conversão': 'revenue',
  // English
  'date': 'date',
  'impressions': 'impressions',
  'reach': 'reach',
  'clicks': 'clicks',
  'link clicks': 'clicks',
  'ctr (link click-through rate)': 'ctr',
  'cpc (cost per link click)': 'cpc',
  'cost per 1,000 impressions': 'cpm',
  'amount spent': 'spend',
  'cost': 'spend',
  'conversions': 'conversions',
  'results': 'conversions',
  'cost per result': 'cost_per_conversion',
  'cost per conversion': 'cost_per_conversion',
  'cost per lead': 'cost_per_lead',
  'return on ad spend': 'roas',
  'revenue': 'revenue',
  'conversion value': 'revenue',
};

function parseDate(dateStr: string): string | null {
  // Try common date formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year: string, month: string, day: string;
      
      if (format.source.startsWith('^(\\d{4})')) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

function parseNumber(value: string): number {
  if (!value || value.trim() === '' || value === '-') return 0;
  
  // Remove currency symbols, spaces, and handle different formats
  let cleaned = value
    .replace(/[R$€£¥\s]/g, '')
    .replace(/[a-zA-Z]/g, '')
    .trim();
  
  // Handle percentage
  if (value.includes('%')) {
    cleaned = cleaned.replace('%', '');
  }
  
  // Handle different decimal separators
  // If has both comma and dot, determine which is decimal
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // If comma comes after dot, comma is decimal (1.234,56)
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal (1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Only comma - could be decimal or thousands
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal (1234,56)
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousands (1,234,567)
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function FacebookMetricsImport({ campaignId, onImportComplete }: FacebookMetricsImportProps) {
  const { addMetric } = useCampaignMetrics(campaignId);
  const [open, setOpen] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    rows: Partial<CampaignMetric>[];
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = () => {
    const lines = pastedData.trim().split('\n');
    if (lines.length < 2) {
      setParseResult({ success: false, rows: [], errors: ['Cole pelo menos um cabeçalho e uma linha de dados'] });
      return;
    }

    // Parse header - detect separator (tab, comma, semicolon)
    const headerLine = lines[0];
    let separator = '\t';
    if (!headerLine.includes('\t')) {
      if (headerLine.includes(';')) {
        separator = ';';
      } else if (headerLine.includes(',')) {
        separator = ',';
      }
    }

    const headers = headerLine.toLowerCase().split(separator).map(h => h.trim());
    const columnIndices: Record<keyof CampaignMetric, number> = {} as any;

    // Map headers to our columns
    headers.forEach((header, index) => {
      const mappedColumn = COLUMN_MAP[header];
      if (mappedColumn) {
        columnIndices[mappedColumn] = index;
      }
    });

    // Check if we have required columns
    if (columnIndices.date === undefined) {
      setParseResult({ 
        success: false, 
        rows: [], 
        errors: ['Coluna de data não encontrada. Certifique-se de incluir uma coluna "Data" ou "Date".'] 
      });
      return;
    }

    const rows: Partial<CampaignMetric>[] = [];
    const errors: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(separator).map(v => v.trim());
      
      const dateStr = values[columnIndices.date];
      const parsedDate = parseDate(dateStr);
      
      if (!parsedDate) {
        errors.push(`Linha ${i + 1}: formato de data inválido "${dateStr}"`);
        continue;
      }

      const row: Partial<CampaignMetric> = {
        campaign_id: campaignId,
        date: parsedDate,
        impressions: columnIndices.impressions !== undefined ? parseNumber(values[columnIndices.impressions]) : 0,
        reach: columnIndices.reach !== undefined ? parseNumber(values[columnIndices.reach]) : 0,
        clicks: columnIndices.clicks !== undefined ? parseNumber(values[columnIndices.clicks]) : 0,
        ctr: columnIndices.ctr !== undefined ? parseNumber(values[columnIndices.ctr]) : 0,
        cpc: columnIndices.cpc !== undefined ? parseNumber(values[columnIndices.cpc]) : 0,
        cpm: columnIndices.cpm !== undefined ? parseNumber(values[columnIndices.cpm]) : 0,
        spend: columnIndices.spend !== undefined ? parseNumber(values[columnIndices.spend]) : 0,
        conversions: columnIndices.conversions !== undefined ? parseNumber(values[columnIndices.conversions]) : 0,
        cost_per_conversion: columnIndices.cost_per_conversion !== undefined ? parseNumber(values[columnIndices.cost_per_conversion]) : 0,
        leads: columnIndices.leads !== undefined ? parseNumber(values[columnIndices.leads]) : 0,
        cost_per_lead: columnIndices.cost_per_lead !== undefined ? parseNumber(values[columnIndices.cost_per_lead]) : 0,
        roas: columnIndices.roas !== undefined ? parseNumber(values[columnIndices.roas]) : 0,
        revenue: columnIndices.revenue !== undefined ? parseNumber(values[columnIndices.revenue]) : 0,
      };

      rows.push(row);
    }

    setParseResult({ success: rows.length > 0, rows, errors });
  };

  const handleImport = async () => {
    if (!parseResult?.rows.length) return;

    setIsImporting(true);
    try {
      for (const row of parseResult.rows) {
        await addMetric.mutateAsync(row as any);
      }
      onImportComplete();
      setOpen(false);
      setPastedData('');
      setParseResult(null);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const exampleData = `Data\tImpressões\tCliques\tCTR\tCPC\tValor Gasto\tConversões
27/12/2024\t15000\t450\t3.00%\tR$ 1.50\tR$ 675.00\t12
26/12/2024\t12500\t380\t3.04%\tR$ 1.45\tR$ 551.00\t10`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar do Facebook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Métricas do Facebook Ads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Copy className="h-4 w-4" />
            <AlertDescription>
              <p className="mb-2">
                <strong>Como importar:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Abra o Gerenciador de Anúncios do Facebook</li>
                <li>Selecione as colunas que deseja exportar</li>
                <li>Selecione as linhas de dados (incluindo o cabeçalho)</li>
                <li>Copie (Ctrl+C) e cole abaixo (Ctrl+V)</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Cole os dados aqui:</label>
            <Textarea
              value={pastedData}
              onChange={(e) => {
                setPastedData(e.target.value);
                setParseResult(null);
              }}
              placeholder="Cole os dados copiados do Facebook Ads Manager..."
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver exemplo de formato aceito
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-xs">
              {exampleData}
            </pre>
          </details>

          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!pastedData.trim()}>
              Analisar Dados
            </Button>
          </div>

          {parseResult && (
            <div className="space-y-3">
              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {parseResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.rows.length > 0 && (
                <>
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {parseResult.rows.length} linha(s) prontas para importar
                    </AlertDescription>
                  </Alert>

                  <div className="overflow-x-auto max-h-48 border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Data</th>
                          <th className="px-2 py-1 text-right">Impr.</th>
                          <th className="px-2 py-1 text-right">Cliques</th>
                          <th className="px-2 py-1 text-right">CTR</th>
                          <th className="px-2 py-1 text-right">Gasto</th>
                          <th className="px-2 py-1 text-right">Conv.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.rows.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{row.date}</td>
                            <td className="px-2 py-1 text-right">{row.impressions?.toLocaleString('pt-BR')}</td>
                            <td className="px-2 py-1 text-right">{row.clicks?.toLocaleString('pt-BR')}</td>
                            <td className="px-2 py-1 text-right">{row.ctr}%</td>
                            <td className="px-2 py-1 text-right">{row.spend?.toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">{row.conversions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? 'Importando...' : `Importar ${parseResult.rows.length} linha(s)`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
