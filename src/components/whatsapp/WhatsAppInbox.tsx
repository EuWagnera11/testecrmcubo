import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useWhatsAppConversations,
  useWhatsAppMessages,
  useWhatsAppInstances,
  useSendWhatsAppMessage,
  useMarkConversationRead,
  useWhatsAppUnreadCounts,
  useTakeOverConversation,
  useToggleBot,
  WhatsAppConversation,
  WhatsAppContact,
  WhatsAppInstance,
} from '@/hooks/useWhatsApp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, Phone, User, MessageSquare, Inbox, ArrowLeft, Bot, UserCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppNewChat } from './WhatsAppNewChat';
import { WhatsAppTagManager } from './WhatsAppTagManager';
import { WhatsAppConversationTagSelector, ConversationTagBadges } from './WhatsAppConversationTagSelector';
import { useAllConversationTags } from '@/hooks/useWhatsAppTags';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const INSTANCE_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
];

function getInstanceColor(index: number) {
  return INSTANCE_COLORS[index % INSTANCE_COLORS.length];
}

export function WhatsAppInbox() {
  const { instances } = useWhatsAppInstances();
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const { data: unreadCounts } = useWhatsAppUnreadCounts();

  const filterInstanceId = activeInstanceId ?? undefined;
  const { conversations, isLoading } = useWhatsAppConversations(filterInstanceId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isUnified = activeInstanceId === null;
  const { data: allConversationTags } = useAllConversationTags();

  const instanceMap = useMemo(() => {
    const map: Record<string, { instance: WhatsAppInstance; colorIndex: number }> = {};
    instances.forEach((inst, i) => {
      map[inst.id] = { instance: inst, colorIndex: i };
    });
    return map;
  }, [instances]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const selectedInstance = selectedConv ? instanceMap[selectedConv.instance_id] : undefined;

  const filteredConversations = conversations.filter(c => {
    const name = c.contact?.name || c.contact?.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalUnread = useMemo(() => {
    if (!unreadCounts) return 0;
    return Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  }, [unreadCounts]);

  useEffect(() => {
    setSelectedConversation(null);
  }, [activeInstanceId]);

  const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col",
        showChat && "hidden md:flex"
      )}>
        {/* Instance selector */}
        {instances.length > 1 && (
          <div className="p-2 border-b">
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-1">
                <button
                  onClick={() => setActiveInstanceId(null)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                    isUnified
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Inbox className="h-3 w-3" />
                  Todas
                  {totalUnread > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px] ml-0.5">
                      {totalUnread}
                    </Badge>
                  )}
                </button>

                {instances.map((inst, idx) => {
                  const count = unreadCounts?.[inst.id] || 0;
                  const isActive = activeInstanceId === inst.id;
                  return (
                    <button
                      key={inst.id}
                      onClick={() => setActiveInstanceId(inst.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', getInstanceColor(idx))} />
                      {inst.name}
                      {count > 0 && (
                        <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px] ml-0.5">
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

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
          <div className="flex gap-2">
            {(activeInstanceId || instances?.[0]?.id) && (
              <WhatsAppNewChat instanceId={activeInstanceId || instances[0].id} />
            )}
            <WhatsAppTagManager />
          </div>
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
                onClick={() => {
                  setSelectedConversation(conv.id);
                  setShowChat(true);
                }}
                showInstanceBadge={isUnified}
                instanceInfo={instanceMap[conv.instance_id]}
                tags={allConversationTags?.[conv.id] ?? []}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !showChat && "hidden md:flex"
      )}>
        {selectedConv ? (
          <ChatArea
            conversation={selectedConv}
            instanceId={selectedConv.instance_id}
            instanceName={selectedInstance?.instance.name}
            instanceColorIndex={selectedInstance?.colorIndex ?? 0}
            onBack={() => setShowChat(false)}
          />
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
  showInstanceBadge,
  instanceInfo,
  tags,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  isActive: boolean;
  onClick: () => void;
  showInstanceBadge?: boolean;
  instanceInfo?: { instance: WhatsAppInstance; colorIndex: number };
  tags?: Array<{ id: string; name: string; color: string }>;
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
      <div className="relative">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
        {conversation.is_bot_active && (
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-violet-500 flex items-center justify-center">
            <Bot className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">{name}</span>
          {conversation.last_message_at && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(conversation.last_message_at), 'HH:mm', { locale: ptBR })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {showInstanceBadge && instanceInfo && (
              <span className={cn('h-2 w-2 rounded-full flex-shrink-0', getInstanceColor(instanceInfo.colorIndex))} />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {conversation.last_message_preview || conversation.contact?.phone}
            </span>
          </div>
          {conversation.unread_count > 0 && (
            <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
        <ConversationTagBadges tags={tags ?? []} />
      </div>
    </button>
  );
}

function ChatArea({
  conversation,
  instanceId,
  instanceName,
  instanceColorIndex,
  onBack,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  instanceId: string;
  instanceName?: string;
  instanceColorIndex: number;
  onBack?: () => void;
}) {
  const { messages, isLoading } = useWhatsAppMessages(conversation.id);
  const sendMessage = useSendWhatsAppMessage();
  const markRead = useMarkConversationRead();
  const takeOver = useTakeOverConversation();
  const toggleBot = useToggleBot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);
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

  const handleTakeOver = () => {
    takeOver.mutate(conversation.id);
  };

  const handleToggleBot = () => {
    toggleBot.mutate({ conversationId: conversation.id, active: !conversation.is_bot_active });
  };

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
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
        <div className="flex items-center gap-2">
          {conversation.is_bot_active ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-violet-300 text-violet-600 hover:bg-violet-50" onClick={handleTakeOver}>
                  <Bot className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Bot ativo</span>
                  <UserCheck className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Assumir conversa (desativar bot)</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleToggleBot}>
                  <Bot className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ativar bot</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reativar bot para esta conversa</TooltipContent>
            </Tooltip>
          )}

          {conversation.ai_summary && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showSummary ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSummary(!showSummary)}
                >
                  <Sparkles className="h-4 w-4 text-violet-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resumo IA</TooltipContent>
            </Tooltip>
          )}

          {instanceName && (
            <Badge variant="outline" className="gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', getInstanceColor(instanceColorIndex))} />
              {instanceName}
            </Badge>
          )}
          {conversation.assigned_to && (
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              Atribuído
            </Badge>
          )}
          <WhatsAppConversationTagSelector conversationId={conversation.id} />
        </div>
      </div>

      {/* AI Summary panel */}
      {showSummary && conversation.ai_summary && (
        <div className="px-4 py-3 border-b bg-violet-50 dark:bg-violet-950/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Resumo IA</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{conversation.ai_summary}</p>
              {conversation.ai_summary_at && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Atualizado em {format(new Date(conversation.ai_summary_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm">Nenhuma mensagem ainda</div>
        ) : (
          messages.map(msg => {
            const isBot = msg.sender_type === 'bot';
            const isAgent = msg.sender_type === 'agent';
            const isOutgoing = isBot || isAgent;

            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[70%] rounded-xl px-3 py-2',
                  isBot
                    ? 'ml-auto bg-violet-500 text-white'
                    : isAgent
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted'
                )}
              >
                {isBot && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <Bot className="h-3 w-3" />
                    <span className="text-[10px] font-medium opacity-80">Bot</span>
                  </div>
                )}
                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                <p className={cn(
                  'text-[10px] mt-1',
                  isOutgoing ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            );
          })
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
