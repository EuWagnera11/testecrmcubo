-- Drop existing public access policies and recreate with anon + authenticated
DROP POLICY IF EXISTS "Public access to shared projects" ON public.projects;
DROP POLICY IF EXISTS "Public access to shared project fields" ON public.project_fields;
DROP POLICY IF EXISTS "Public access to shared project metrics" ON public.project_metrics;
DROP POLICY IF EXISTS "Public access to clients of shared projects" ON public.clients;

-- Allow anon AND authenticated users to view shared projects
CREATE POLICY "Public access to shared projects"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (share_enabled = true AND share_token IS NOT NULL);

-- Allow anon AND authenticated users to view fields of shared projects
CREATE POLICY "Public access to shared project fields"
ON public.project_fields
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_fields.project_id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);

-- Allow anon AND authenticated users to view metrics of shared projects
CREATE POLICY "Public access to shared project metrics"
ON public.project_metrics
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_metrics.project_id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);

-- Allow anon AND authenticated users to view clients of shared projects
CREATE POLICY "Public access to clients of shared projects"
ON public.clients
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.client_id = clients.id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);