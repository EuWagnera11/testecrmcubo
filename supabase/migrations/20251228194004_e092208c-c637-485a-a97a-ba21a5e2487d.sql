-- Create table for Social Media content calendar
CREATE TABLE public.project_social_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  platform TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_social_calendar ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view calendar for their projects"
ON public.project_social_calendar FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_social_calendar.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert calendar for their projects"
ON public.project_social_calendar FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_social_calendar.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update calendar for their projects"
ON public.project_social_calendar FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_social_calendar.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete calendar for their projects"
ON public.project_social_calendar FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_social_calendar_updated_at
BEFORE UPDATE ON public.project_social_calendar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();