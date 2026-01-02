import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, Target, Save, Info, Palette, PenTool, TrendingUp, Share2, Crown, User, Camera, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useTeamGoals } from '@/hooks/useTeamGoals';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationSettings } from '@/components/NotificationSettings';
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
  const { toast } = useToast();
  const { users, isLoading, approveUser, rejectUser, setUserRoles, deleteUser } = useUsers();
  const { isAdmin, isDirector, canSetRevenueGoal, roles: currentUserRoles } = useUserRole();
  const { profile, updateProfile } = useProfile();
  const { getCurrentMonthGoal, upsertGoal } = useTeamGoals();
  
  const [teamRevenueGoal, setTeamRevenueGoal] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [fullName, setFullName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const currentMonthGoal = getCurrentMonthGoal();
  const canEditTeamGoal = isAdmin || isDirector;

  useEffect(() => {
    if (currentMonthGoal) {
      setTeamRevenueGoal(currentMonthGoal.revenue_goal?.toString() || '');
    }
  }, [currentMonthGoal]);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const allUsers = users;

  const handleSaveTeamGoal = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    upsertGoal.mutate({ month: currentMonth, revenue_goal: Number(teamRevenueGoal) });
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({ full_name: fullName });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
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
          {canEditTeamGoal && <TabsTrigger value="team" className="px-4">Meta da Equipe</TabsTrigger>}
          <TabsTrigger value="notifications" className="px-4">Notificações</TabsTrigger>
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
                          {u.id !== user?.id && (
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
                                  deleteUser.mutate(u.id);
                                }
                              }}
                              disabled={deleteUser.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* Team Goal Tab - Admins and Directors Only */}
        {canEditTeamGoal && (
          <TabsContent value="team" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Meta Global da Equipe</CardTitle>
                    <CardDescription>
                      Defina a meta mensal de faturamento da equipe. Todos os membros poderão visualizar.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 max-w-md">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="team_revenue_goal">Meta de {format(new Date(), 'MMMM yyyy')}</Label>
                    <Input
                      id="team_revenue_goal"
                      type="number"
                      value={teamRevenueGoal}
                      onChange={(e) => setTeamRevenueGoal(e.target.value)}
                      placeholder="Ex: 50000"
                      className="h-11"
                    />
                  </div>
                  <Button onClick={handleSaveTeamGoal} disabled={upsertGoal.isPending} className="h-11">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Meta
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Esta meta será visível para todos os membros da equipe no dashboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar and Name Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meu Perfil</CardTitle>
                  <CardDescription>Personalize suas informações de perfil</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-medium">{profile?.full_name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {currentUserRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentUserRoles.map(role => (
                        <Badge key={role} variant="outline" className={appRoleColors[role] || ''}>
                          {appRoleLabels[role] || role}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name Field */}
              <div className="max-w-md space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <div className="flex gap-2">
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-11"
                  />
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfile.isPending}
                    className="h-11"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informações da Conta</CardTitle>
                  <CardDescription>Detalhes da sua conta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Função</p>
                  <p className="font-medium">
                    {currentUserRoles.length > 0 
                      ? currentUserRoles.map(r => appRoleLabels[r]).join(', ') 
                      : 'Colaborador'}
                  </p>
                </div>
              </div>
              {currentMonthGoal && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-primary">Meta da Equipe - {format(new Date(), 'MMMM yyyy')}</p>
                  </div>
                  <p className="text-2xl font-bold">
                    R$ {currentMonthGoal.revenue_goal?.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
