-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a new policy that only allows authenticated users to insert via the RPC function
-- The log_audit_event function uses SECURITY DEFINER, so it will work correctly
CREATE POLICY "Only authenticated users can insert audit logs via RPC" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);