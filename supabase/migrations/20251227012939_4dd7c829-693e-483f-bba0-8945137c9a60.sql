-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can log dashboard access" ON public.dashboard_access_logs;

-- Create a new policy that validates the share token exists and is valid
CREATE POLICY "Only valid shared project access can be logged"
ON public.dashboard_access_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND p.share_enabled = true
      AND p.share_token IS NOT NULL
      AND p.share_token::text = dashboard_access_logs.share_token
      AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);