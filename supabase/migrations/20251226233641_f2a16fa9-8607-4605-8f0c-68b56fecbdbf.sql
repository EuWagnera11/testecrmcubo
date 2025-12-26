-- Allow anonymous users to view shared projects (only when share_enabled is true and token matches)
CREATE POLICY "Allow public access to shared projects"
ON public.projects
FOR SELECT
TO anon
USING (share_enabled = true AND share_token IS NOT NULL);

-- Allow anonymous users to view fields of shared projects
CREATE POLICY "Allow public access to shared project fields"
ON public.project_fields
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_fields.project_id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);

-- Allow anonymous users to view metrics of shared projects
CREATE POLICY "Allow public access to shared project metrics"
ON public.project_metrics
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_metrics.project_id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);

-- Allow anonymous users to view client name for shared projects
CREATE POLICY "Allow public access to clients of shared projects"
ON public.clients
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.client_id = clients.id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
  )
);

-- Drop the deny policies for anon on these specific tables since we're adding selective access
DROP POLICY IF EXISTS "Deny anonymous access to projects" ON public.projects;
DROP POLICY IF EXISTS "Deny anonymous access to project_fields" ON public.project_fields;
DROP POLICY IF EXISTS "Deny anonymous access to project_metrics" ON public.project_metrics;
DROP POLICY IF EXISTS "Deny anonymous access to clients" ON public.clients;