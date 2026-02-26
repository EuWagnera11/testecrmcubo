import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Trash2, Loader2, Sparkles, Paperclip, FileText, Image, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAIChat, Attachment } from '@/hooks/useAIChat';
import { AIChatMessage } from './AIChatMessage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function AttachmentChip({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/');
  const Icon = isImage ? Image : isVideo ? Film : FileText;

  return (
    <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 text-xs max-w-[180px]">
      <Icon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{attachment.name}</span>
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground flex-shrink-0">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, uploadFile, clearChat } = useAIChat();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const msg = input.trim();
    if ((!msg && !attachments.length) || isLoading || isUploading) return;
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    await sendMessage(msg, currentAttachments.length ? currentAttachments : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} excede 10MB`);
          continue;
        }
        const attachment = await uploadFile(file);
        if (attachment) {
          setAttachments(prev => [...prev, attachment]);
        } else {
          toast.error(`Falha ao enviar ${file.name}`);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-cubo-gradient hover:opacity-90 transition-opacity pulse-glow"
        size="icon"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 left-3 h-[72dvh] max-h-[520px] sm:left-auto sm:bottom-4 sm:right-4 sm:w-[340px] sm:h-[500px] md:w-[380px] md:h-[540px] z-50 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-cubo-gradient text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">CUBO AI</h3>
            <p className="text-[10px] opacity-80">Assistente inteligente do CRM</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            title="Nova conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Olá! Sou o CUBO AI 👋</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Posso ajudar com projetos, clientes, financeiro, agenda e mais. Experimente:
            </p>
            <div className="space-y-2 w-full">
              {[
                '📊 "Quais projetos estão ativos?"',
                '👥 "Liste os clientes ativos"',
                '📅 "Quais eventos tenho hoje?"',
                '💰 "Qual o resumo financeiro do mês?"',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const text = suggestion.replace(/^[^\s]+ "/, '').replace(/"$/, '');
                    setInput(text);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <AIChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5 border-t">
          {attachments.map((att, i) => (
            <AttachmentChip
              key={i}
              attachment={att}
              onRemove={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={handleFileSelect}
        />
        <div className="flex items-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="h-10 w-10 rounded-xl flex-shrink-0 text-muted-foreground hover:text-foreground"
            title="Anexar arquivo"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[40px] max-h-[120px] resize-none text-sm flex-1"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!input.trim() && !attachments.length) || isLoading || isUploading}
            className="h-10 w-10 rounded-xl flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}