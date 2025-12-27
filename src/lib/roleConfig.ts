// Cargos do Sistema (globais) - controlam permissões de acesso
export const appRoleLabels: Record<string, string> = {
  admin: 'Administrador',
  director: 'Diretor',
  user: 'Colaborador',
};

export const appRoleDescriptions: Record<string, string> = {
  admin: 'Acesso total: gerencia usuários, cargos, projetos, clientes e metas',
  director: 'Pode criar projetos, clientes, definir metas e ver financeiro',
  user: 'Visualiza e trabalha em projetos onde é membro',
};

// Cargos de Projeto (específicos por projeto) - definem função no projeto
export const projectRoleLabels: Record<string, string> = {
  director: 'Diretor do Projeto',
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
};

export const projectRoleDescriptions: Record<string, string> = {
  director: 'Gerencia o projeto e seus membros',
  designer: 'Responsável pela criação visual',
  copywriter: 'Responsável pelos textos e conteúdo',
  traffic_manager: 'Gerencia campanhas de tráfego pago',
  social_media: 'Gerencia redes sociais',
};
