import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar, Trash2, Edit2, 
  Instagram, Facebook, Twitter, Linkedin, Youtube
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
  const { posts, isLoading, createPost, updatePost, deletePost } = useSocialCalendar(projectId);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialCalendarPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'instagram',
    scheduled_time: '',
    hashtags: '',
    notes: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published' | 'cancelled',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from Sunday
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => isSameDay(new Date(post.scheduled_date), date));
  };

  const handleOpenDialog = (date: Date, post?: SocialCalendarPost) => {
    setSelectedDate(date);
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
    }
    setIsDialogOpen(true);
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

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-xl" />;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Calendário de Conteúdo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                }`}
                onClick={() => handleOpenDialog(day)}
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
                        className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 border ${platformColors[post.platform] || 'bg-muted'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(day, post);
                        }}
                      >
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

        {/* Post Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Editar Post' : 'Novo Post'} - {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
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

              <div className="flex gap-2 pt-2">
                {editingPost && (
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={createPost.isPending || updatePost.isPending}>
                  {editingPost ? 'Salvar Alterações' : 'Criar Post'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
