-- Create audit_logs table for security logging
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- System can insert audit logs (using service role or security definer functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add explicit DENY policies for anonymous users on all sensitive tables
-- Clients table
CREATE POLICY "Deny anonymous access to clients"
ON public.clients
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Contracts table
CREATE POLICY "Deny anonymous access to contracts"
ON public.contracts
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Financial transactions table
CREATE POLICY "Deny anonymous access to financial_transactions"
ON public.financial_transactions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Projects table
CREATE POLICY "Deny anonymous access to projects"
ON public.projects
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- User roles table
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project members table
CREATE POLICY "Deny anonymous access to project_members"
ON public.project_members
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project messages table
CREATE POLICY "Deny anonymous access to project_messages"
ON public.project_messages
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project payouts table
CREATE POLICY "Deny anonymous access to project_payouts"
ON public.project_payouts
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project tasks table
CREATE POLICY "Deny anonymous access to project_tasks"
ON public.project_tasks
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Contract templates table
CREATE POLICY "Deny anonymous access to contract_templates"
ON public.contract_templates
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Signatories table
CREATE POLICY "Deny anonymous access to signatories"
ON public.signatories
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Monthly goals table
CREATE POLICY "Deny anonymous access to monthly_goals"
ON public.monthly_goals
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Activity logs table
CREATE POLICY "Deny anonymous access to activity_logs"
ON public.activity_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project fields table
CREATE POLICY "Deny anonymous access to project_fields"
ON public.project_fields
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project metrics table
CREATE POLICY "Deny anonymous access to project_metrics"
ON public.project_metrics
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Project alterations table
CREATE POLICY "Deny anonymous access to project_alterations"
ON public.project_alterations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Message reactions table
CREATE POLICY "Deny anonymous access to message_reactions"
ON public.message_reactions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Achievements table
CREATE POLICY "Deny anonymous access to achievements"
ON public.achievements
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Onboarding steps table
CREATE POLICY "Deny anonymous access to onboarding_steps"
ON public.onboarding_steps
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _table_name text DEFAULT NULL,
  _record_id text DEFAULT NULL,
  _old_data jsonb DEFAULT NULL,
  _new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data);
END;
$$;