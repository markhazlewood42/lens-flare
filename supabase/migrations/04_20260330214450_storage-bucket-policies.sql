-- Create storage bucket for artifact uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifact-uploads', 'artifact-uploads', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload artifacts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'artifact-uploads');

-- Allow public read access
CREATE POLICY "Public read access for artifact uploads"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'artifact-uploads');

-- Allow owners to delete their uploads
CREATE POLICY "Users can delete own artifact uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'artifact-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);