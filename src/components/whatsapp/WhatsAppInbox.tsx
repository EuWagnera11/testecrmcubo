import { useState, useRef, useEffect } from 'react';
import { useWhatsAppConversations, useWhatsAppMessages, useWhatsAppInstances, useSendWhatsAppMessage, useMarkConversationRead, WhatsAppConversation, WhatsAppContact } from '@/hooks/useWhatsApp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, Phone, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppNewChat } from './WhatsAppNewChat';

export function WhatsAppInbox() {
  const { instances } = useWhatsAppInstances();
  const activeInstanceId = instances?.[0]?.id;
  const { conversations, isLoading } = useWhatsAppConversations(activeInstanceId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const filteredConversations = conversations.filter(c => {
    const name = c.contact?.name || c.contact?.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {activeInstanceId && <WhatsAppNewChat instanceId={activeInstanceId} />}
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {instances.length === 0 ? 'Configure uma conexão primeiro' : 'Nenhuma conversa'}
            </div>
          ) : (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={selectedConversation === conv.id}
                onClick={() => setSelectedConversation(conv.id)}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <ChatArea conversation={selectedConv} instanceId={activeInstanceId!} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto opacity-30" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  isActive: boolean;
  onClick: () => void;
}) {
  const name = conversation.contact?.name || conversation.contact?.phone || 'Desconhecido';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50',
        isActive && 'bg-accent'
      )}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">{name}</span>
          {conversation.last_message_at && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(conversation.last_message_at), 'HH:mm', { locale: ptBR })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">
            {conversation.contact?.phone}
          </span>
          {conversation.unread_count > 0 && (
            <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatArea({
  conversation,
  instanceId,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  instanceId: string;
}) {
  const { messages, isLoading } = useWhatsAppMessages(conversation.id);
  const sendMessage = useSendWhatsAppMessage();
  const markRead = useMarkConversationRead();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const name = conversation.contact?.name || conversation.contact?.phone || 'Desconhecido';

  useEffect(() => {
    if (conversation.unread_count > 0) {
      markRead.mutate(conversation.id);
    }
  }, [conversation.id, conversation.unread_count]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate({
      instanceId,
      phone: conversation.contact.phone,
      message: input.trim(),
    });
    setInput('');
  };

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {conversation.contact?.phone}
          </p>
        </div>
        {conversation.assigned_to && (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Atribuído
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm">Nenhuma mensagem ainda</div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[70%] rounded-xl px-3 py-2',
                msg.sender_type === 'agent'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
              <p className={cn(
                'text-[10px] mt-1',
                msg.sender_type === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {format(new Date(msg.created_at), 'HH:mm')}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
