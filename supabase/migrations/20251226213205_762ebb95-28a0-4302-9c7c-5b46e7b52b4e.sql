-- Create storage bucket for project attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('project-attachments', 'project-attachments', true);

-- RLS policies for the storage bucket
CREATE POLICY "Project members can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view project attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated users can delete their uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-attachments' AND auth.uid() IS NOT NULL);