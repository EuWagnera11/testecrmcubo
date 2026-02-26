
-- Tags table for WhatsApp funnel identification
CREATE TABLE public.whatsapp_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for conversation-tag relationship
CREATE TABLE public.whatsapp_conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.whatsapp_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

-- RLS for whatsapp_tags
ALTER TABLE public.whatsapp_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view tags"
  ON public.whatsapp_tags FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can create tags"
  ON public.whatsapp_tags FOR INSERT
  WITH CHECK (is_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update tags"
  ON public.whatsapp_tags FOR UPDATE
  USING (is_approved(auth.uid()));

CREATE POLICY "Admins can delete tags"
  ON public.whatsapp_tags FOR DELETE
  USING (is_admin(auth.uid()) OR auth.uid() = created_by);

CREATE POLICY "Deny anon tags"
  ON public.whatsapp_tags FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- RLS for whatsapp_conversation_tags
ALTER TABLE public.whatsapp_conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view conversation tags"
  ON public.whatsapp_conversation_tags FOR SELECT
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can manage conversation tags"
  ON public.whatsapp_conversation_tags FOR INSERT
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Approved users can delete conversation tags"
  ON public.whatsapp_conversation_tags FOR DELETE
  USING (is_approved(auth.uid()));

CREATE POLICY "Deny anon conversation tags"
  ON public.whatsapp_conversation_tags FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
