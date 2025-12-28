-- Create table for Social Media module
CREATE TABLE public.project_social_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platforms TEXT[] DEFAULT '{}',
  posting_frequency TEXT,
  content_pillars TEXT,
  brand_voice TEXT,
  hashtag_strategy TEXT,
  engagement_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Create table for Audiovisual module
CREATE TABLE public.project_audiovisual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  video_types TEXT[] DEFAULT '{}',
  production_notes TEXT,
  equipment_requirements TEXT,
  delivery_formats TEXT,
  style_references TEXT,
  script_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_audiovisual ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_social_media
CREATE POLICY "Users can view social media data for their projects"
ON public.project_social_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_social_media.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert social media data for their projects"
ON public.project_social_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update social media data for their projects"
ON public.project_social_media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_social_media.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete social media data for their projects"
ON public.project_social_media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- RLS policies for project_audiovisual
CREATE POLICY "Users can view audiovisual data for their projects"
ON public.project_audiovisual FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_audiovisual.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert audiovisual data for their projects"
ON public.project_audiovisual FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update audiovisual data for their projects"
ON public.project_audiovisual FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_audiovisual.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete audiovisual data for their projects"
ON public.project_audiovisual FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_project_social_media_updated_at
BEFORE UPDATE ON public.project_social_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_audiovisual_updated_at
BEFORE UPDATE ON public.project_audiovisual
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();