-- Allow authenticated users to view projects where they are members
CREATE POLICY "Users can view projects they are members of"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id
    AND pm.user_id = auth.uid()
  )
);