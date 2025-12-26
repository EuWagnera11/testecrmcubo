import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  revenue_goal: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile,
  };
}
