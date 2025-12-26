import { useState, useRef, useEffect, useMemo } from 'react';
import { useProjectChat } from '@/hooks/useProjectChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Paperclip, FileText, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { EmojiPicker } from './EmojiPicker';
import { MessageReactions } from './MessageReactions';
import { ChatSearch, ChatFilters } from './ChatSearch';

interface ProjectChatProps {
  projectId: string;
}

export const ProjectChat = ({ projectId }: ProjectChatProps) => {
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    sendMessage, 
    uploadFile,
    typingUsers,
    startTyping,
    stopTyping
  } = useProjectChat(projectId);
  const { reactions, fetchReactions, toggleReaction } = useMessageReactions(projectId);
  const { setCurrentProject } = useChatNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>({
    search: '',
    showImages: true,
    showFiles: true,
    showText: true
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch reactions when messages load
  useEffect(() => {
    if (messages.length > 0) {
      fetchReactions(messages.map(m => m.id));
    }
  }, [messages, fetchReactions]);

  // Set current project for notifications
  useEffect(() => {
    if (isOpen) {
      setCurrentProject(projectId);
    } else {
      setCurrentProject(null);
    }
    return () => setCurrentProject(null);
  }, [isOpen, projectId, setCurrentProject]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchContent = msg.content?.toLowerCase().includes(searchLower);
        const matchUser = msg.user_name?.toLowerCase().includes(searchLower);
        const matchFile = msg.file_name?.toLowerCase().includes(searchLower);
        if (!matchContent && !matchUser && !matchFile) return false;
      }

      // Type filters
      const isImage = msg.file_type?.startsWith('image/');
      const isFile = msg.file_url && !isImage;
      const isText = !msg.file_url || (msg.content && !msg.content.startsWith('📎'));

      if (isImage && !filters.showImages) return false;
      if (isFile && !filters.showFiles) return false;
      if (isText && !isImage && !isFile && !filters.showText) return false;

      return true;
    });
  }, [messages, filters]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    try {
      const fileData = await uploadFile(file);
      await sendMessage('', fileData);
      toast.success('Arquivo enviado!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderFilePreview = (msg: typeof messages[0]) => {
    if (!msg.file_url) return null;

    const isImage = msg.file_type?.startsWith('image/');

    if (isImage) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={msg.file_url} 
            alt={msg.file_name || 'Imagem'} 
            className="max-w-full max-h-48 rounded-lg object-cover"
          />
        </a>
      );
    }

    return (
      <a 
        href={msg.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span className="text-xs truncate">{msg.file_name || 'Arquivo'}</span>
      </a>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat do Projeto
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {showSearch && (
          <ChatSearch
            filters={filters}
            onFiltersChange={setFilters}
            totalMessages={messages.length}
            filteredCount={filteredMessages.length}
          />
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando mensagens...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {messages.length === 0 
                ? 'Nenhuma mensagem ainda. Comece a conversa!'
                : 'Nenhuma mensagem encontrada com os filtros aplicados.'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const msgReactions = reactions[msg.id] || [];
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.user_avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {msg.user_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {isOwn ? 'Você' : msg.user_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        {!isOwn && (
                          <EmojiPicker onSelect={(emoji) => toggleReaction(msg.id, emoji)} />
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 max-w-[220px] break-words ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content && !msg.content.startsWith('📎') && (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          {renderFilePreview(msg)}
                        </div>
                        {isOwn && (
                          <EmojiPicker onSelect={(emoji) => toggleReaction(msg.id, emoji)} />
                        )}
                      </div>
                      <MessageReactions
                        reactions={msgReactions}
                        onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {typingUsers.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
            {typingUsers.length === 1 
              ? `${typingUsers[0].user_name} está digitando...`
              : `${typingUsers.length} pessoas estão digitando...`
            }
          </div>
        )}

        <div className="p-3 border-t flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={stopTyping}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
