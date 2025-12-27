-- Drop the policy that exposes sensitive client data
DROP POLICY IF EXISTS "Public access to client names of shared projects" ON public.clients;

-- Create a secure view that only exposes non-sensitive client data
CREATE OR REPLACE VIEW public.shared_project_clients AS
SELECT 
  c.id,
  c.name,
  c.company,
  p.id as project_id
FROM public.clients c
INNER JOIN public.projects p ON p.client_id = c.id
WHERE p.share_enabled = true 
  AND p.share_token IS NOT NULL 
  AND (p.share_expires_at IS NULL OR p.share_expires_at > now());

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.shared_project_clients TO anon, authenticated;