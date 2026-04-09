
CREATE TABLE public.job_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  work_modes TEXT[] NOT NULL DEFAULT '{}',
  employment_types TEXT[] NOT NULL DEFAULT '{}',
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  shift_preference TEXT DEFAULT 'flexible',
  interview_availability JSONB NOT NULL DEFAULT '{}',
  seniority_level TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.job_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.job_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.job_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
ON public.job_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_job_preferences_updated_at
BEFORE UPDATE ON public.job_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Public access function for shared profile pages
CREATE OR REPLACE FUNCTION public.get_public_job_preferences(_profile_id UUID)
RETURNS TABLE(
  work_modes TEXT[],
  employment_types TEXT[],
  preferred_locations TEXT[],
  shift_preference TEXT,
  interview_availability JSONB,
  seniority_level TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jp.work_modes, jp.employment_types, jp.preferred_locations,
         jp.shift_preference, jp.interview_availability, jp.seniority_level
  FROM public.job_preferences jp
  WHERE jp.user_id = _profile_id
  LIMIT 1;
$$;
