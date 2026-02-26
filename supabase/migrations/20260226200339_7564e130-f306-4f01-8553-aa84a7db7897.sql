-- Create storage bucket for AI chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-chat-files', 'ai-chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload ai chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-chat-files');

-- Allow public read access
CREATE POLICY "Public read access for ai chat files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-chat-files');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own ai chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ai-chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);