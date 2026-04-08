-- Allow both candidate and recruiter self-assignment (these are the only valid app roles)
DROP POLICY IF EXISTS "Users can insert own candidate role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('candidate', 'recruiter'));