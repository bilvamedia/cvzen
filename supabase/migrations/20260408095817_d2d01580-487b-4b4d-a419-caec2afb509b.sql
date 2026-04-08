-- Fix storage policies for resumes bucket
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own resumes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix avatars bucket: restrict to authenticated only
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);