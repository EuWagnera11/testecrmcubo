import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, Target, Save, Info, Palette, PenTool, TrendingUp, Share2, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { 
  appRoleLabels, 
  appRoleDescriptions, 
  appRoleColors,
  managementRoles,
  functionalRoles,
  allRoles,
  AppRole 
} from '@/lib/roleConfig';

const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-warning/15 text-warning border-warning/30' },
  approved: { label: 'Aprovado', className: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejeitado', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-4 w-4" />,
  director: <Crown className="h-4 w-4" />,
  team_leader: <Users className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  designer: <Palette className="h-4 w-4" />,
  copywriter: <PenTool className="h-4 w-4" />,
  traffic_manager: <TrendingUp className="h-4 w-4" />,
  social_media: <Share2 className="h-4 w-4" />,
};

export default function Settings() {
  const { user } = useAuth();
  const { users, isLoading, approveUser, rejectUser, setUserRoles } = useUsers();
  const { isAdmin, canSetRevenueGoal, roles: currentUserRoles } = useUserRole();
  const { profile, updateProfile } = useProfile();
  const [revenueGoal, setRevenueGoal] = useState('10000');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    if (profile?.revenue_goal !== undefined) {
      setRevenueGoal(profile.revenue_goal?.toString() || '10000');
    }
  }, [profile?.revenue_goal]);

  const pendingUsers = users.filter(u => u.status === 'pending');
  // Incluir o próprio usuário logado na lista
  const allUsers = users;

  const handleSaveGoal = () => {
    updateProfile.mutate({ revenue_goal: Number(revenueGoal) });
  };

  const handleEditRoles = (userId: string, currentRoles: AppRole[]) => {
    setEditingUserId(userId);
    setSelectedRoles(currentRoles);
  };

  const handleToggleRole = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (editingUserId) {
      await setUserRoles.mutateAsync({ userId: editingUserId, roles: selectedRoles });
      setEditingUserId(null);
      setSelectedRoles([]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Sistema</p>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>

      <Tabs defaultValue={isAdmin ? "users" : "profile"}>
        <TabsList className="h-11 mb-6">
          {isAdmin && <TabsTrigger value="users" className="px-4">Usuários</TabsTrigger>}
          {isAdmin && <TabsTrigger value="roles" className="px-4">Cargos</TabsTrigger>}
          <TabsTrigger value="profile" className="px-4">Meu Perfil</TabsTrigger>
        </TabsList>

        {/* Users Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            {/* Pending Approvals */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Aprovações Pendentes</CardTitle>
                    <CardDescription>Usuários aguardando aprovação para acessar o sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : pendingUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma aprovação pendente.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">Cadastrado em {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => rejectUser.mutate(u.id)}
                            disabled={rejectUser.isPending}
                          >
                            <UserX className="h-4 w-4 mr-1" /> Rejeitar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => approveUser.mutate(u.id)}
                            disabled={approveUser.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Users */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Todos os Usuários</CardTitle>
                    <CardDescription>Gerencie os usuários do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum usuário cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {allUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={statusConfig[u.status].className}>
                                {statusConfig[u.status].label}
                              </Badge>
                              {u.roles.map(role => (
                                <Badge key={role} variant="outline" className={appRoleColors[role] || ''}>
                                  <span className="flex items-center gap-1">
                                    {roleIcons[role]}
                                    {appRoleLabels[role] || role}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {u.status !== 'approved' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => approveUser.mutate(u.id)}
                            >
                              Aprovar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Roles Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="roles" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gerenciar Cargos</CardTitle>
                    <CardDescription>Defina os cargos de cada usuário (múltiplos cargos permitidos)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : allUsers.filter(u => u.status === 'approved').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum usuário aprovado.</p>
                ) : (
                  <div className="space-y-4">
                    {allUsers.filter(u => u.status === 'approved').map((u) => (
                      <div key={u.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {u.roles.map(role => (
                                <Badge key={role} variant="outline" className={appRoleColors[role] || ''}>
                                  <span className="flex items-center gap-1">
                                    {roleIcons[role]}
                                    {appRoleLabels[role] || role}
                                  </span>
                                </Badge>
                              ))}
                              {u.roles.length === 0 && (
                                <span className="text-sm text-muted-foreground">Sem cargo definido</span>
                              )}
                            </div>
                          </div>
                          {editingUserId !== u.id ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditRoles(u.id, u.roles)}
                            >
                              Editar Cargos
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingUserId(null)}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                size="sm"
                                onClick={handleSaveRoles}
                                disabled={setUserRoles.isPending}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Salvar
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {editingUserId === u.id && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
                            {allRoles.map((role) => (
                              <label
                                key={role}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedRoles.includes(role) 
                                    ? 'bg-primary/10 border border-primary/30' 
                                    : 'bg-background border border-border/50 hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  checked={selectedRoles.includes(role)}
                                  onCheckedChange={() => handleToggleRole(role)}
                                />
                                <span className="flex items-center gap-1.5 text-sm">
                                  {roleIcons[role]}
                                  {appRoleLabels[role]}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Descriptions */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sobre os Cargos</CardTitle>
                    <CardDescription>Cada usuário possui um cargo fixo global que define suas permissões</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Cargos de Gestão</h4>
                  <div className="space-y-3">
                    {managementRoles.map((role) => (
                      <div key={role} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${role === 'admin' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                          {roleIcons[role]}
                        </div>
                        <div>
                          <p className="font-medium">{appRoleLabels[role]}</p>
                          <p className="text-sm text-muted-foreground">{appRoleDescriptions[role]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Cargos Funcionais</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {functionalRoles.map((role) => (
                      <div key={role} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {roleIcons[role]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{appRoleLabels[role]}</p>
                          <p className="text-xs text-muted-foreground">{appRoleDescriptions[role]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {canSetRevenueGoal ? (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Meta de Receita</CardTitle>
                    <CardDescription>Defina sua meta mensal de faturamento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 max-w-md">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="revenue_goal">Meta (R$)</Label>
                    <Input
                      id="revenue_goal"
                      type="number"
                      value={revenueGoal}
                      onChange={(e) => setRevenueGoal(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Button onClick={handleSaveGoal} disabled={updateProfile.isPending} className="h-11">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Meu Perfil</CardTitle>
                    <CardDescription>Informações do seu perfil</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Você está logado como <span className="font-medium text-foreground">Colaborador</span>. 
                  Você pode visualizar e trabalhar nos projetos em que é membro.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
