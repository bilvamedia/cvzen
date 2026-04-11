CREATE POLICY "Recruiters can view candidate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'recruiter'::app_role));