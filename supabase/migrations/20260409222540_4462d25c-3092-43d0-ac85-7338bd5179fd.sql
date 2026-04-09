
-- Add embedding column to job_preferences
ALTER TABLE public.job_preferences
ADD COLUMN preferences_embedding vector(768);

-- Create index for similarity search
CREATE INDEX idx_job_preferences_embedding ON public.job_preferences
USING ivfflat (preferences_embedding vector_cosine_ops) WITH (lists = 10);

-- Function to search job preferences semantically
CREATE OR REPLACE FUNCTION public.search_job_preferences(
  query_embedding vector(768),
  match_threshold double precision DEFAULT 0.2,
  match_count integer DEFAULT 20
)
RETURNS TABLE(
  user_id uuid,
  work_modes text[],
  employment_types text[],
  preferred_locations text[],
  seniority_level text,
  industries text[],
  job_functions text[],
  tools_technologies text[],
  expected_salary_min integer,
  expected_salary_max integer,
  salary_currency text,
  similarity double precision
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jp.user_id,
    jp.work_modes,
    jp.employment_types,
    jp.preferred_locations,
    jp.seniority_level,
    jp.industries,
    jp.job_functions,
    jp.tools_technologies,
    jp.expected_salary_min,
    jp.expected_salary_max,
    jp.salary_currency,
    (1 - (jp.preferences_embedding <=> query_embedding))::double precision AS similarity
  FROM public.job_preferences jp
  WHERE
    jp.preferences_embedding IS NOT NULL
    AND (1 - (jp.preferences_embedding <=> query_embedding))::double precision > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
