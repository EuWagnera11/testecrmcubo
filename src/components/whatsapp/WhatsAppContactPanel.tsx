import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WhatsAppContact, WhatsAppConversation } from '@/hooks/useWhatsApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Phone, Edit2, Save, Plus, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

function useContactNotes(contactId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_contact_notes')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }
      return data as ContactNote[];
    },
    enabled: !!contactId,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('whatsapp_contact_notes').insert({
        contact_id: contactId!,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from('whatsapp_contact_notes').update({ content }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_contact_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] }),
  });

  return { notes: query.data ?? [], isLoading: query.isLoading, addNote, updateNote, deleteNote };
}

function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, notes }: { id: string; name?: string; notes?: string }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase.from('whatsapp_contacts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });
}

function useLinkedClient(phone?: string) {
  return useQuery({
    queryKey: ['linked-client', phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company, status, monthly_plan_value')
        .eq('phone', phone!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!phone,
  });
}

function NoteItem({ note, onUpdate, onDelete }: { note: ContactNote; onUpdate: (id: string, content: string) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    if (!editContent.trim()) return;
    onUpdate(note.id, editContent.trim());
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Remover esta nota?')) {
      onDelete(note.id);
    }
  };

  if (editing) {
    return (
      <div className="p-2 rounded bg-muted/50 text-xs space-y-1">
        <Input
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          className="h-7 text-xs"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSave}><Check className="h-3 w-3 mr-0.5" />Salvar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 rounded bg-muted/50 text-xs group">
      <p className="whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(note.created_at), 'dd/MM HH:mm', { locale: ptBR })}
        </p>
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
          <button onClick={() => { setEditContent(note.content); setEditing(true); }} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={handleDelete} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppContactPanel({
  conversation,
  onClose,
}: {
  conversation: WhatsAppConversation & { contact: WhatsAppContact };
  onClose: () => void;
}) {
  const contact = conversation.contact;
  const { notes, addNote, updateNote, deleteNote } = useContactNotes(contact?.id);
  const updateContact = useUpdateContact();
  const { data: linkedClient } = useLinkedClient(contact?.phone);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(contact?.name || '');
  const [editNotes, setEditNotes] = useState(contact?.notes || '');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    setEditName(contact?.name || '');
    setEditNotes(contact?.notes || '');
  }, [contact?.id]);

  const handleSave = () => {
    updateContact.mutate({ id: contact.id, name: editName, notes: editNotes });
    setEditing(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote.mutate(newNote.trim());
    setNewNote('');
  };

  return (
    <div className="w-72 border-l flex flex-col bg-card hidden lg:flex">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-medium text-sm">Perfil do Contato</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="text-center">
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {(contact?.name || contact?.phone || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {editing ? (
              <div className="space-y-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" className="text-center" />
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas..." rows={2} />
                <div className="flex gap-1 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleSave}><Save className="h-3 w-3 mr-1" />Salvar</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium">{contact?.name || 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Phone className="h-3 w-3" /> {contact?.phone}
                </p>
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Editar
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{contact?.source || 'desconhecido'}</Badge>
            {contact?.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>

          {linkedClient && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cliente vinculado</p>
              <p className="text-sm font-medium">{linkedClient.name}</p>
              {linkedClient.company && <p className="text-xs text-muted-foreground">{linkedClient.company}</p>}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{linkedClient.status}</Badge>
                {linkedClient.monthly_plan_value && (
                  <span className="text-xs text-muted-foreground">
                    R$ {linkedClient.monthly_plan_value.toLocaleString('pt-BR')}/mês
                  </span>
                )}
              </div>
            </div>
          )}

          {contact?.notes && !editing && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Histórico de notas</p>
            <div className="flex gap-1 mb-2">
              <Input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Adicionar nota..."
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              />
              <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              {notes.map(note => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onUpdate={(id, content) => updateNote.mutate({ id, content })}
                  onDelete={(id) => deleteNote.mutate(id)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
