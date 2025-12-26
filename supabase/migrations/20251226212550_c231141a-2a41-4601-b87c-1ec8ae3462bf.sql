-- Add share token to projects for public client access
ALTER TABLE public.projects 
ADD COLUMN share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN share_enabled BOOLEAN DEFAULT false;

-- Create project_metrics table for tracking metrics
CREATE TABLE public.project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('impressions', 'clicks', 'conversions', 'spend', 'revenue', 'engagement', 'followers', 'reach')),
  value DECIMAL(15,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, metric_type, date)
);

-- Enable RLS
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

-- RLS for metrics - same as project fields
CREATE POLICY "Admins can manage all metrics"
ON public.project_metrics
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Project members can view metrics"
ON public.project_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_metrics.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Directors can manage metrics"
ON public.project_metrics
FOR ALL
USING (public.is_project_director(auth.uid(), project_id));

-- Create index
CREATE INDEX idx_project_metrics_project_id ON public.project_metrics(project_id);
CREATE INDEX idx_projects_share_token ON public.projects(share_token);