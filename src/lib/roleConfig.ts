// Cargos do Sistema (globais unificados)
export type AppRole = 'admin' | 'director' | 'team_leader' | 'user' | 'designer' | 'copywriter' | 'traffic_manager' | 'social_media' | 'programmer' | 'sdr' | 'closer' | 'video_editor';

export const appRoleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  director: 'Diretor',
  team_leader: 'Líder de Equipe',
  user: 'Colaborador',
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
  programmer: 'Programador',
  sdr: 'SDR',
  closer: 'Closer',
  video_editor: 'Editor de Vídeo',
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
  programmer: 'Desenvolvimento e implementações técnicas',
  sdr: 'Prospecção e qualificação de leads',
  closer: 'Fechamento de vendas e negociações',
  video_editor: 'Edição e produção de vídeos',
};

export const appRoleIcons: Record<AppRole, string> = {
  admin: 'Shield',
  director: 'Crown',
  team_leader: 'Users',
  user: 'User',
  designer: 'Palette',
  copywriter: 'PenTool',
  traffic_manager: 'TrendingUp',
  social_media: 'Share2',
  programmer: 'Code',
  sdr: 'PhoneCall',
  closer: 'Handshake',
  video_editor: 'Film',
};

export const appRoleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/15 text-red-500 border-red-500/30',
  director: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  team_leader: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  user: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
  designer: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  copywriter: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  traffic_manager: 'bg-green-500/15 text-green-500 border-green-500/30',
  social_media: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  programmer: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
  sdr: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  closer: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  video_editor: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
};

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
  programmer: {
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
  sdr: {
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
  closer: {
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
  video_editor: {
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
};

export function getRolePermissions(role: AppRole) {
  return rolePermissions[role] || rolePermissions.user;
}

// Cargos ativos do sistema (os que aparecem para seleção)
export const activeRoles: AppRole[] = ['admin', 'director', 'team_leader', 'designer', 'copywriter', 'traffic_manager', 'social_media', 'programmer', 'sdr', 'closer', 'video_editor'];

// Agrupamentos
export const managementRoles: AppRole[] = ['admin', 'director', 'team_leader'];
export const functionalRoles: AppRole[] = ['designer', 'copywriter', 'traffic_manager', 'social_media', 'programmer', 'sdr', 'closer', 'video_editor'];
export const allRoles: AppRole[] = [...managementRoles, ...functionalRoles];
