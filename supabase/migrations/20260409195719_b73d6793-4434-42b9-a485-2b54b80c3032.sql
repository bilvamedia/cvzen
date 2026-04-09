
DROP FUNCTION IF EXISTS public.get_public_job_preferences;

CREATE FUNCTION public.get_public_job_preferences(_profile_id UUID)
RETURNS TABLE(
  work_modes TEXT[],
  employment_types TEXT[],
  preferred_locations TEXT[],
  shift_preference TEXT,
  interview_availability JSONB,
  seniority_level TEXT,
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  salary_currency TEXT,
  industries TEXT[],
  company_sizes TEXT[],
  notice_period TEXT,
  willing_to_relocate BOOLEAN,
  travel_willingness TEXT,
  languages TEXT[],
  visa_sponsorship_needed BOOLEAN,
  benefits_priorities TEXT[],
  tools_technologies TEXT[],
  job_functions TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jp.work_modes, jp.employment_types, jp.preferred_locations,
         jp.shift_preference, jp.interview_availability, jp.seniority_level,
         jp.expected_salary_min, jp.expected_salary_max, jp.salary_currency,
         jp.industries, jp.company_sizes, jp.notice_period,
         jp.willing_to_relocate, jp.travel_willingness, jp.languages,
         jp.visa_sponsorship_needed, jp.benefits_priorities,
         jp.tools_technologies, jp.job_functions
  FROM public.job_preferences jp
  WHERE jp.user_id = _profile_id
  LIMIT 1;
$$;
