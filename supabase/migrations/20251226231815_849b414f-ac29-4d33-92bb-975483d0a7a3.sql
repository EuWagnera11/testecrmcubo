-- Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('project-attachments', 'chat-attachments');

-- Add SELECT policies for storage.objects to allow authenticated project participants to view files
CREATE POLICY "Project participants can view project attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-attachments' 
  AND public.is_project_participant(
    auth.uid(), 
    (string_to_array(name, '/'))[1]::uuid
  )
);

CREATE POLICY "Project participants can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_project_participant(
    auth.uid(),
    (string_to_array(name, '/'))[2]::uuid
  )
);