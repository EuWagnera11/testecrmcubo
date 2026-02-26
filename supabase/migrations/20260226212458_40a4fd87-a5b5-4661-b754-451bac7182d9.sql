
-- Add Asaas integration fields to sales_pipeline
ALTER TABLE public.sales_pipeline
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS asaas_payment_status text,
  ADD COLUMN IF NOT EXISTS asaas_invoice_url text;

-- Create webhook_leads table for external lead capture
CREATE TABLE IF NOT EXISTS public.webhook_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  source text DEFAULT 'webhook',
  message text,
  extra_data jsonb,
  imported boolean DEFAULT false,
  pipeline_item_id uuid REFERENCES public.sales_pipeline(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_leads ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all webhook leads
CREATE POLICY "Authenticated users can read webhook_leads"
  ON public.webhook_leads FOR SELECT TO authenticated
  USING (true);

-- Policy: authenticated users can update webhook leads (for importing)
CREATE POLICY "Authenticated users can update webhook_leads"
  ON public.webhook_leads FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Policy: anon can insert (webhook endpoint)
CREATE POLICY "Anon can insert webhook_leads"
  ON public.webhook_leads FOR INSERT TO anon
  WITH CHECK (true);

-- Policy: service role and authenticated can insert
CREATE POLICY "Authenticated can insert webhook_leads"
  ON public.webhook_leads FOR INSERT TO authenticated
  WITH CHECK (true);
