import { useWhatsAppTags, useConversationTags } from '@/hooks/useWhatsAppTags';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  conversationId: string;
}

export function WhatsAppConversationTagSelector({ conversationId }: Props) {
  const { tags } = useWhatsAppTags();
  const { conversationTags, addTag, removeTag } = useConversationTags(conversationId);

  const activeTagIds = new Set(conversationTags.map(ct => ct.tag_id));

  const toggle = (tagId: string) => {
    if (activeTagIds.has(tagId)) {
      removeTag.mutate({ conversationId, tagId });
    } else {
      addTag.mutate({ conversationId, tagId });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Tag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium mb-2">Tags da conversa</p>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">Crie tags na aba de gerenciamento</p>
          ) : (
            tags.map(tag => {
              const isActive = activeTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent',
                    isActive && 'bg-accent'
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ConversationTagBadges({ tags }: { tags: Array<{ id: string; name: string; color: string }> }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-0.5">
      {tags.slice(0, 3).map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] font-medium leading-4"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
          }}
        >
          {tag.name}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-[9px] text-muted-foreground">+{tags.length - 3}</span>
      )}
    </div>
  );
}
