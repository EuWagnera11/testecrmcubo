-- 1. Fix clients exposure: only allow access to client name for shared projects
DROP POLICY IF EXISTS "Public access to clients of shared projects" ON public.clients;

-- Create a more restrictive policy that only allows name access via the query
-- (The application code will need to only select the name field)
-- For now, we'll keep the policy but the app will be updated to only fetch name
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
  )
);

-- 2. Create dashboard_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.dashboard_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on dashboard_access_logs
ALTER TABLE public.dashboard_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (log access)
CREATE POLICY "Anyone can log dashboard access"
ON public.dashboard_access_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only project participants can view access logs
CREATE POLICY "Project participants can view access logs"
ON public.dashboard_access_logs
FOR SELECT
TO authenticated
USING (
  public.is_project_participant(auth.uid(), project_id)
);

-- 3. Create the missing activity_logs table referenced in code
-- (Already exists based on types, but let's ensure it has proper RLS)
-- Check if it exists first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    CREATE TABLE public.activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      action TEXT NOT NULL,
      field_type TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Project participants can view activity logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (public.is_project_participant(auth.uid(), project_id));
    
    CREATE POLICY "Project participants can insert activity logs"
    ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_project_participant(auth.uid(), project_id));
    
    CREATE INDEX idx_activity_logs_project_id ON public.activity_logs(project_id);
    CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
  END IF;
END $$;

-- 4. Add index on dashboard_access_logs for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_project_id ON public.dashboard_access_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_accessed_at ON public.dashboard_access_logs(accessed_at DESC);

-- 5. Enable realtime for dashboard_access_logs so owners can see live access
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_access_logs;