
-- Sales Pipeline / Funnel table
CREATE TABLE public.sales_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  stage TEXT NOT NULL DEFAULT 'lead',
  value NUMERIC DEFAULT 0,
  notes TEXT,
  source TEXT,
  assigned_to UUID,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  won_at TIMESTAMP WITH TIME ZONE,
  lost_at TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view pipeline"
  ON public.sales_pipeline FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can create pipeline items"
  ON public.sales_pipeline FOR INSERT
  WITH CHECK (is_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update pipeline items"
  ON public.sales_pipeline FOR UPDATE
  USING (is_approved(auth.uid()));

CREATE POLICY "Admins and directors can delete pipeline items"
  ON public.sales_pipeline FOR DELETE
  USING (is_admin(auth.uid()) OR is_director(auth.uid()) OR auth.uid() = created_by);

CREATE POLICY "Deny anon pipeline"
  ON public.sales_pipeline FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Global calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  color TEXT DEFAULT '#3b82f6',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view events"
  ON public.calendar_events FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can create events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (is_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update events"
  ON public.calendar_events FOR UPDATE
  USING (is_approved(auth.uid()));

CREATE POLICY "Users can delete own events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = created_by OR is_admin(auth.uid()));

CREATE POLICY "Deny anon events"
  ON public.calendar_events FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
