
-- Financial Advisory module per project
CREATE TABLE public.project_financial_advisory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  financial_goals text,
  budget_analysis text,
  investment_recommendations text,
  cash_flow_notes text,
  report_frequency text DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_financial_advisory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants can view" ON public.project_financial_advisory FOR SELECT TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Project participants can manage" ON public.project_financial_advisory FOR ALL TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Deny anon" ON public.project_financial_advisory AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Branding module per project
CREATE TABLE public.project_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  brand_voice text,
  visual_identity_notes text,
  positioning_statement text,
  target_audience text,
  competitors text,
  brand_guidelines_url text,
  color_palette text,
  typography_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants can view" ON public.project_branding FOR SELECT TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Project participants can manage" ON public.project_branding FOR ALL TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Deny anon" ON public.project_branding AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Google My Business module per project
CREATE TABLE public.project_gmb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text,
  gmb_url text,
  review_response_strategy text,
  posting_schedule text,
  keywords text,
  categories text,
  photos_notes text,
  performance_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_gmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants can view" ON public.project_gmb FOR SELECT TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Project participants can manage" ON public.project_gmb FOR ALL TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Deny anon" ON public.project_gmb AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- CRM Integration tracking per project
CREATE TABLE public.project_crm_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  crm_platform text,
  integration_status text DEFAULT 'pending',
  api_endpoint text,
  sync_frequency text DEFAULT 'daily',
  fields_mapped text,
  notes text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_crm_integration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants can view" ON public.project_crm_integration FOR SELECT TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Project participants can manage" ON public.project_crm_integration FOR ALL TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Deny anon" ON public.project_crm_integration AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Social Media AI settings per project
CREATE TABLE public.project_social_ai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  auto_reply_comments boolean DEFAULT false,
  auto_reply_dms boolean DEFAULT false,
  ai_tone text DEFAULT 'professional',
  ai_instructions text,
  excluded_keywords text,
  response_delay_minutes integer DEFAULT 5,
  instagram_token text,
  facebook_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_social_ai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants can view" ON public.project_social_ai FOR SELECT TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Project participants can manage" ON public.project_social_ai FOR ALL TO authenticated USING (is_project_participant(auth.uid(), project_id));
CREATE POLICY "Deny anon" ON public.project_social_ai AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Automation flows (n8n kanban)
CREATE TABLE public.automation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'backlog',
  category text DEFAULT 'whatsapp',
  n8n_workflow_url text,
  assigned_to uuid,
  priority text DEFAULT 'medium',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view" ON public.automation_flows FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Approved users can manage" ON public.automation_flows FOR ALL TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Deny anon" ON public.automation_flows AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

-- Triggers
CREATE TRIGGER update_project_financial_advisory_updated_at BEFORE UPDATE ON public.project_financial_advisory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_branding_updated_at BEFORE UPDATE ON public.project_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_gmb_updated_at BEFORE UPDATE ON public.project_gmb FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_crm_integration_updated_at BEFORE UPDATE ON public.project_crm_integration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_social_ai_updated_at BEFORE UPDATE ON public.project_social_ai FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_flows_updated_at BEFORE UPDATE ON public.automation_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
