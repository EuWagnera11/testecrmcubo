import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  drive_url: string;
  category: string | null;
  thumbnail_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });

  const createCourse = useMutation({
    mutationFn: async (course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...course,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar curso: ' + error.message);
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...course }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar curso: ' + error.message);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover curso: ' + error.message);
    },
  });

  return {
    courses,
    isLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
