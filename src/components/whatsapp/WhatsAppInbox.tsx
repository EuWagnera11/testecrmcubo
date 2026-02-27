import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useWhatsAppConversations,
  useWhatsAppMessages,
  useWhatsAppInstances,
  useSendWhatsAppMessage,
  useMarkConversationRead,
  useWhatsAppUnreadCounts,
  useTakeOverConversation,
  useResolveConversation,
  WhatsAppConversation,
  WhatsAppContact,
  WhatsAppInstance,
} from '@/hooks/useWhatsApp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, Phone, MessageSquare, Inbox, ArrowLeft, Bot, UserCheck, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppNewChat } from './WhatsAppNewChat';
import { WhatsAppTagManager } from './WhatsAppTagManager';
import { WhatsAppConversationTagSelector, ConversationTagBadges } from './WhatsAppConversationTagSelector';
import { useAllConversationTags } from '@/hooks/useWhatsAppTags';
import { WhatsAppContactPanel } from './WhatsAppContactPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickReplies, replaceVariables } from '@/hooks/useQuickReplies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

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

type ConversationFilter = 'all' | 'waiting' | 'attending' | 'resolved';

function getConversationStatus(conv: WhatsAppConversation): ConversationFilter {
  if (conv.status === 'resolved') return 'resolved';
  if (!conv.is_bot_active && conv.bot_paused_until && new Date(conv.bot_paused_until) > new Date()) {
    return conv.assigned_to ? 'attending' : 'waiting';
  }
  return 'all';
}

