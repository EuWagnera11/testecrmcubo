import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Plus, Trash2, Save, Share2, Copy, Check,
  Palette, FileText, TrendingUp, MessageSquare, DollarSign, Image, Layers, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/useProjects';
import { useProjectMembers, useProjectFields, ProjectRole } from '@/hooks/useProjectMembers';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MetricsEditor } from '@/components/MetricsEditor';
import { FileUpload } from '@/components/FileUpload';
import { ProjectFinancials } from '@/components/ProjectFinancials';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useProjectPresence } from '@/hooks/useProjectPresence';
import { OnlineUsers } from '@/components/OnlineUsers';
import { ProjectChat } from '@/components/ProjectChat';
import { KanbanBoard } from '@/components/KanbanBoard';


const fieldConfig = {
  design: { label: 'Design', icon: Palette, color: 'text-pink-500', role: 'designer' as ProjectRole },
  copy: { label: 'Copywriting', icon: FileText, color: 'text-blue-500', role: 'copywriter' as ProjectRole },
  traffic: { label: 'Tráfego Pago', icon: TrendingUp, color: 'text-green-500', role: 'traffic_manager' as ProjectRole },
  social_media: { label: 'Social Media', icon: MessageSquare, color: 'text-purple-500', role: 'social_media' as ProjectRole },
  general: { label: 'Geral', icon: FileText, color: 'text-gray-500', role: 'director' as ProjectRole },
};

