import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ProjectRole = 'director' | 'designer' | 'copywriter' | 'traffic_manager' | 'social_media';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  profiles?: {
    full_name: string | null;
    user_id: string;
  } | null;
}

export interface ProjectField {
  id: string;
  project_id: string;
  field_type: 'design' | 'copy' | 'traffic' | 'social_media' | 'general';
  content: string | null;
  attachments: string[] | null;
  link_url: string | null;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectMembers(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      // First get the members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId!);
      
      if (membersError) throw membersError;
      
      // Then get profiles for those members
      if (membersData.length === 0) return [];
      
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine
      return membersData.map(member => ({
        ...member,
        profiles: profilesData.find(p => p.user_id === member.user_id) || null
      })) as ProjectMember[];
    },
    enabled: !!user && !!projectId,
  });

  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: ProjectRole }) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId!,
          user_id: userId,
          role,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast({
        title: 'Membro adicionado!',
        description: 'O usuário foi adicionado ao projeto.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar membro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast({
        title: 'Membro removido',
        description: 'O usuário foi removido do projeto.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    addMember,
    removeMember,
  };
}

export function useProjectFields(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fieldsQuery = useQuery({
    queryKey: ['project-fields', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_fields')
        .select('*')
        .eq('project_id', projectId!)
        .order('field_type');
      
      if (error) throw error;
      return data as ProjectField[];
    },
    enabled: !!user && !!projectId,
  });

  const updateField = useMutation({
    mutationFn: async ({ fieldId, content, attachments, linkUrl }: { fieldId: string; content: string; attachments?: string[]; linkUrl?: string }) => {
      const updateData: Record<string, any> = { 
        content, 
        last_edited_by: user!.id 
      };
      if (attachments !== undefined) {
        updateData.attachments = attachments;
      }
      if (linkUrl !== undefined) {
        updateData.link_url = linkUrl;
      }
      const { data, error } = await supabase
        .from('project_fields')
        .update(updateData)
        .eq('id', fieldId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-fields', projectId] });
      toast({
        title: 'Campo atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar campo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createField = useMutation({
    mutationFn: async ({ fieldType, content }: { fieldType: ProjectField['field_type']; content?: string }) => {
      const { data, error } = await supabase
        .from('project_fields')
        .insert({
          project_id: projectId!,
          field_type: fieldType,
          content: content || '',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-fields', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar campo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    fields: fieldsQuery.data ?? [],
    isLoading: fieldsQuery.isLoading,
    error: fieldsQuery.error,
    updateField,
    createField,
  };
}
