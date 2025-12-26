-- Create table for project chat messages
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages if they are project members or project owner
CREATE POLICY "Users can view project messages" 
ON public.project_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_messages.project_id AND user_id = auth.uid()
  )
);

-- Policy: Users can send messages if they are project members or project owner
CREATE POLICY "Users can send project messages" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = project_messages.project_id AND user_id = auth.uid()
    )
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Create index for faster queries
CREATE INDEX idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON public.project_messages(created_at DESC);