export function WhatsAppInbox() {
  const { instances } = useWhatsAppInstances();
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const { data: unreadCounts } = useWhatsAppUnreadCounts();
  const [statusFilter, setStatusFilter] = useState<ConversationFilter>('all');

  const filterInstanceId = activeInstanceId ?? undefined;
  const { conversations, isLoading } = useWhatsAppConversations(filterInstanceId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactPanel, setShowContactPanel] = useState(false);

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

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const name = c.contact?.name || c.contact?.phone || '';
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter === 'all') return true;
      return getConversationStatus(c) === statusFilter;
    });
  }, [conversations, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { waiting: 0, attending: 0, resolved: 0 };
    for (const c of conversations) {
      const s = getConversationStatus(c);
      if (s === 'waiting') counts.waiting++;
      else if (s === 'attending') counts.attending++;
      else if (s === 'resolved') counts.resolved++;
    }
    return counts;
  }, [conversations]);

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

        {/* Status filters */}
        <div className="p-2 border-b">
          <div className="flex gap-1">
            {([
              { key: 'all' as const, label: 'Todas' },
              { key: 'waiting' as const, label: '🆘 Aguardando', count: statusCounts.waiting },
              { key: 'attending' as const, label: '🔵 Atendendo', count: statusCounts.attending },
              { key: 'resolved' as const, label: '✅ Resolvidas', count: statusCounts.resolved },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap',
                  statusFilter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {f.label}
                {f.count ? ` (${f.count})` : ''}
              </button>
            ))}
          </div>
        </div>

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
            onToggleContactPanel={() => setShowContactPanel(p => !p)}
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

      {/* Contact panel */}
      {selectedConv && showContactPanel && (
        <WhatsAppContactPanel
          conversation={selectedConv}
          onClose={() => setShowContactPanel(false)}
        />
      )}
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
  const status = getConversationStatus(conversation);

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
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm truncate">{name}</span>
            {status === 'waiting' && (
              <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" title="Aguardando humano" />
            )}
            {status === 'attending' && (
              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" title="Em atendimento" />
            )}
            {status === 'resolved' && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title="Resolvida" />
            )}
          </div>
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
  onToggleContactPanel,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  instanceId: string;
  instanceName?: string;
  instanceColorIndex: number;
  onBack?: () => void;
  onToggleContactPanel?: () => void;
}) {
  const { messages, isLoading } = useWhatsAppMessages(conversation.id);
  const sendMessage = useSendWhatsAppMessage();
  const markRead = useMarkConversationRead();
  const takeOver = useTakeOverConversation();
  const resolveConv = useResolveConversation();
  const { replies, incrementUseCount } = useQuickReplies();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveReason, setResolveReason] = useState('');
  const [resolveCategory, setResolveCategory] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [slashFilter, setSlashFilter] = useState<string | null>(null);

  const name = conversation.contact?.name || conversation.contact?.phone || 'Desconhecido';
  const status = getConversationStatus(conversation);
  const isWaitingOrAttending = status === 'waiting' || status === 'attending';
  const isAssignedToMe = conversation.assigned_to === user?.id;

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

  const contactContext = {
    name: conversation.contact?.name || '',
    phone: conversation.contact?.phone || '',
    clinic: '',
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate({
      instanceId,
      phone: conversation.contact.phone,
      message: input.trim(),
    });
    setInput('');
    setSlashFilter(null);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.startsWith('/')) {
      setSlashFilter(value.slice(1).toLowerCase());
    } else {
      setSlashFilter(null);
    }
  };

  const handleSelectQuickReply = (reply: typeof replies[0]) => {
    const content = replaceVariables(reply.content, contactContext);
    setInput(content);
    setSlashFilter(null);
    setShowQuickReplies(false);
    incrementUseCount.mutate(reply.id);
  };

  const filteredReplies = slashFilter !== null
    ? replies.filter(r =>
        (r.shortcut && r.shortcut.toLowerCase().startsWith(slashFilter)) ||
        r.title.toLowerCase().includes(slashFilter)
      )
    : replies;

  const handleTakeOver = () => {
    takeOver.mutate(conversation.id);
  };

  const handleResolve = () => {
    if (!resolveCategory) return;
    const reason = resolveCategory + (resolveReason ? `: ${resolveReason}` : '');
    resolveConv.mutate({ conversationId: conversation.id, reason });
    setShowResolveDialog(false);
    setResolveReason('');
    setResolveCategory('');
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
        <button onClick={onToggleContactPanel} className="cursor-pointer">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1">
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {conversation.contact?.phone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Handoff actions */}
          {status === 'waiting' && (
            <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50" onClick={handleTakeOver}>
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Assumir</span>
            </Button>
          )}
          {isWaitingOrAttending && isAssignedToMe && (
            <Button variant="outline" size="sm" className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => setShowResolveDialog(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resolver</span>
            </Button>
          )}
          {status === 'waiting' && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3" />
              Aguardando
            </Badge>
          )}

          {instanceName && (
            <Badge variant="outline" className="gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', getInstanceColor(instanceColorIndex))} />
              {instanceName}
            </Badge>
          )}
          <WhatsAppConversationTagSelector conversationId={conversation.id} />
        </div>
      </div>

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

      {/* Slash autocomplete */}
      {slashFilter !== null && filteredReplies.length > 0 && (
        <div className="mx-3 mb-1 border rounded-lg bg-popover shadow-md max-h-40 overflow-y-auto">
          {filteredReplies.map(r => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
              onClick={() => handleSelectQuickReply(r)}
            >
              <span className="font-medium">{r.shortcut ? `/${r.shortcut}` : r.title}</span>
              <span className="text-muted-foreground truncate">{r.content.substring(0, 50)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Popover open={showQuickReplies} onOpenChange={setShowQuickReplies}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                <Zap className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0 max-h-60 overflow-y-auto">
              {replies.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nenhuma resposta rápida</p>
              ) : (
                replies.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                    onClick={() => handleSelectQuickReply(r)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{r.title}</span>
                      {r.shortcut && <span className="text-[10px] text-muted-foreground">/{r.shortcut}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.content.substring(0, 60)}</p>
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>

          <Input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Digite / para atalhos..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Resolve dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Motivo</label>
              <Select value={resolveCategory} onValueChange={setResolveCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="agendamento">Agendamento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Observações (opcional)</label>
              <Textarea
                value={resolveReason}
                onChange={e => setResolveReason(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancelar</Button>
            <Button onClick={handleResolve} disabled={!resolveCategory || resolveConv.isPending}>
              Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
