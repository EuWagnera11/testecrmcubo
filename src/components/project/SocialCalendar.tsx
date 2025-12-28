import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, ChevronRight, Calendar, Trash2, List, LayoutGrid,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Filter, GripVertical,
  BarChart3, Heart, MessageCircle, Share2, Eye, Bookmark, Link2, Bell, TrendingUp
} from 'lucide-react';
import { useSocialCalendar, type SocialCalendarPost } from '@/hooks/useSocialCalendar';

interface SocialCalendarProps {
  projectId: string;
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Calendar,
  pinterest: Calendar,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  facebook: 'bg-blue-600/20 text-blue-600 border-blue-600/30',
  twitter: 'bg-sky-500/20 text-sky-500 border-sky-500/30',
  linkedin: 'bg-blue-700/20 text-blue-700 border-blue-700/30',
  youtube: 'bg-red-500/20 text-red-500 border-red-500/30',
  tiktok: 'bg-black/20 text-foreground border-border',
  pinterest: 'bg-red-600/20 text-red-600 border-red-600/30',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Agendado', className: 'bg-blue-500/20 text-blue-500' },
  published: { label: 'Publicado', className: 'bg-green-500/20 text-green-500' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-500' },
};

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
];

export function SocialCalendar({ projectId }: SocialCalendarProps) {
  const { posts, isLoading, upcomingPosts, createPost, updatePost, updateMetrics, deletePost } = useSocialCalendar(projectId);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialCalendarPost | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'metrics'>('calendar');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [draggedPost, setDraggedPost] = useState<SocialCalendarPost | null>(null);
  const [dialogTab, setDialogTab] = useState<'post' | 'metrics'>('post');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'instagram',
    scheduled_time: '',
    hashtags: '',
    notes: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published' | 'cancelled',
  });
  const [metricsData, setMetricsData] = useState({
    post_url: '',
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    impressions: 0,
    saves: 0,
    engagement_rate: 0,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchPlatform = filterPlatform === 'all' || post.platform === filterPlatform;
    const matchStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchPlatform && matchStatus;
  });

  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter(post => isSameDay(parseISO(post.scheduled_date), date));
  };

  const handleOpenDialog = (date: Date, post?: SocialCalendarPost) => {
    setSelectedDate(date);
    setDialogTab('post');
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content || '',
        platform: post.platform,
        scheduled_time: post.scheduled_time || '',
        hashtags: post.hashtags || '',
        notes: post.notes || '',
        status: post.status as 'draft' | 'scheduled' | 'published' | 'cancelled',
      });
      setMetricsData({
        post_url: post.post_url || '',
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        reach: post.reach || 0,
        impressions: post.impressions || 0,
        saves: post.saves || 0,
        engagement_rate: post.engagement_rate || 0,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        platform: 'instagram',
        scheduled_time: '',
        hashtags: '',
        notes: '',
        status: 'draft',
      });
      setMetricsData({
        post_url: '',
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
        impressions: 0,
        saves: 0,
        engagement_rate: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveMetrics = async () => {
    if (!editingPost) return;
    await updateMetrics.mutateAsync({ id: editingPost.id, metrics: metricsData });
    setIsDialogOpen(false);
  };

  const calculateEngagementRate = () => {
    if (metricsData.reach > 0) {
      const totalEngagement = metricsData.likes + metricsData.comments + metricsData.shares + metricsData.saves;
      const rate = (totalEngagement / metricsData.reach) * 100;
      setMetricsData(prev => ({ ...prev, engagement_rate: parseFloat(rate.toFixed(2)) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.title.trim()) return;

    const postData = {
      ...formData,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: formData.scheduled_time || null,
    };

    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost.id, ...postData });
    } else {
      await createPost.mutateAsync(postData);
    }
    setIsDialogOpen(false);
    setEditingPost(null);
  };

  const handleDelete = async () => {
    if (!editingPost) return;
    await deletePost.mutateAsync(editingPost.id);
    setIsDialogOpen(false);
    setEditingPost(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, post: SocialCalendarPost) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!draggedPost) return;
    
    const newDate = format(targetDate, 'yyyy-MM-dd');
    if (newDate !== draggedPost.scheduled_date) {
      await updatePost.mutateAsync({ 
        id: draggedPost.id, 
        scheduled_date: newDate 
      });
    }
    setDraggedPost(null);
  };

  // List view sorted posts
  const listPosts = [...filteredPosts].sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-xl" />;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Calendário de Conteúdo
              </CardTitle>
              {upcomingPosts.length > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {upcomingPosts.length} próximo{upcomingPosts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button 
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="rounded-none h-8"
                  onClick={() => setViewMode('calendar')}
                  title="Calendário"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="rounded-none h-8"
                  onClick={() => setViewMode('list')}
                  title="Lista"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'metrics' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="rounded-none h-8"
                  onClick={() => setViewMode('metrics')}
                  title="Métricas"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
              
              {viewMode === 'calendar' && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {platforms.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterPlatform !== 'all' || filterStatus !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFilterPlatform('all'); setFilterStatus('all'); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'calendar' && (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-24 bg-muted/20 rounded-lg" />;
                }

                const dayPosts = getPostsForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 p-1 rounded-lg border transition-colors cursor-pointer hover:border-primary/50 ${
                      isToday ? 'border-primary bg-primary/5' : 'border-border/30 bg-muted/20'
                    } ${draggedPost ? 'hover:bg-primary/10' : ''}`}
                    onClick={() => handleOpenDialog(day)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayPosts.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {dayPosts.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayPosts.slice(0, 2).map(post => {
                        const PlatformIcon = platformIcons[post.platform] || Calendar;
                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, post)}
                            className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 border cursor-grab active:cursor-grabbing ${platformColors[post.platform] || 'bg-muted'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(day, post);
                            }}
                          >
                            <GripVertical className="h-2 w-2 flex-shrink-0 opacity-50" />
                            <PlatformIcon className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{post.title}</span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayPosts.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'list' && (
          <div className="space-y-2">
            {listPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum post encontrado
              </div>
            ) : (
              listPosts.map(post => {
                const PlatformIcon = platformIcons[post.platform] || Calendar;
                const status = statusConfig[post.status] || statusConfig.draft;
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleOpenDialog(parseISO(post.scheduled_date), post)}
                  >
                    <div className={`p-2 rounded-lg border ${platformColors[post.platform]}`}>
                      <PlatformIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(post.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                        {post.scheduled_time && ` às ${post.scheduled_time}`}
                      </p>
                    </div>
                    {post.engagement_rate && post.engagement_rate > 0 && (
                      <div className="flex items-center gap-1 text-sm text-green-500">
                        <TrendingUp className="h-3 w-3" />
                        {post.engagement_rate}%
                      </div>
                    )}
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === 'metrics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const publishedPosts = posts.filter(p => p.status === 'published');
                const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
                const totalComments = publishedPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
                const totalReach = publishedPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
                const avgEngagement = publishedPosts.length > 0 
                  ? publishedPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / publishedPosts.length 
                  : 0;
                return (
                  <>
                    <Card className="p-3">
                      <div className="flex items-center gap-2 text-pink-500 mb-1">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">Total Likes</span>
                      </div>
                      <p className="text-xl font-bold">{totalLikes.toLocaleString()}</p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">Comentários</span>
                      </div>
                      <p className="text-xl font-bold">{totalComments.toLocaleString()}</p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2 text-purple-500 mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Alcance Total</span>
                      </div>
                      <p className="text-xl font-bold">{totalReach.toLocaleString()}</p>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2 text-green-500 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs">Engajamento Médio</span>
                      </div>
                      <p className="text-xl font-bold">{avgEngagement.toFixed(2)}%</p>
                    </Card>
                  </>
                );
              })()}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Posts Publicados</h4>
              {posts.filter(p => p.status === 'published').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum post publicado ainda
                </div>
              ) : (
                posts.filter(p => p.status === 'published').map(post => {
                  const PlatformIcon = platformIcons[post.platform] || Calendar;
                  return (
                    <div
                      key={post.id}
                      className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleOpenDialog(parseISO(post.scheduled_date), post)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg border ${platformColors[post.platform]}`}>
                          <PlatformIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(post.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        {post.post_url && (
                          <a 
                            href={post.post_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Link2 className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Heart className="h-3 w-3 text-pink-500" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                          <span>{post.comments || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Share2 className="h-3 w-3 text-green-500" />
                          <span>{post.shares || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Eye className="h-3 w-3 text-purple-500" />
                          <span>{post.reach || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Bookmark className="h-3 w-3 text-amber-500" />
                          <span>{post.saves || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>{post.engagement_rate || 0}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Post Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Editar Post' : 'Novo Post'} - {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
            
            {editingPost ? (
              <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as 'post' | 'metrics')} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="post">Detalhes</TabsTrigger>
                  <TabsTrigger value="metrics" className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Métricas
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="post" className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título do post"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plataforma *</Label>
                        <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {platforms.map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v: 'draft' | 'scheduled' | 'published' | 'cancelled') => setFormData(prev => ({ ...prev, status: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([value, config]) => (
                              <SelectItem key={value} value={value}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduled_time">Horário</Label>
                      <Input
                        id="scheduled_time"
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Texto do post..."
                        rows={4}
                        maxLength={2200}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formData.content.length}/2200</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hashtags">Hashtags</Label>
                      <Input
                        id="hashtags"
                        value={formData.hashtags}
                        onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                        placeholder="#marketing #socialmedia"
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notas internas..."
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                      <Button type="submit" className="flex-1" disabled={updatePost.isPending}>
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="metrics" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="post_url" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Link do Post
                    </Label>
                    <Input
                      id="post_url"
                      value={metricsData.post_url}
                      onChange={(e) => setMetricsData(prev => ({ ...prev, post_url: e.target.value }))}
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Curtidas
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.likes}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        Comentários
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.comments}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-500" />
                        Compartilhamentos
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.shares}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-amber-500" />
                        Salvos
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.saves}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, saves: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        Alcance
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.reach}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, reach: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-500" />
                        Impressões
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={metricsData.impressions}
                        onChange={(e) => setMetricsData(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Taxa de Engajamento (%)
                      </Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={calculateEngagementRate}
                      >
                        Calcular
                      </Button>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={metricsData.engagement_rate}
                      onChange={(e) => setMetricsData(prev => ({ ...prev, engagement_rate: parseFloat(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      (Curtidas + Comentários + Compartilhamentos + Salvos) ÷ Alcance × 100
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSaveMetrics} 
                    className="w-full" 
                    disabled={updateMetrics.isPending}
                  >
                    Salvar Métricas
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do post"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plataforma *</Label>
                    <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v: 'draft' | 'scheduled' | 'published' | 'cancelled') => setFormData(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Texto do post..."
                    rows={4}
                    maxLength={2200}
                  />
                  <p className="text-xs text-muted-foreground text-right">{formData.content.length}/2200</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    value={formData.hashtags}
                    onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="#marketing #socialmedia"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas internas..."
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createPost.isPending}>
                  Criar Post
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
