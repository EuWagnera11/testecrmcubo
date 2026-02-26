import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, rolePermissions } from '@/lib/roleConfig';

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
      return data.map(r => r.role as AppRole);
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

  const roles = roleQuery.data ?? [];
  
  const isAdmin = roles.includes('admin');
  const isDirector = roles.includes('director');
  const isTeamLeader = roles.includes('team_leader');
  const isDesigner = roles.includes('designer');
  const isCopywriter = roles.includes('copywriter');
  const isTrafficManager = roles.includes('traffic_manager');
  const isSocialMedia = roles.includes('social_media');
  const isProgrammer = roles.includes('programmer');
  const isSdr = roles.includes('sdr');
  const isCloser = roles.includes('closer');
  const isVideoEditor = roles.includes('video_editor');
  const isUser = roles.length === 0 || (roles.length === 1 && roles.includes('user'));
  
  const isApproved = statusQuery.data === 'approved';
  const isPending = statusQuery.data === 'pending';
  const isRejected = statusQuery.data === 'rejected';

  // Calcular permissões baseadas em todos os cargos do usuário
  const hasPermission = (permission: keyof typeof rolePermissions.admin) => {
    return roles.some(role => rolePermissions[role]?.[permission] ?? false);
  };

  const canCreateProjects = isAdmin || isDirector || isTeamLeader || hasPermission('canCreateProjects');
  const canManageClients = isAdmin || isDirector || isTeamLeader || hasPermission('canCreateClients');
  const canSetRevenueGoal = isAdmin || isDirector || isTeamLeader;
  const canSeeFinancials = isAdmin || isDirector;
  const canManageUsers = isAdmin;

  return {
    roles,
    status: statusQuery.data,
    isAdmin,
    isDirector,
    isTeamLeader,
    isDesigner,
    isCopywriter,
    isTrafficManager,
    isSocialMedia,
    isProgrammer,
    isSdr,
    isCloser,
    isVideoEditor,
    isUser,
    isApproved,
    isPending,
    isRejected,
    canCreateProjects,
    canManageClients,
    canSetRevenueGoal,
    canSeeFinancials,
    canManageUsers,
    hasPermission,
    isLoading: roleQuery.isLoading || statusQuery.isLoading,
  };
}
