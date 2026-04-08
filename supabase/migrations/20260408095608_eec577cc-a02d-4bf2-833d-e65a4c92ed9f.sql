-- 1. Fix profiles: restrict public SELECT to only own profile
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Fix resume_sections: remove blanket public SELECT
DROP POLICY IF EXISTS "Anyone can view sections for shared profiles" ON public.resume_sections;

-- 3. Fix user_roles: restrict self-assignment to only 'candidate' role
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own candidate role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'candidate');

-- 4. Add DELETE policy for resumes
CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Add DELETE policy for profiles (GDPR/DPDP right to erasure)
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);