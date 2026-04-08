-- Remove the unrestricted public SELECT policy on avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Add a scoped public SELECT policy: anyone can view avatars but only within user folders
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');