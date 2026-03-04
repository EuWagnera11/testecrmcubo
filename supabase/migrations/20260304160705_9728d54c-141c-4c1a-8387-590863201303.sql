
CREATE TABLE public.pipeline_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_item_id uuid NOT NULL REFERENCES public.sales_pipeline(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  meeting_link text,
  location text,
  notes text,
  confirmation_sent_at timestamptz,
  reminder_sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pipeline_meetings"
  ON public.pipeline_meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pipeline_meetings"
  ON public.pipeline_meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pipeline_meetings"
  ON public.pipeline_meetings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete pipeline_meetings"
  ON public.pipeline_meetings FOR DELETE TO authenticated USING (true);
