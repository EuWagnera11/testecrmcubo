-- Create table for client files/links
CREATE TABLE public.client_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT DEFAULT 'link',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own client files"
ON public.client_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own client files"
ON public.client_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client files"
ON public.client_files
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client files"
ON public.client_files
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_client_files_updated_at
BEFORE UPDATE ON public.client_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_client_files_client_id ON public.client_files(client_id);
CREATE INDEX idx_client_files_created_at ON public.client_files(created_at DESC);