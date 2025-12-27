import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, Target, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { appRoleLabels, appRoleDescriptions, projectRoleLabels, projectRoleDescriptions } from '@/lib/roleConfig';

const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-warning/15 text-warning border-warning/30' },
  approved: { label: 'Aprovado', className: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejeitado', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function Settings() {
  const { user } = useAuth();
  const { users, isLoading, approveUser, rejectUser, setUserRole } = useUsers();
  const { isAdmin, canSetRevenueGoal } = useUserRole();
  const { profile, updateProfile } = useProfile();
  const [revenueGoal, setRevenueGoal] = useState('10000');

  // Sync revenueGoal with profile when it loads
  useEffect(() => {
    if (profile?.revenue_goal !== undefined) {
      setRevenueGoal(profile.revenue_goal?.toString() || '10000');
    }
  }, [profile?.revenue_goal]);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const allUsers = users.filter(u => u.id !== user?.id);

  const handleSaveGoal = () => {
    updateProfile.mutate({ revenue_goal: Number(revenueGoal) });
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
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {appRoleLabels[role] || role}
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
                    <CardDescription>Defina cargos globais para os usuários</CardDescription>
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
                      <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">
                            Cargo atual: {u.roles.map(r => appRoleLabels[r] || r).join(', ') || 'Nenhum'}
                          </p>
                        </div>
                        <Select
                          defaultValue={u.roles[0] || 'user'}
                          onValueChange={(value) => setUserRole.mutate({ userId: u.id, role: value as 'admin' | 'director' | 'user' })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Colaborador</SelectItem>
                            <SelectItem value="director">Diretor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
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
                    <CardDescription>Entenda as diferenças entre cargos do sistema e de projeto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Cargos do Sistema (globais)</h4>
                  <div className="space-y-3">
                    {Object.entries(appRoleLabels).map(([key, label]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{appRoleDescriptions[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Cargos de Projeto (por projeto)</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(projectRoleLabels).map(([key, label]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{projectRoleDescriptions[key]}</p>
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