-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT, -- 'facebook', 'google', 'tiktok', 'instagram', 'linkedin'
  objective TEXT, -- 'conversions', 'leads', 'traffic', 'awareness', 'engagement'
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_metrics table
CREATE TABLE public.campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0, -- Click-through rate (%)
  cpc NUMERIC(10,2) DEFAULT 0, -- Cost per click
  cpm NUMERIC(10,2) DEFAULT 0, -- Cost per mille
  spend NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_conversion NUMERIC(10,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cost_per_lead NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(5,2) DEFAULT 0, -- Return on Ad Spend
  revenue NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Campaigns RLS policies
CREATE POLICY "Deny anonymous access to campaigns"
ON public.campaigns FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Project participants can view campaigns"
ON public.campaigns FOR SELECT
USING (is_project_participant(auth.uid(), project_id));

CREATE POLICY "Project directors can manage campaigns"
ON public.campaigns FOR ALL
USING (is_project_director(auth.uid(), project_id));

CREATE POLICY "Admins can manage all campaigns"
ON public.campaigns FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Public access to shared project campaigns"
ON public.campaigns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = campaigns.project_id
      AND p.share_enabled = true
      AND p.share_token IS NOT NULL
      AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);

-- Campaign metrics RLS policies
CREATE POLICY "Deny anonymous access to campaign_metrics"
ON public.campaign_metrics FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Project participants can view campaign metrics"
ON public.campaign_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
      AND is_project_participant(auth.uid(), c.project_id)
  )
);

CREATE POLICY "Project directors can manage campaign metrics"
ON public.campaign_metrics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
      AND is_project_director(auth.uid(), c.project_id)
  )
);

CREATE POLICY "Admins can manage all campaign metrics"
ON public.campaign_metrics FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Public access to shared project campaign metrics"
ON public.campaign_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    JOIN public.projects p ON p.id = c.project_id
    WHERE c.id = campaign_metrics.campaign_id
      AND p.share_enabled = true
      AND p.share_token IS NOT NULL
      AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);

-- Update trigger for campaigns
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();