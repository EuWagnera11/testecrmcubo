import { useState, useRef, useEffect } from 'react';
import { useProjectChat } from '@/hooks/useProjectChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Paperclip, Image, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const { setCurrentProject } = useChatNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Limit file size to 10MB
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
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Comece a conversa!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Typing indicator */}
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
