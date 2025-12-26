-- Fix 1: Create helper function to check project participation without recursion
CREATE OR REPLACE FUNCTION public.is_project_participant(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
  ) OR public.is_admin(_user_id)
$$;

-- Fix 2: Drop and recreate the problematic project_members SELECT policy
DROP POLICY IF EXISTS "Users can view project members of their projects" ON public.project_members;

CREATE POLICY "Users can view project members" 
ON public.project_members 
FOR SELECT 
USING (
  public.is_admin(auth.uid()) 
  OR user_id = auth.uid()
  OR public.is_project_participant(auth.uid(), project_id)
);

-- Fix 3: Add policies for admins/directors to view all projects (for notifications)
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can view all projects"
ON public.projects
FOR SELECT
USING (public.has_role(auth.uid(), 'director'));

-- Fix 4: Add policies for admins/directors to view all clients (for notifications)
CREATE POLICY "Admins can view all clients"
ON public.clients
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can view all clients"
ON public.clients
FOR SELECT
USING (public.has_role(auth.uid(), 'director'));

-- Feature: Create message_reactions table for emoji reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.project_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Users can view reactions on messages they can see"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_messages pm
    WHERE pm.id = message_reactions.message_id
    AND (
      EXISTS (SELECT 1 FROM public.projects WHERE id = pm.project_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = pm.project_id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can add reactions to messages they can see"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.project_messages pm
    WHERE pm.id = message_reactions.message_id
    AND (
      EXISTS (SELECT 1 FROM public.projects WHERE id = pm.project_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = pm.project_id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;