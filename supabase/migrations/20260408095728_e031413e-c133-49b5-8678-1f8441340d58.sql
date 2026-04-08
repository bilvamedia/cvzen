-- Fix ats_section_scores: change all policies to authenticated only
DROP POLICY IF EXISTS "Users can view own section scores" ON public.ats_section_scores;
DROP POLICY IF EXISTS "Users can insert own section scores" ON public.ats_section_scores;
DROP POLICY IF EXISTS "Users can update own section scores" ON public.ats_section_scores;
DROP POLICY IF EXISTS "Users can delete own section scores" ON public.ats_section_scores;

CREATE POLICY "Users can view own section scores" ON public.ats_section_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own section scores" ON public.ats_section_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own section scores" ON public.ats_section_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own section scores" ON public.ats_section_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix ats_score_history: change policies to authenticated only
DROP POLICY IF EXISTS "Users can view own score history" ON public.ats_score_history;
DROP POLICY IF EXISTS "Users can insert own score history" ON public.ats_score_history;

CREATE POLICY "Users can view own score history" ON public.ats_score_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own score history" ON public.ats_score_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);