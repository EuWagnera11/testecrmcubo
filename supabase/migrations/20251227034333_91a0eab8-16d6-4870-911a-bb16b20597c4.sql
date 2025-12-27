-- Add attachments column to project_change_requests
ALTER TABLE public.project_change_requests
ADD COLUMN attachments TEXT[] DEFAULT '{}';

-- Create storage bucket for change request attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('change-request-attachments', 'change-request-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'change-request-attachments');

-- Policy to allow anyone to view attachments (public bucket)
CREATE POLICY "Anyone can view change request attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'change-request-attachments');

-- Policy to allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'change-request-attachments');