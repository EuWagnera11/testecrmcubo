-- Add project_types array column to projects table (replacing single project_type)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_types text[] DEFAULT ARRAY['design']::text[];

-- Migrate existing project_type data to project_types array
UPDATE public.projects SET project_types = ARRAY[project_type] WHERE project_types IS NULL OR project_types = ARRAY['design']::text[];

-- Create project_strategy table (shared across all project types)
CREATE TABLE public.project_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  offer_big_idea TEXT,
  personas TEXT,
  funnel_structure TEXT,
  landing_page_url TEXT,
  landing_page_test_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Create project_technical_setup table (traffic-specific)
CREATE TABLE public.project_technical_setup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  meta_pixel_id TEXT,
  tiktok_pixel_id TEXT,
  ad_account_id TEXT,
  capi_status TEXT DEFAULT 'inactive',
  utm_pattern TEXT,
  ads_manager_link TEXT,
  drive_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Create project_copy_bank table
CREATE TABLE public.project_copy_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  angle TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_creatives table
CREATE TABLE public.project_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  tags TEXT[],
  dark_post_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tests table (testing lab)
CREATE TABLE public.project_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  variables TEXT,
  result TEXT,
  learnings TEXT,
  status TEXT DEFAULT 'running',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_optimization_log table
CREATE TABLE public.project_optimization_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_description TEXT NOT NULL,
  reason TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add traffic-specific columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_cpa NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_roas NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_cpl NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS responsible_id UUID;

-- Enable RLS on all new tables
ALTER TABLE public.project_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_technical_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_copy_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_optimization_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_strategy
CREATE POLICY "Users can view project strategy" ON public.project_strategy
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage project strategy" ON public.project_strategy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

-- RLS policies for project_technical_setup
CREATE POLICY "Users can view technical setup" ON public.project_technical_setup
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage technical setup" ON public.project_technical_setup
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

-- RLS policies for project_copy_bank
CREATE POLICY "Users can view copy bank" ON public.project_copy_bank
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage copy bank" ON public.project_copy_bank
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

-- RLS policies for project_creatives
CREATE POLICY "Users can view creatives" ON public.project_creatives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage creatives" ON public.project_creatives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

-- RLS policies for project_tests
CREATE POLICY "Users can view tests" ON public.project_tests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage tests" ON public.project_tests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

-- RLS policies for project_optimization_log
CREATE POLICY "Users can view optimization log" ON public.project_optimization_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );

CREATE POLICY "Users can manage optimization log" ON public.project_optimization_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())))
  );