import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, Palette, FileText, Users, Video } from 'lucide-react';

interface ProjectTypeSelectorProps {
  selectedTypes: string[];
  onToggle: (type: string) => void;
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

export function ProjectTypeSelector({ selectedTypes, onToggle }: ProjectTypeSelectorProps) {
  return (
    <div className="space-y-2">
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
  );
}
