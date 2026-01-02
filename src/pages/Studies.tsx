import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCourses, Course } from '@/hooks/useCourses';
import { useUserRole } from '@/hooks/useUserRole';
import { Plus, ExternalLink, Pencil, Trash2, BookOpen, GraduationCap, Video, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing Digital', icon: BookOpen },
  { value: 'design', label: 'Design', icon: FileText },
  { value: 'copywriting', label: 'Copywriting', icon: FileText },
  { value: 'traffic', label: 'Tráfego Pago', icon: Video },
  { value: 'social', label: 'Social Media', icon: Video },
  { value: 'vendas', label: 'Vendas', icon: GraduationCap },
  { value: 'outros', label: 'Outros', icon: BookOpen },
];

function CourseCard({ course, canManage, onEdit, onDelete }: { 
  course: Course; 
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const category = CATEGORIES.find(c => c.value === course.category);
  const Icon = category?.icon || BookOpen;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              {category && (
                <span className="text-xs text-muted-foreground">{category.label}</span>
              )}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover curso?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O curso será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {course.description && (
          <CardDescription className="line-clamp-2">{course.description}</CardDescription>
        )}
        <Button 
          className="w-full" 
          onClick={() => window.open(course.drive_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Acessar Curso
        </Button>
      </CardContent>
    </Card>
  );
}

function CourseDialog({ 
  open, 
  onOpenChange, 
  course, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSave: (data: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
}) {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [driveUrl, setDriveUrl] = useState(course?.drive_url || '');
  const [category, setCategory] = useState(course?.category || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description || null,
      drive_url: driveUrl,
      category: category || null,
      thumbnail_url: null,
    });
    onOpenChange(false);
    setTitle('');
    setDescription('');
    setDriveUrl('');
    setCategory('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do curso"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="drive_url">Link do Drive *</Label>
            <Input
              id="drive_url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do curso..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {course ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudiesContent() {
  const { courses, isLoading, createCourse, updateCourse, deleteCourse } = useCourses();
  const { isAdmin, isDirector, isTeamLeader } = useUserRole();
  const canManage = isAdmin || isDirector || isTeamLeader;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredCourses = filterCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category === filterCategory);

  const handleSave = (data: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingCourse) {
      updateCourse.mutate({ id: editingCourse.id, ...data });
    } else {
      createCourse.mutate(data);
    }
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Estudos
          </h1>
          <p className="text-muted-foreground mt-1">
            Cursos e materiais de estudo para a equipe
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Button onClick={() => { setEditingCourse(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-10 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {filterCategory !== 'all' 
              ? 'Não há cursos nesta categoria ainda.'
              : 'Comece adicionando cursos para sua equipe estudar.'}
          </p>
          {canManage && filterCategory === 'all' && (
            <Button onClick={() => { setEditingCourse(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Curso
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              canManage={canManage}
              onEdit={() => handleEdit(course)}
              onDelete={() => deleteCourse.mutate(course.id)}
            />
          ))}
        </div>
      )}

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
        onSave={handleSave}
      />
    </div>
  );
}

export default function Studies() {
  return <StudiesContent />;
}
