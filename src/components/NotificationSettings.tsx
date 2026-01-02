import { Bell, Mail, MessageSquare, FileText, CreditCard, FolderKanban, Users, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Separator } from '@/components/ui/separator';

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences, requestPushPermission } = useNotificationPreferences();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Canais de Notificação</CardTitle>
              <CardDescription>Escolha como deseja receber suas notificações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receba alertas em tempo real no navegador</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!preferences.push_enabled && (
                <Button variant="outline" size="sm" onClick={requestPushPermission}>
                  Ativar
                </Button>
              )}
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receba resumos e alertas importantes por email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Categorias de Notificação</CardTitle>
              <CardDescription>Selecione quais tipos de notificação deseja receber</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="font-medium">Tarefas</Label>
                  <p className="text-sm text-muted-foreground">Atribuições, vencimentos e conclusões</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_tasks}
                onCheckedChange={(checked) => handleToggle('notify_tasks', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="font-medium">Pagamentos</Label>
                  <p className="text-sm text-muted-foreground">Novos pagamentos, vencidos e recebidos</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_payments}
                onCheckedChange={(checked) => handleToggle('notify_payments', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="font-medium">Mensagens</Label>
                  <p className="text-sm text-muted-foreground">Novas mensagens no chat de projetos</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_messages}
                onCheckedChange={(checked) => handleToggle('notify_messages', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <Label className="font-medium">Contratos</Label>
                  <p className="text-sm text-muted-foreground">Novos contratos e assinaturas</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_contracts}
                onCheckedChange={(checked) => handleToggle('notify_contracts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-5 w-5 text-cyan-500" />
                <div>
                  <Label className="font-medium">Projetos</Label>
                  <p className="text-sm text-muted-foreground">Novos projetos e mudanças de status</p>
                </div>
              </div>
              <Switch
                checked={(preferences as any).notify_projects ?? true}
                onCheckedChange={(checked) => handleToggle('notify_projects', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-pink-500" />
                <div>
                  <Label className="font-medium">Clientes</Label>
                  <p className="text-sm text-muted-foreground">Novos clientes e aniversários</p>
                </div>
              </div>
              <Switch
                checked={(preferences as any).notify_clients ?? true}
                onCheckedChange={(checked) => handleToggle('notify_clients', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Horário de Silêncio</CardTitle>
              <CardDescription>Defina um período para não receber notificações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Início</Label>
              <Input
                type="time"
                defaultValue={(preferences as any).quiet_hours_start || '22:00'}
                onChange={(e) => handleToggle('quiet_hours_start', e.target.value as any)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Fim</Label>
              <Input
                type="time"
                defaultValue={(preferences as any).quiet_hours_end || '08:00'}
                onChange={(e) => handleToggle('quiet_hours_end', e.target.value as any)}
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Durante esse período, você não receberá notificações push.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
