-- Add creative counts to projects
ALTER TABLE public.projects 
ADD COLUMN static_creatives integer DEFAULT 0,
ADD COLUMN carousel_creatives integer DEFAULT 0;

-- Create project alterations table (changes requested by client)
CREATE TABLE public.project_alterations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  alteration_type text NOT NULL,
  description text,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for project_alterations
ALTER TABLE public.project_alterations ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_alterations
CREATE POLICY "Users can view alterations of their projects" 
ON public.project_alterations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_alterations.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create alterations for their projects" 
ON public.project_alterations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_alterations.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update alterations of their projects" 
ON public.project_alterations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_alterations.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete alterations of their projects" 
ON public.project_alterations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_alterations.project_id 
  AND projects.user_id = auth.uid()
));

-- Create project payouts table (team member payments)
CREATE TABLE public.project_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid,
  role text NOT NULL,
  member_name text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for project_payouts
ALTER TABLE public.project_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_payouts
CREATE POLICY "Users can view payouts of their projects" 
ON public.project_payouts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_payouts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create payouts for their projects" 
ON public.project_payouts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_payouts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update payouts of their projects" 
ON public.project_payouts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_payouts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete payouts of their projects" 
ON public.project_payouts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_payouts.project_id 
  AND projects.user_id = auth.uid()
));