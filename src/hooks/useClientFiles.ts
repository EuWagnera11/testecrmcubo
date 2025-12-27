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
  source: 'manual' | 'project';
  field_type?: string;
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

const fieldLabels: Record<string, string> = {
  design: 'Design',
  copy: 'Copywriting',
  traffic: 'Tráfego Pago',
  social_media: 'Social Media',
  general: 'Geral',
};

function detectFileType(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com')) return 'drive';
  if (lowerUrl.includes('docs.google.com')) return 'docs';
  if (lowerUrl.includes('sheets.google.com')) return 'sheets';
  if (lowerUrl.includes('slides.google.com')) return 'slides';
  if (lowerUrl.includes('figma.com')) return 'figma';
  if (lowerUrl.includes('canva.com')) return 'canva';
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  if (lowerUrl.match(/\.(mp4|mov|avi|webm)$/)) return 'video';
  if (lowerUrl.match(/\.(pdf)$/)) return 'pdf';
  return 'link';
}

export function useClientFiles(clientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for manual client files
  const manualFilesQuery = useQuery({
    queryKey: ['client-files-manual', clientId],
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
      return (data || []).map(file => ({
        ...file,
        source: 'manual' as const,
      }));
    },
    enabled: !!user && !!clientId,
  });

  // Query for project links from project_fields
  const projectLinksQuery = useQuery({
    queryKey: ['client-project-links', clientId],
    queryFn: async () => {
      // First get all projects for this client
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', clientId!);
      
      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);
      
      // Get all project_fields with links for these projects
      const { data: fields, error: fieldsError } = await supabase
        .from('project_fields')
        .select('id, project_id, field_type, link_url, created_at, updated_at')
        .in('project_id', projectIds)
        .not('link_url', 'is', null)
        .neq('link_url', '');
      
      if (fieldsError) throw fieldsError;

      // Map to ClientFile format
      return (fields || []).map(field => {
        const project = projects.find(p => p.id === field.project_id);
        return {
          id: `project-field-${field.id}`,
          client_id: clientId!,
          project_id: field.project_id,
          user_id: '',
          title: `${fieldLabels[field.field_type] || field.field_type} - ${project?.name || 'Projeto'}`,
          url: field.link_url!,
          file_type: detectFileType(field.link_url!),
          description: null,
          created_at: field.created_at,
          updated_at: field.updated_at,
          source: 'project' as const,
          field_type: field.field_type,
          project: project || null,
        } as ClientFile;
      });
    },
    enabled: !!user && !!clientId,
  });

  // Combine and sort all files
  const allFiles = [
    ...(manualFilesQuery.data || []),
    ...(projectLinksQuery.data || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    files: allFiles,
    isLoading: manualFilesQuery.isLoading || projectLinksQuery.isLoading,
    error: manualFilesQuery.error || projectLinksQuery.error,
    createFile,
    deleteFile,
  };
}
