-- Tabela de templates de contratos
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  terms TEXT NOT NULL,
  contract_type TEXT DEFAULT 'one_time',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contract_templates
CREATE POLICY "Users can view their own templates"
ON public.contract_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.contract_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.contract_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.contract_templates FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de tarefas do projeto (Kanban)
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_to UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_tasks
CREATE POLICY "Project participants can view tasks"
ON public.project_tasks FOR SELECT
USING (is_project_participant(auth.uid(), project_id));

CREATE POLICY "Project participants can create tasks"
ON public.project_tasks FOR INSERT
WITH CHECK (is_project_participant(auth.uid(), project_id) AND auth.uid() = user_id);

CREATE POLICY "Project participants can update tasks"
ON public.project_tasks FOR UPDATE
USING (is_project_participant(auth.uid(), project_id));

CREATE POLICY "Project directors can delete tasks"
ON public.project_tasks FOR DELETE
USING (is_project_director(auth.uid(), project_id));

-- Trigger para updated_at
CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for project_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_tasks;