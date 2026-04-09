
-- Fix 1: Prevent privilege escalation by only allowing role insert if user has no existing role
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role at signup"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = ANY(ARRAY['candidate'::app_role, 'recruiter'::app_role])
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  );

-- Fix 2: Validate profile_id exists on profile_likes insert
DROP POLICY IF EXISTS "Anyone can insert a like" ON public.profile_likes;

CREATE POLICY "Anyone can insert a like"
  ON public.profile_likes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id)
  );
