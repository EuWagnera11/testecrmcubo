import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserRole() {
  const { user } = useAuth();

  const roleQuery = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data.map(r => r.role);
    },
    enabled: !!user,
  });

  const statusQuery = useQuery({
    queryKey: ['user-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      return data.status as 'pending' | 'approved' | 'rejected';
    },
    enabled: !!user,
  });

  const isAdmin = roleQuery.data?.includes('admin') ?? false;
  const isDirector = roleQuery.data?.includes('director') ?? false;
  const isUser = !isAdmin && !isDirector;
  const isApproved = statusQuery.data === 'approved';
  const isPending = statusQuery.data === 'pending';
  const isRejected = statusQuery.data === 'rejected';

  // Permissões baseadas no cargo
  const canCreateProjects = isAdmin || isDirector;
  const canManageClients = isAdmin || isDirector;
  const canSetRevenueGoal = isAdmin || isDirector;
  const canSeeFinancials = isAdmin || isDirector;

  return {
    roles: roleQuery.data ?? [],
    status: statusQuery.data,
    isAdmin,
    isDirector,
    isUser,
    isApproved,
    isPending,
    isRejected,
    canCreateProjects,
    canManageClients,
    canSetRevenueGoal,
    canSeeFinancials,
    isLoading: roleQuery.isLoading || statusQuery.isLoading,
  };
}
