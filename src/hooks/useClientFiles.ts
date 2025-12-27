import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ClientFile {
  id: string;
  client_id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  url: string;
  file_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateClientFileData {
  client_id: string;
  project_id?: string | null;
  title: string;
  url: string;
  file_type?: string;
  description?: string;
}

export function useClientFiles(clientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filesQuery = useQuery({
    queryKey: ['client-files', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_files')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClientFile[];
    },
    enabled: !!user && !!clientId,
  });

  const createFile = useMutation({
    mutationFn: async (fileData: CreateClientFileData) => {
      const { data, error } = await supabase
        .from('client_files')
        .insert({
          ...fileData,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files', clientId] });
      toast({
        title: 'Arquivo adicionado!',
        description: 'O link foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('client_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files', clientId] });
      toast({
        title: 'Arquivo removido!',
        description: 'O link foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    files: filesQuery.data ?? [],
    isLoading: filesQuery.isLoading,
    error: filesQuery.error,
    createFile,
    deleteFile,
  };
}
