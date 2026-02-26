import { useState } from 'react';
import { useWhatsAppTags } from '@/hooks/useWhatsAppTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export function WhatsAppTagManager() {
  const { tags, createTag, deleteTag } = useWhatsAppTags();
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    createTag.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('');
          setColor(TAG_COLORS[0]);
          toast.success('Tag criada');
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">Gerenciar Tags</p>

          <div className="flex gap-2">
            <Input
              placeholder="Nome da tag..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" className="h-8 px-2" onClick={handleCreate} disabled={!name.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-5 w-5 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between py-1">
                <Badge
                  variant="outline"
                  className="text-xs gap-1"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </Badge>
                <button
                  onClick={() => deleteTag.mutate(tag.id)}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tag criada</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
