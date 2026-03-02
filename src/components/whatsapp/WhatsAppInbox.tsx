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
  useDeleteConversation,
  WhatsAppConversation,
  WhatsAppContact,
  WhatsAppInstance,
} from '@/hooks/useWhatsApp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, Phone, MessageSquare, Inbox, ArrowLeft, Bot, UserCheck, CheckCircle2, AlertTriangle, Zap, Trash2, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

// Correção 2: qualquer conversa com is_bot_active=false e não resolvida conta como waiting/attending
function getConversationStatus(conv: WhatsAppConversation): ConversationFilter {
  if (conv.status === 'resolved') return 'resolved';
  if (!conv.is_bot_active) {
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

  // Correção 3: delete conversation
  const deleteConv = useDeleteConversation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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

  const handleDeleteConversation = () => {
    if (!deleteTarget) return;
    deleteConv.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (selectedConversation === deleteTarget.id) {
          setSelectedConversation(null);
          setShowChat(false);
        }
        toast({ title: 'Conversa excluída' });
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        toast({ title: 'Erro ao excluir', description: err?.message || 'Verifique suas permissões', variant: 'destructive' });
      },
    });
  };

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className={cn(
        "w-full md:w-80 lg:w-[320px] border-r flex flex-col",
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

        {/* Status filters - Correção 8: sticky */}
        <div className="p-2 border-b sticky top-0 z-10 bg-background min-w-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {([
              { key: 'all' as const, label: 'Todas' },
              { key: 'waiting' as const, label: 'Aguardando', count: statusCounts.waiting },
              { key: 'attending' as const, label: 'Atendendo', count: statusCounts.attending },
              { key: 'resolved' as const, label: 'Resolvidas', count: statusCounts.resolved },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0',
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
            <WhatsAppNewChat />
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
                onDelete={(id, name) => setDeleteTarget({ id, name })}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir conversa de {deleteTarget?.name}? Mensagens serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  showInstanceBadge,
  instanceInfo,
  tags,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string, name: string) => void;
  showInstanceBadge?: boolean;
  instanceInfo?: { instance: WhatsAppInstance; colorIndex: number };
  tags?: Array<{ id: string; name: string; color: string }>;
}) {
  const name = conversation.contact?.name || conversation.contact?.phone || 'Desconhecido';
  const initials = name.slice(0, 2).toUpperCase();
  const status = getConversationStatus(conversation);

  return (
    <div
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50 group',
        isActive && 'bg-accent'
      )}
    >
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Correção 6: removido badge roxa do avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
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
      {/* Correção 3: botão excluir */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversation.id, name);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
        title="Excluir conversa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
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
  const [isSending, setIsSending] = useState(false);

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

  // Correção 9: loading + timeout
  const handleSend = () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    const timeout = setTimeout(() => {
      setIsSending(false);
      toast({ title: 'Envio demorou demais', description: 'Tente novamente', variant: 'destructive' });
    }, 10000);

    sendMessage.mutate(
      { instanceId, phone: conversation.contact.phone, message: input.trim() },
      {
        onSuccess: () => {
          clearTimeout(timeout);
          setIsSending(false);
        },
        onError: () => {
          clearTimeout(timeout);
          setIsSending(false);
          toast({ title: 'Falha no envio', description: 'Tente novamente', variant: 'destructive' });
        },
      }
    );
    setInput('');
    // cleared
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSelectQuickReply = (reply: typeof replies[0]) => {
    const content = replaceVariables(reply.content, contactContext);
    setInput(content);
    setShowQuickReplies(false);
    incrementUseCount.mutate(reply.id);
  };

  const handleTakeOver = () => {
    takeOver.mutate(conversation.id);
  };

  // Correção 10: pipeline integration on resolve
  const handleResolve = async () => {
    if (!resolveCategory) return;
    const reason = resolveCategory + (resolveReason ? `: ${resolveReason}` : '');
    resolveConv.mutate({ conversationId: conversation.id, reason });

    // Pipeline auto-update: check if lead exists, create if not
    try {
      const phone = conversation.contact?.phone;
      if (phone) {
        const { data: existingLeads } = await supabase
          .from('pipeline_leads' as any)
          .select('id, stage')
          .eq('phone', phone)
          .limit(1);

        if (!existingLeads || existingLeads.length === 0) {
          // Create new lead in pipeline
          await supabase
            .from('pipeline_leads' as any)
            .insert({
              name: conversation.contact?.name || phone,
              phone,
              source: 'whatsapp',
              stage: 'cliente',
              created_by: user?.id,
            });
        }
      }
    } catch {
      // Pipeline integration is best-effort, don't block resolve
    }

    setShowResolveDialog(false);
    setResolveReason('');
    setResolveCategory('');
  };

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors flex-1"
          onClick={onToggleContactPanel}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {conversation.contact?.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
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
                {msg.content && <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>}
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

      {/* Input - Layout: [Zap] [Send] [Input] */}
      <div className="p-4 border-t bg-card">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center"
        >
          <Popover open={showQuickReplies} onOpenChange={setShowQuickReplies}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                <Zap className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0 max-h-60 overflow-y-auto">
              {!replies ? (
                <p className="p-3 text-sm text-muted-foreground">Carregando templates...</p>
              ) : replies.length === 0 ? (
                <div className="p-3 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Nenhuma resposta rápida</p>
                  <p className="text-xs text-muted-foreground">Crie na aba Templates do WhatsApp</p>
                </div>
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

          <Button type="submit" size="icon" disabled={!input.trim() || isSending} className="flex-shrink-0">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>

          <Input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Digite uma mensagem"
            className="flex-1"
            disabled={isSending}
          />
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