const roleLabels: Record<ProjectRole, string> = {
  director: 'Diretor',
  designer: 'Designer',
  copywriter: 'Copywriter',
  traffic_manager: 'Gestor de Tráfego',
  social_media: 'Social Media',
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { projects, updateProject } = useProjects();
  const { members, addMember, removeMember, isLoading: membersLoading } = useProjectMembers(id);
  const { fields, updateField, createField, isLoading: fieldsLoading } = useProjectFields(id);
  const { users } = useUsers();
  const { isAdmin, isDirector } = useUserRole();
  
  // Enable realtime notifications and presence for this project
  useRealtimeNotifications(id);
  const { onlineUsers } = useProjectPresence(id);
  
  const [fieldContents, setFieldContents] = useState<Record<string, string>>({});
  const [fieldAttachments, setFieldAttachments] = useState<Record<string, string[]>>({});
  const [copied, setCopied] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const project = projects.find(p => p.id === id);
  const canManageMembers = isAdmin || isDirector || members.some(m => m.user_id === user?.id && m.role === 'director');
  
  // Get user's role in this project
  const userProjectRole = members.find(m => m.user_id === user?.id)?.role;
  
  // Check if user can edit a specific field
  const canEditField = (fieldType: keyof typeof fieldConfig) => {
    if (isAdmin || isDirector) return true;
    if (userProjectRole === 'director') return true;
    return fieldConfig[fieldType]?.role === userProjectRole;
  };

  // Initialize field contents and attachments
  useEffect(() => {
    const contents: Record<string, string> = {};
    const attachments: Record<string, string[]> = {};
    fields.forEach(f => {
      contents[f.field_type] = f.content || '';
      attachments[f.field_type] = f.attachments || [];
    });
    setFieldContents(contents);
    setFieldAttachments(attachments);
  }, [fields]);

  // Ensure all field types exist
  useEffect(() => {
    if (id && fields.length === 0 && !fieldsLoading) {
      Object.keys(fieldConfig).forEach(fieldType => {
        createField.mutate({ fieldType: fieldType as any });
      });
    }
  }, [id, fields.length, fieldsLoading]);

  const handleSaveField = async (fieldType: string) => {
    const field = fields.find(f => f.field_type === fieldType);
    if (field) {
      await updateField.mutateAsync({ 
        fieldId: field.id, 
        content: fieldContents[fieldType] || '',
        attachments: fieldAttachments[fieldType] || []
      });
    }
  };

  const handleToggleShare = async () => {
    if (!project) return;
    await updateProject.mutateAsync({ 
      id: project.id, 
      share_enabled: !project.share_enabled 
    });
  };

  const shareUrl = project?.share_token 
    ? `${window.location.origin}/cliente/${project.share_token}` 
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copiado!' });
  };

  const handleAddMember = async (userId: string, role: ProjectRole) => {
    await addMember.mutateAsync({ userId, role });
    setAddMemberOpen(false);
  };

  const approvedUsers = users.filter(u => u.status === 'approved' && u.id !== user?.id);
  const existingMemberIds = members.map(m => m.user_id);
  const availableUsers = approvedUsers.filter(u => !existingMemberIds.includes(u.id));

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  const formatCurrency = (value: number, currency: string) => {
    const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(locales[currency] || 'pt-BR', { style: 'currency', currency }).format(value);
  };

  const canSeeFinancials = isAdmin || isDirector;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to="/projetos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 font-body">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
          <h1 className="text-3xl font-display tracking-wide">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground font-body">
            <span>{project.clients?.name || 'Sem cliente'}</span>
            <span>•</span>
            <span className="text-primary font-display">{formatCurrency(Number(project.total_value), project.currency)}</span>
            {(project.static_creatives || project.carousel_creatives) ? (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  <Image className="h-3 w-3 mr-1" />
                  {project.static_creatives || 0} estáticos + {project.carousel_creatives || 0} carrosséis
                </Badge>
              </>
            ) : null}
            {onlineUsers.length > 0 && (
              <>
                <span>•</span>
                <OnlineUsers users={onlineUsers} />
              </>
            )}
          </div>
        </div>

        {/* Share Settings */}
        {canManageMembers && (
          <Card className="border-border/50 w-full lg:w-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Share2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Dashboard do Cliente</p>
                    <p className="text-xs text-muted-foreground">Compartilhar visualização</p>
                  </div>
                </div>
                <Switch checked={project.share_enabled || false} onCheckedChange={handleToggleShare} />
              </div>
              {project.share_enabled && (
                <div className="mt-3 flex gap-2">
                  <Input value={shareUrl} readOnly className="text-xs h-9" />
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="fields">
        <TabsList className="h-11 mb-6">
          <TabsTrigger value="fields" className="px-4">Campos</TabsTrigger>
          <TabsTrigger value="tasks" className="px-4">Tarefas</TabsTrigger>
          <TabsTrigger value="team" className="px-4">Equipe</TabsTrigger>
          {canSeeFinancials && <TabsTrigger value="financials" className="px-4">Financeiro</TabsTrigger>}
          <TabsTrigger value="metrics" className="px-4">Métricas</TabsTrigger>
        </TabsList>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(fieldConfig).map(([type, config]) => {
              const Icon = config.icon;
              const canEdit = canEditField(type as keyof typeof fieldConfig);
              
              return (
                <Card key={type} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <CardTitle className="text-base">{config.label}</CardTitle>
                      </div>
                      {canEdit ? (
                        <Badge variant="outline" className="text-xs">Pode editar</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Somente leitura</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={fieldContents[type] || ''}
                      onChange={(e) => setFieldContents(prev => ({ ...prev, [type]: e.target.value }))}
                      placeholder={`Conteúdo de ${config.label}...`}
                      rows={4}
                      disabled={!canEdit}
                    />
                    <FileUpload
                      projectId={id!}
                      fieldType={type}
                      attachments={fieldAttachments[type] || []}
                      onAttachmentsChange={(attachments) => 
                        setFieldAttachments(prev => ({ ...prev, [type]: attachments }))
                      }
                      disabled={!canEdit}
                    />
                    {canEdit && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveField(type)}
                        disabled={updateField.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" /> Salvar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tasks Tab - Kanban */}
        <TabsContent value="tasks" className="space-y-4">
          <KanbanBoard projectId={id!} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Membros da Equipe</h2>
            {canManageMembers && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Membro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {availableUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Nenhum usuário disponível</p>
                    ) : (
                      availableUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="font-medium">{u.full_name || 'Sem nome'}</span>
                          <Select onValueChange={(role) => handleAddMember(u.id, role as ProjectRole)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="director">Diretor</SelectItem>
                              <SelectItem value="designer">Designer</SelectItem>
                              <SelectItem value="copywriter">Copywriter</SelectItem>
                              <SelectItem value="traffic_manager">Gestor de Tráfego</SelectItem>
                              <SelectItem value="social_media">Social Media</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {membersLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : members.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum membro na equipe</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {members.map(member => (
                <Card key={member.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.profiles?.full_name || 'Usuário'}</p>
                      <Badge variant="secondary" className="mt-1">{roleLabels[member.role]}</Badge>
                    </div>
                    {canManageMembers && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => removeMember.mutate(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Financials Tab */}
        {canSeeFinancials && (
          <TabsContent value="financials" className="space-y-4">
            <ProjectFinancials 
              projectId={id!} 
              totalValue={Number(project.total_value)} 
              currency={project.currency} 
            />
          </TabsContent>
        )}

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <MetricsEditor projectId={id!} currency={project.currency} />
        </TabsContent>
      </Tabs>

      {/* Project Chat */}
      <ProjectChat projectId={id!} />
    </div>
  );
}
