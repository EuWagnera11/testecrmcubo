-- =====================================================
-- FASE 1-5: TODAS AS TABELAS E ALTERAÇÕES
-- =====================================================

-- Histórico de interações com clientes
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'whatsapp')),
  title TEXT NOT NULL,
  description TEXT,
  interaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their client interactions"
ON public.client_interactions FOR ALL
USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_interactions.client_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE id = client_interactions.client_id AND user_id = auth.uid()));

CREATE POLICY "Deny anonymous access to client_interactions"
ON public.client_interactions FOR ALL
USING (false)
WITH CHECK (false);

-- Templates de projeto
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT DEFAULT 'one_time',
  default_fields JSONB DEFAULT '{}',
  default_tasks JSONB DEFAULT '[]',
  default_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their templates"
ON public.project_templates FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to project_templates"
ON public.project_templates FOR ALL
USING (false)
WITH CHECK (false);

-- Labels para tarefas
CREATE TABLE public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their labels"
ON public.task_labels FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to task_labels"
ON public.task_labels FOR ALL
USING (false)
WITH CHECK (false);

-- Associação de labels com tarefas
CREATE TABLE public.task_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.task_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, label_id)
);

ALTER TABLE public.task_label_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage task labels through project access"
ON public.task_label_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.project_tasks pt 
  WHERE pt.id = task_label_assignments.task_id 
  AND is_project_participant(auth.uid(), pt.project_id)
));

CREATE POLICY "Deny anonymous access to task_label_assignments"
ON public.task_label_assignments FOR ALL
USING (false)
WITH CHECK (false);

-- Itens de checklist
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage checklists through project access"
ON public.task_checklist_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.project_tasks pt 
  WHERE pt.id = task_checklist_items.task_id 
  AND is_project_participant(auth.uid(), pt.project_id)
));

CREATE POLICY "Deny anonymous access to task_checklist_items"
ON public.task_checklist_items FOR ALL
USING (false)
WITH CHECK (false);

-- Workflows automáticos
CREATE TABLE public.project_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('status_change', 'due_date', 'task_created', 'task_assigned')),
  trigger_conditions JSONB DEFAULT '{}',
  action_type TEXT NOT NULL CHECK (action_type IN ('notify', 'assign', 'change_priority', 'create_task', 'change_status')),
  action_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workflows"
ON public.project_workflows FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to project_workflows"
ON public.project_workflows FOR ALL
USING (false)
WITH CHECK (false);

-- Categorias de transação personalizadas
CREATE TABLE public.transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their categories"
ON public.transaction_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to transaction_categories"
ON public.transaction_categories FOR ALL
USING (false)
WITH CHECK (false);

-- Propostas comerciais
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  total_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their proposals"
ON public.proposals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to proposals"
ON public.proposals FOR ALL
USING (false)
WITH CHECK (false);

-- Relatórios agendados
CREATE TABLE public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('performance', 'financial', 'projects', 'clients')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their reports"
ON public.scheduled_reports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to scheduled_reports"
ON public.scheduled_reports FOR ALL
USING (false)
WITH CHECK (false);

-- Mensagens do cliente (dashboard compartilhado)
CREATE TABLE public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with valid share token can insert messages"
ON public.client_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p 
  WHERE p.id = client_messages.project_id 
  AND p.share_enabled = true 
  AND p.share_token::text = client_messages.share_token
  AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
));

CREATE POLICY "Project owners can view client messages"
ON public.client_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects p 
  WHERE p.id = client_messages.project_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Project owners can update client messages"
ON public.client_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects p 
  WHERE p.id = client_messages.project_id 
  AND p.user_id = auth.uid()
));

-- Lembretes de pagamento
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'overdue')),
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their reminders"
ON public.payment_reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to payment_reminders"
ON public.payment_reminders FOR ALL
USING (false)
WITH CHECK (false);

-- Preferências de notificação
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  notify_tasks BOOLEAN DEFAULT true,
  notify_payments BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  notify_contracts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to notification_preferences"
ON public.notification_preferences FOR ALL
USING (false)
WITH CHECK (false);

-- =====================================================
-- ALTERAÇÕES EM TABELAS EXISTENTES
-- =====================================================

-- Clientes: datas importantes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contract_renewal_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Projetos: arquivamento e template
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.project_templates(id);

-- Tarefas: subtarefas, tempo, horas
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.project_tasks(id);
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;

-- Transações: recorrência e status
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'quarterly', 'yearly'));
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS next_occurrence DATE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue'));
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.transaction_categories(id);

-- Contratos: renovação automática
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS renewal_reminder_days INTEGER DEFAULT 30;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Perfil: tema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- Habilitar realtime para mensagens do cliente
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_reminders;