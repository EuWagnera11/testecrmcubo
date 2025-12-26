import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { EMOJI_OPTIONS } from '@/hooks/useMessageReactions';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <SmilePlus className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-lg hover:bg-muted rounded p-1 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
