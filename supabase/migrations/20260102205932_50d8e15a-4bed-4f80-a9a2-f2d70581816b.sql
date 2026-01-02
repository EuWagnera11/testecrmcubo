-- Tabela de cursos/estudos
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  drive_url TEXT NOT NULL,
  category TEXT,
  thumbnail_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Admin e Director podem gerenciar cursos
CREATE POLICY "Admins can manage all courses"
ON public.courses FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage all courses"
ON public.courses FOR ALL
USING (public.is_director(auth.uid()));

-- Team leaders podem gerenciar cursos
CREATE POLICY "Team leaders can manage courses"
ON public.courses FOR ALL
USING (public.is_team_leader(auth.uid()));

-- Todos usuários aprovados podem ver cursos
CREATE POLICY "Approved users can view courses"
ON public.courses FOR SELECT
USING (public.is_approved(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();