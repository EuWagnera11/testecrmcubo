// Cargos do Sistema (globais unificados)
// Cada usuário tem um cargo fixo que define suas permissões e função

export type AppRole = 'admin' | 'director' | 'team_leader' | 'user' | 'designer' | 'copywriter' | 'traffic_manager' | 'social_media';

export const appRoleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  director: 'Diretor',
  team_leader: 'Líder de Equipe',
  user: 'Colaborador',
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
};

export const appRoleDescriptions: Record<AppRole, string> = {
  admin: 'Acesso total: gerencia usuários, cargos, projetos, clientes e metas',
  director: 'Pode criar projetos, clientes, definir metas e ver financeiro',
  team_leader: 'Pode criar projetos, clientes e definir metas, sem acesso ao financeiro',
  user: 'Visualiza e trabalha em projetos onde é membro',
  designer: 'Responsável pela criação visual dos projetos',
  copywriter: 'Responsável pelos textos e conteúdo',
  traffic_manager: 'Gerencia campanhas de tráfego pago',
  social_media: 'Gerencia redes sociais',
};

// Ícones para cada cargo (usando lucide-react)
export const appRoleIcons: Record<AppRole, string> = {
  admin: 'Shield',
  director: 'Crown',
  team_leader: 'Users',
  user: 'User',
  designer: 'Palette',
  copywriter: 'PenTool',
  traffic_manager: 'TrendingUp',
  social_media: 'Share2',
};

// Cores para badges de cada cargo
export const appRoleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/15 text-red-500 border-red-500/30',
  director: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  team_leader: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  user: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
  designer: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  copywriter: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  traffic_manager: 'bg-green-500/15 text-green-500 border-green-500/30',
  social_media: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
};

// Permissões por cargo
export const rolePermissions: Record<AppRole, {
  canCreateProjects: boolean;
  canCreateClients: boolean;
  canManageUsers: boolean;
  canViewFinancials: boolean;
  canSetGoals: boolean;
  canEditDesign: boolean;
  canEditCopy: boolean;
  canEditTraffic: boolean;
  canEditSocialMedia: boolean;
}> = {
  admin: {
    canCreateProjects: true,
    canCreateClients: true,
    canManageUsers: true,
    canViewFinancials: true,
    canSetGoals: true,
    canEditDesign: true,
    canEditCopy: true,
    canEditTraffic: true,
    canEditSocialMedia: true,
  },
  director: {
    canCreateProjects: true,
    canCreateClients: true,
    canManageUsers: false,
    canViewFinancials: true,
    canSetGoals: true,
    canEditDesign: true,
    canEditCopy: true,
    canEditTraffic: true,
    canEditSocialMedia: true,
  },
  team_leader: {
    canCreateProjects: true,
    canCreateClients: true,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: true,
    canEditDesign: true,
    canEditCopy: true,
    canEditTraffic: true,
    canEditSocialMedia: true,
  },
  user: {
    canCreateProjects: false,
    canCreateClients: false,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: false,
    canEditDesign: false,
    canEditCopy: false,
    canEditTraffic: false,
    canEditSocialMedia: false,
  },
  designer: {
    canCreateProjects: false,
    canCreateClients: false,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: false,
    canEditDesign: true,
    canEditCopy: false,
    canEditTraffic: false,
    canEditSocialMedia: false,
  },
  copywriter: {
    canCreateProjects: false,
    canCreateClients: false,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: false,
    canEditDesign: false,
    canEditCopy: true,
    canEditTraffic: false,
    canEditSocialMedia: false,
  },
  traffic_manager: {
    canCreateProjects: false,
    canCreateClients: false,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: false,
    canEditDesign: false,
    canEditCopy: false,
    canEditTraffic: true,
    canEditSocialMedia: false,
  },
  social_media: {
    canCreateProjects: false,
    canCreateClients: false,
    canManageUsers: false,
    canViewFinancials: false,
    canSetGoals: false,
    canEditDesign: false,
    canEditCopy: false,
    canEditTraffic: false,
    canEditSocialMedia: true,
  },
};

// Helper para obter permissões do cargo
export function getRolePermissions(role: AppRole) {
  return rolePermissions[role] || rolePermissions.user;
}

// Agrupar cargos por tipo
export const managementRoles: AppRole[] = ['admin', 'director', 'team_leader'];
export const functionalRoles: AppRole[] = ['designer', 'copywriter', 'traffic_manager', 'social_media'];
export const allRoles: AppRole[] = [...managementRoles, ...functionalRoles, 'user'];
