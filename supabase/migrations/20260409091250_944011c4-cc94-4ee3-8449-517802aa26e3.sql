
DROP POLICY IF EXISTS "Anyone can view plans" ON public.plans;
CREATE POLICY "Anyone can view plans"
  ON public.plans
  FOR SELECT
  TO anon, authenticated
  USING (true);
