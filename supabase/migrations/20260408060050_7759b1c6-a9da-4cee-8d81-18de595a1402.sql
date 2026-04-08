-- Section-wise ATS scores
CREATE TABLE public.ats_section_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.resume_sections(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_title TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords_found JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords_missing JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resume_id, section_id)
);

-- Score history for tracking improvements
CREATE TABLE public.ats_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0,
  section_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ats_section_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_score_history ENABLE ROW LEVEL SECURITY;

-- Policies for ats_section_scores
CREATE POLICY "Users can view own section scores" ON public.ats_section_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own section scores" ON public.ats_section_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own section scores" ON public.ats_section_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own section scores" ON public.ats_section_scores FOR DELETE USING (auth.uid() = user_id);

-- Policies for ats_score_history
CREATE POLICY "Users can view own score history" ON public.ats_score_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own score history" ON public.ats_score_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ats_section_scores_updated_at BEFORE UPDATE ON public.ats_section_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
