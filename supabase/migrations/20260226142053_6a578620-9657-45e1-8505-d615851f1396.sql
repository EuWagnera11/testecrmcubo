-- Restrict WhatsApp instance viewing to admins and directors only (contains API keys)
DROP POLICY IF EXISTS "Approved users can view instances" ON public.whatsapp_instances;
CREATE POLICY "Admins and directors can view instances" ON public.whatsapp_instances
  FOR SELECT USING (is_admin(auth.uid()) OR is_director(auth.uid()));