import { cn } from '@/lib/utils';

interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
}

export const MessageReactions = ({ reactions, onToggle }: MessageReactionsProps) => {
  if (!reactions.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
            hasReacted 
              ? "bg-primary/20 text-primary border border-primary/30" 
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <span>{emoji}</span>
          <span className="text-[10px]">{count}</span>
        </button>
      ))}
    </div>
  );
};
