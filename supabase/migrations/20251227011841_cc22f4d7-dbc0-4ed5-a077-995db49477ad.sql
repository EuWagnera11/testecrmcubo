-- 1. Add expiration date column for share links
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add comment explaining the column
COMMENT ON COLUMN public.projects.share_expires_at IS 'Optional expiration date for share links. NULL means no expiration.';

-- 3. Update the public access policy to check expiration
DROP POLICY IF EXISTS "Public access to shared projects" ON public.projects;

CREATE POLICY "Public access to shared projects"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (
  share_enabled = true 
  AND share_token IS NOT NULL
  AND (share_expires_at IS NULL OR share_expires_at > now())
);

-- 4. Update the policy for project_fields to respect expiration
DROP POLICY IF EXISTS "Public access to shared project fields" ON public.project_fields;

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
    AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);

-- 5. Update the policy for project_metrics to respect expiration
DROP POLICY IF EXISTS "Public access to shared project metrics" ON public.project_metrics;

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
    AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);

-- 6. Update the policy for clients to respect expiration
DROP POLICY IF EXISTS "Public access to client names of shared projects" ON public.clients;

CREATE POLICY "Public access to client names of shared projects"
ON public.clients
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.client_id = clients.id
    AND p.share_enabled = true
    AND p.share_token IS NOT NULL
    AND (p.share_expires_at IS NULL OR p.share_expires_at > now())
  )
);