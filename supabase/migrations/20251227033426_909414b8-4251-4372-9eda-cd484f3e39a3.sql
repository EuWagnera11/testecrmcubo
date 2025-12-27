-- Create table for client change requests
CREATE TABLE public.project_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  requested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to project_change_requests"
ON public.project_change_requests AS RESTRICTIVE FOR ALL
USING (false) WITH CHECK (false);

CREATE POLICY "Project participants can view change requests"
ON public.project_change_requests FOR SELECT
USING (is_project_participant(auth.uid(), project_id));

CREATE POLICY "Project participants can create change requests"
ON public.project_change_requests FOR INSERT
WITH CHECK (is_project_participant(auth.uid(), project_id) AND auth.uid() = created_by);

CREATE POLICY "Project directors can manage change requests"
ON public.project_change_requests FOR ALL
USING (is_project_director(auth.uid(), project_id));

CREATE POLICY "Admins can manage all change requests"
ON public.project_change_requests FOR ALL
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_project_change_requests_updated_at
BEFORE UPDATE ON public.project_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();