import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Plus, Trash2, Save, Share2, Copy, Check,
  Palette, FileText, TrendingUp, MessageSquare, DollarSign, Image, Layers, LayoutGrid, ExternalLink,
  Video, Megaphone, Sparkles, MapPin, Database, Bot, Film
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
import { CampaignMetricsManager } from '@/components/CampaignMetricsManager';
import { FileUpload } from '@/components/FileUpload';
import { ProjectFinancials } from '@/components/ProjectFinancials';
import { ProjectChangeRequests } from '@/components/ProjectChangeRequests';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useProjectPresence } from '@/hooks/useProjectPresence';
import { OnlineUsers } from '@/components/OnlineUsers';
import { ProjectChat } from '@/components/ProjectChat';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TrafficModule } from '@/components/project/TrafficModule';
import { StrategyModule } from '@/components/project/StrategyModule';
import { CreativesModule } from '@/components/project/CreativesModule';
import { SocialMediaModule } from '@/components/project/SocialMediaModule';
import { AudiovisualModule } from '@/components/project/AudiovisualModule';
import { FinancialAdvisoryModule } from '@/components/project/FinancialAdvisoryModule';
import { BrandingModule } from '@/components/project/BrandingModule';
import { GMBModule } from '@/components/project/GMBModule';
import { CRMIntegrationModule } from '@/components/project/CRMIntegrationModule';
import { SocialAIModule } from '@/components/project/SocialAIModule';

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

const projectTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  traffic: { label: 'Tráfego Pago', icon: TrendingUp, color: 'text-green-500' },
  design: { label: 'Design', icon: Palette, color: 'text-pink-500' },
  copy: { label: 'Copywriting', icon: FileText, color: 'text-blue-500' },
  social_media: { label: 'Social Media', icon: MessageSquare, color: 'text-purple-500' },
  audiovisual: { label: 'Audiovisual', icon: Video, color: 'text-orange-500' },
  financial_advisory: { label: 'Assessoria Financeira', icon: DollarSign, color: 'text-emerald-500' },
  branding: { label: 'Branding', icon: Sparkles, color: 'text-amber-500' },
  gmb: { label: 'Google Meu Negócio', icon: MapPin, color: 'text-red-500' },
  crm_integration: { label: 'Integração CRM', icon: Database, color: 'text-cyan-500' },
  social_ai: { label: 'Social Media IA', icon: Bot, color: 'text-violet-500' },
  video_editing: { label: 'Edição de Vídeo', icon: Film, color: 'text-rose-500' },
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
  const [fieldLinks, setFieldLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const project = projects.find(p => p.id === id);
  const isProjectOwner = project?.user_id === user?.id;
  const canManageMembers = isAdmin || isDirector || isProjectOwner || members.some(m => m.user_id === user?.id && m.role === 'director');
  // Get user's role in this project
  const userProjectRole = members.find(m => m.user_id === user?.id)?.role;
  
  // Check if user can edit a specific field
  const canEditField = (fieldType: keyof typeof fieldConfig) => {
    if (isAdmin || isDirector) return true;
    if (userProjectRole === 'director') return true;
    return fieldConfig[fieldType]?.role === userProjectRole;
  };

  // Initialize field contents, attachments and links
  useEffect(() => {
    const contents: Record<string, string> = {};
    const attachments: Record<string, string[]> = {};
    const links: Record<string, string> = {};
    fields.forEach(f => {
      contents[f.field_type] = f.content || '';
      attachments[f.field_type] = f.attachments || [];
      links[f.field_type] = f.link_url || '';
    });
    setFieldContents(contents);
    setFieldAttachments(attachments);
    setFieldLinks(links);
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
        attachments: fieldAttachments[fieldType] || [],
        linkUrl: fieldLinks[fieldType] || ''
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

  // Determine which modules to show based on project types
  const projectTypes = project?.project_types || [];
  const hasTraffic = projectTypes.includes('traffic');
  const hasDesign = projectTypes.includes('design');
  const hasCopy = projectTypes.includes('copy');
  const hasSocialMedia = projectTypes.includes('social_media');
  const hasAudiovisual = projectTypes.includes('audiovisual');
  const hasFinancialAdvisory = projectTypes.includes('financial_advisory');
  const hasBranding = projectTypes.includes('branding');
  const hasGMB = projectTypes.includes('gmb');
  const hasCRMIntegration = projectTypes.includes('crm_integration');
  const hasSocialAI = projectTypes.includes('social_ai');
  const hasVideoEditing = projectTypes.includes('video_editing');
  
  // Show creatives module for design, copy, or audiovisual
  const showCreatives = hasDesign || hasCopy || hasAudiovisual;
  // Show strategy for all project types
  const showStrategy = true;

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
            {projectTypes.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-1 flex-wrap">
                  {projectTypes.map(type => {
                    const config = projectTypeConfig[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <Badge key={type} variant="outline" className="text-xs gap-1">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </>
            )}
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

      <Tabs defaultValue={hasTraffic ? "traffic" : hasSocialMedia ? "social_media" : hasAudiovisual ? "audiovisual" : showStrategy ? "strategy" : "fields"}>
        <TabsList className="h-11 mb-6 flex-wrap">
          {hasTraffic && (
            <TabsTrigger value="traffic" className="px-4 gap-1">
              <TrendingUp className="h-4 w-4" /> Tráfego
            </TabsTrigger>
          )}
          {hasSocialMedia && (
            <TabsTrigger value="social_media" className="px-4 gap-1">
              <Users className="h-4 w-4" /> Social Media
            </TabsTrigger>
          )}
          {hasAudiovisual && (
            <TabsTrigger value="audiovisual" className="px-4 gap-1">
              <Video className="h-4 w-4" /> Audiovisual
            </TabsTrigger>
          )}
          {showStrategy && (
            <TabsTrigger value="strategy" className="px-4 gap-1">
              <Megaphone className="h-4 w-4" /> Estratégia
            </TabsTrigger>
          )}
          {showCreatives && (
            <TabsTrigger value="creatives" className="px-4 gap-1">
              <Palette className="h-4 w-4" /> Criativos
            </TabsTrigger>
          )}
          {hasFinancialAdvisory && (
            <TabsTrigger value="financial_advisory" className="px-4 gap-1">
              <DollarSign className="h-4 w-4" /> Assessoria
            </TabsTrigger>
          )}
          {hasBranding && (
            <TabsTrigger value="branding" className="px-4 gap-1">
              <Sparkles className="h-4 w-4" /> Branding
            </TabsTrigger>
          )}
          {hasGMB && (
            <TabsTrigger value="gmb" className="px-4 gap-1">
              <MapPin className="h-4 w-4" /> GMB
            </TabsTrigger>
          )}
          {hasCRMIntegration && (
            <TabsTrigger value="crm_integration" className="px-4 gap-1">
              <Database className="h-4 w-4" /> CRM
            </TabsTrigger>
          )}
          {hasSocialAI && (
            <TabsTrigger value="social_ai" className="px-4 gap-1">
              <Bot className="h-4 w-4" /> IA Social
            </TabsTrigger>
          )}
          {(hasVideoEditing || hasAudiovisual) && !hasAudiovisual && hasVideoEditing && (
            <TabsTrigger value="video_editing" className="px-4 gap-1">
              <Film className="h-4 w-4" /> Edição
            </TabsTrigger>
          )}
          <TabsTrigger value="fields" className="px-4">Campos</TabsTrigger>
          <TabsTrigger value="tasks" className="px-4">Tarefas</TabsTrigger>
          <TabsTrigger value="team" className="px-4">Equipe</TabsTrigger>
          {canSeeFinancials && <TabsTrigger value="financials" className="px-4">Financeiro</TabsTrigger>}
          {hasTraffic && <TabsTrigger value="metrics" className="px-4">Métricas</TabsTrigger>}
        </TabsList>

        {/* Traffic Module Tab */}
        {hasTraffic && (
          <TabsContent value="traffic" className="space-y-6">
            <TrafficModule 
              projectId={id!} 
              project={{
                monthly_budget: project.monthly_budget || undefined,
                target_cpa: project.target_cpa || undefined,
                target_roas: project.target_roas || undefined,
                target_cpl: project.target_cpl || undefined,
                status: project.status,
              }}
              onUpdateProject={(data) => updateProject.mutateAsync({ id: project.id, ...data })}
            />
          </TabsContent>
        )}

        {/* Social Media Module Tab */}
        {hasSocialMedia && (
          <TabsContent value="social_media" className="space-y-6">
            <SocialMediaModule projectId={id!} />
          </TabsContent>
        )}

        {/* Audiovisual Module Tab */}
        {hasAudiovisual && (
          <TabsContent value="audiovisual" className="space-y-6">
            <AudiovisualModule projectId={id!} />
          </TabsContent>
        )}

        {/* Strategy Module Tab */}
        {showStrategy && (
          <TabsContent value="strategy" className="space-y-6">
            <StrategyModule projectId={id!} />
          </TabsContent>
        )}

        {/* Creatives Module Tab */}
        {showCreatives && (
          <TabsContent value="creatives" className="space-y-6">
            <CreativesModule projectId={id!} />
          </TabsContent>
        )}

        {/* Financial Advisory Module Tab */}
        {hasFinancialAdvisory && (
          <TabsContent value="financial_advisory" className="space-y-6">
            <FinancialAdvisoryModule projectId={id!} />
          </TabsContent>
        )}

        {/* Branding Module Tab */}
        {hasBranding && (
          <TabsContent value="branding" className="space-y-6">
            <BrandingModule projectId={id!} />
          </TabsContent>
        )}

        {/* GMB Module Tab */}
        {hasGMB && (
          <TabsContent value="gmb" className="space-y-6">
            <GMBModule projectId={id!} />
          </TabsContent>
        )}

        {/* CRM Integration Module Tab */}
        {hasCRMIntegration && (
          <TabsContent value="crm_integration" className="space-y-6">
            <CRMIntegrationModule projectId={id!} />
          </TabsContent>
        )}

        {/* Social AI Module Tab */}
        {hasSocialAI && (
          <TabsContent value="social_ai" className="space-y-6">
            <SocialAIModule projectId={id!} />
          </TabsContent>
        )}

        {/* Video Editing uses Audiovisual module */}
        {hasVideoEditing && !hasAudiovisual && (
          <TabsContent value="video_editing" className="space-y-6">
            <AudiovisualModule projectId={id!} />
          </TabsContent>
        )}

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
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
                    {/* Link do Drive/Docs */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={fieldLinks[type] || ''}
                          onChange={(e) => setFieldLinks(prev => ({ ...prev, [type]: e.target.value }))}
                          placeholder="Link do Drive/Docs..."
                          className="pl-9"
                          disabled={!canEdit}
                        />
                      </div>
                      {fieldLinks[type] && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          asChild
                        >
                          <a href={fieldLinks[type]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
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
          
          {/* Change Requests Section */}
          <ProjectChangeRequests projectId={id!} />
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

        {/* Metrics Tab - Only for Traffic projects */}
        {hasTraffic && (
          <TabsContent value="metrics" className="space-y-4">
            <CampaignMetricsManager projectId={id!} currency={project.currency} />
          </TabsContent>
        )}
      </Tabs>

      {/* Project Chat */}
      <ProjectChat projectId={id!} />
    </div>
  );
}
