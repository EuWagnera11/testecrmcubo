-- Drop the restrictive policies for anonymous access
DROP POLICY IF EXISTS "Allow public access to shared projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public access to shared project fields" ON public.project_fields;
DROP POLICY IF EXISTS "Allow public access to shared project metrics" ON public.project_metrics;
DROP POLICY IF EXISTS "Allow public access to clients of shared projects" ON public.clients;

-- Create PERMISSIVE policies for anonymous access to shared projects
CREATE POLICY "Public access to shared projects"
ON public.projects
FOR SELECT
TO anon
USING (share_enabled = true AND share_token IS NOT NULL);

-- Create PERMISSIVE policy for anonymous access to project_fields of shared projects
CREATE POLICY "Public access to shared project fields"
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

-- Create PERMISSIVE policy for anonymous access to project_metrics of shared projects
CREATE POLICY "Public access to shared project metrics"
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

-- Create PERMISSIVE policy for anonymous access to clients of shared projects
CREATE POLICY "Public access to clients of shared projects"
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