-- Drop existing update and delete policies for projects
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Create comprehensive UPDATE policies for projects
-- Admins can update any project
CREATE POLICY "Admins can update all projects"
ON public.projects
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Directors can update any project
CREATE POLICY "Directors can update all projects"
ON public.projects
FOR UPDATE
USING (public.has_role(auth.uid(), 'director'::app_role));

-- Team Leaders can update any project
CREATE POLICY "Team Leaders can update all projects"
ON public.projects
FOR UPDATE
USING (public.has_role(auth.uid(), 'team_leader'::app_role));

-- Users can update their own projects
CREATE POLICY "Owners can update their projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Project members can update projects they belong to
CREATE POLICY "Members can update their projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
  )
);

-- Create comprehensive DELETE policies for projects
-- Admins can delete any project
CREATE POLICY "Admins can delete all projects"
ON public.projects
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Directors can delete any project
CREATE POLICY "Directors can delete all projects"
ON public.projects
FOR DELETE
USING (public.has_role(auth.uid(), 'director'::app_role));

-- Team Leaders can delete any project
CREATE POLICY "Team Leaders can delete all projects"
ON public.projects
FOR DELETE
USING (public.has_role(auth.uid(), 'team_leader'::app_role));

-- Owners can delete their own projects
CREATE POLICY "Owners can delete their projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create INSERT policy for Team Leaders
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;

CREATE POLICY "Authorized users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'director'::app_role) OR
    public.has_role(auth.uid(), 'team_leader'::app_role)
  )
);