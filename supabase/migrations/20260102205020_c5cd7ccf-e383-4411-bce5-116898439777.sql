-- =====================================================
-- PROJECT_PAYOUTS - Admin e Director podem gerenciar
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.project_payouts;
DROP POLICY IF EXISTS "Directors can manage all payouts" ON public.project_payouts;

CREATE POLICY "Admins can manage all payouts"
ON public.project_payouts FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage all payouts"
ON public.project_payouts FOR ALL
USING (public.has_role(auth.uid(), 'director'::app_role));

-- =====================================================
-- PROJECT_MESSAGES - Participantes podem enviar
-- =====================================================
DROP POLICY IF EXISTS "Users can send project messages" ON public.project_messages;

-- Admin full access
CREATE POLICY "Admins can manage all messages"
ON public.project_messages FOR ALL
USING (public.is_admin(auth.uid()));

-- Director full access
CREATE POLICY "Directors can manage all messages"
ON public.project_messages FOR ALL
USING (public.has_role(auth.uid(), 'director'::app_role));

-- Participants can send messages
CREATE POLICY "Participants can send messages"
ON public.project_messages FOR INSERT
WITH CHECK (public.is_project_participant(auth.uid(), project_id));

-- =====================================================
-- CAMPAIGNS - Admin e Director acesso completo
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Project directors can manage campaigns" ON public.campaigns;

CREATE POLICY "Admins can manage all campaigns"
ON public.campaigns FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage all campaigns"
ON public.campaigns FOR ALL
USING (public.has_role(auth.uid(), 'director'::app_role));

-- =====================================================
-- CAMPAIGN_METRICS - Admin e Director acesso completo
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all campaign metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Project directors can manage campaign metrics" ON public.campaign_metrics;

CREATE POLICY "Admins can manage all campaign metrics"
ON public.campaign_metrics FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage all campaign metrics"
ON public.campaign_metrics FOR ALL
USING (public.has_role(auth.uid(), 'director'::app_role));