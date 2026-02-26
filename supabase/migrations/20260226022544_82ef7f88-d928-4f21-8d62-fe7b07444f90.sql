
-- WhatsApp instances (Evolution API connections)
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  instance_name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view instances" ON public.whatsapp_instances
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Admins and directors can manage instances" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()) OR is_director(auth.uid()));

CREATE POLICY "Deny anonymous access to whatsapp_instances" ON public.whatsapp_instances
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- WhatsApp contacts (leads)
CREATE TABLE public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  name text,
  profile_pic_url text,
  assigned_to uuid,
  source text DEFAULT 'manual',
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view contacts" ON public.whatsapp_contacts
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can manage contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Deny anonymous access to whatsapp_contacts" ON public.whatsapp_contacts
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- WhatsApp conversations
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  last_message_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contact_id, instance_id)
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view conversations" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can manage conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Deny anonymous access to whatsapp_conversations" ON public.whatsapp_conversations
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL DEFAULT 'user',
  content text,
  media_url text,
  media_type text,
  external_id text,
  status text DEFAULT 'sent',
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can insert messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Deny anonymous access to whatsapp_messages" ON public.whatsapp_messages
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- WhatsApp message templates
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Approved users can manage templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Deny anonymous access to whatsapp_templates" ON public.whatsapp_templates
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_contacts_updated_at BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
