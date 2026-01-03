-- =====================================================
-- SISTEMA DE FECHAMENTO MENSAL POR CLIENTE
-- =====================================================

-- 1. Tabela de fechamentos mensais
CREATE TABLE public.client_month_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_key VARCHAR(7) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  closed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Totais de trafego
  total_spend DECIMAL(12,2) DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_reach BIGINT DEFAULT 0,
  
  -- Metricas calculadas
  avg_ctr DECIMAL(8,4) DEFAULT 0,
  avg_cpc DECIMAL(10,2) DEFAULT 0,
  avg_cpl DECIMAL(10,2) DEFAULT 0,
  total_roas DECIMAL(8,2) DEFAULT 0,
  
  -- Totais de projetos/criativos
  total_static_creatives INTEGER DEFAULT 0,
  total_carousel_creatives INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  campaigns_count INTEGER DEFAULT 0,
  
  -- Snapshot completo em JSON
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  
  -- PDF do relatorio
  pdf_url TEXT,
  
  status VARCHAR(20) DEFAULT 'closed',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(client_id, period_key)
);

-- Indices para busca rapida
CREATE INDEX idx_client_closures_client ON public.client_month_closures(client_id);
CREATE INDEX idx_client_closures_period ON public.client_month_closures(period_key);
CREATE INDEX idx_client_closures_status ON public.client_month_closures(status);

-- Trigger para updated_at
CREATE TRIGGER update_client_month_closures_updated_at
  BEFORE UPDATE ON public.client_month_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.client_month_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view closures for their clients"
  ON public.client_month_closures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_month_closures.client_id 
      AND c.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
    OR public.is_team_leader(auth.uid())
  );

CREATE POLICY "Users can insert closures for their clients"
  ON public.client_month_closures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_month_closures.client_id 
      AND c.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can update closures for their clients"
  ON public.client_month_closures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_month_closures.client_id 
      AND c.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- 2. Tabela de regras de comissao
CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Pode ser por role ou por usuario especifico
  target_role VARCHAR(50),
  target_user_id UUID,
  
  -- Tipo de calculo
  calc_type VARCHAR(20) NOT NULL,
  
  -- Valor (percentual ou fixo)
  value DECIMAL(10,2) NOT NULL,
  
  -- Base de calculo (para percentual)
  base_field VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Indices
CREATE INDEX idx_commission_rules_active ON public.commission_rules(is_active);
CREATE INDEX idx_commission_rules_role ON public.commission_rules(target_role);

-- Trigger para updated_at
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission rules"
  ON public.commission_rules FOR ALL
  USING (public.is_admin(auth.uid()) OR public.is_team_leader(auth.uid()));

CREATE POLICY "Users can view active rules"
  ON public.commission_rules FOR SELECT
  USING (is_active = true);

-- 3. Tabela de comissoes calculadas
CREATE TABLE public.closure_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_id UUID NOT NULL REFERENCES public.client_month_closures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  
  base_value DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  amount DECIMAL(12,2) NOT NULL,
  
  description TEXT,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_closure_commissions_closure ON public.closure_commissions(closure_id);
CREATE INDEX idx_closure_commissions_user ON public.closure_commissions(user_id);
CREATE INDEX idx_closure_commissions_paid ON public.closure_commissions(paid);

-- RLS
ALTER TABLE public.closure_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions"
  ON public.closure_commissions FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.is_admin(auth.uid())
    OR public.is_team_leader(auth.uid())
  );

CREATE POLICY "Admins can manage commissions"
  ON public.closure_commissions FOR ALL
  USING (public.is_admin(auth.uid()) OR public.is_team_leader(auth.uid()));