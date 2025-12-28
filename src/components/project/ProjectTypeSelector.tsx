import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TrendingUp, Palette, FileText, Users, Video, RefreshCw } from 'lucide-react';

interface ProjectTypeSelectorProps {
  selectedTypes: string[];
  onToggle: (type: string) => void;
  billingType?: 'one_time' | 'recurring';
  onBillingTypeChange?: (type: 'one_time' | 'recurring') => void;
}

const projectTypes = [
  { 
    value: 'traffic', 
    label: 'Tráfego Pago', 
    icon: TrendingUp, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    description: 'Gestão de anúncios pagos, métricas e otimização'
  },
  { 
    value: 'design', 
    label: 'Design', 
    icon: Palette, 
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 border-pink-500/30',
    description: 'Criação de peças visuais e identidade'
  },
  { 
    value: 'copy', 
    label: 'Copywriting', 
    icon: FileText, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Textos persuasivos e conteúdo escrito'
  },
  { 
    value: 'social_media', 
    label: 'Social Media', 
    icon: Users, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Gestão de redes sociais e engajamento'
  },
  { 
    value: 'audiovisual', 
    label: 'Audiovisual', 
    icon: Video, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    description: 'Produção de vídeos e conteúdo audiovisual'
  },
];

export function ProjectTypeSelector({ selectedTypes, onToggle, billingType = 'one_time', onBillingTypeChange }: ProjectTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Billing Type Toggle */}
      {onBillingTypeChange && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
          <Label className="text-sm font-medium mb-2 block">Modelo de Cobrança</Label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
                billingType === 'one_time'
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-background border-border/50 hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="billing_type"
                value="one_time"
                checked={billingType === 'one_time'}
                onChange={() => onBillingTypeChange('one_time')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                billingType === 'one_time' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {billingType === 'one_time' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm font-medium">Projeto Único</span>
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
                billingType === 'recurring'
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-background border-border/50 hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="billing_type"
                value="recurring"
                checked={billingType === 'recurring'}
                onChange={() => onBillingTypeChange('recurring')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                billingType === 'recurring' ? 'border-cyan-500' : 'border-muted-foreground'
              }`}>
                {billingType === 'recurring' && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
              </div>
              <RefreshCw className={`h-3.5 w-3.5 ${billingType === 'recurring' ? 'text-cyan-500' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Mensal/Recorrente</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {billingType === 'one_time' 
              ? 'Projeto com valor único, pagamento avulso' 
              : 'Projeto com cobrança mensal recorrente'}
          </p>
        </div>
      )}

      {/* Project Types */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipos de Serviço</Label>
        {projectTypes.map(type => {
          const IconComponent = type.icon;
          const isSelected = selectedTypes.includes(type.value);
          
          return (
            <label
              key={type.value}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? type.bgColor
                  : 'bg-muted/30 border-border/50 hover:bg-muted/50'
              }`}
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(type.value)}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${type.color}`} />
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
