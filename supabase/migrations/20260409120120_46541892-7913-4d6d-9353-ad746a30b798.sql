
CREATE OR REPLACE FUNCTION public.search_jobs_semantic(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.2,
  match_count integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  title text,
  company text,
  company_website text,
  work_mode text,
  description text,
  location text,
  employment_type text,
  experience_level text,
  salary_min integer,
  salary_max integer,
  salary_currency text,
  skills jsonb,
  created_at timestamp with time zone,
  job_slug text,
  similarity double precision
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.company, j.company_website, j.work_mode,
    j.description, j.location, j.employment_type, j.experience_level,
    j.salary_min, j.salary_max, j.salary_currency, j.skills,
    j.created_at, j.job_slug,
    (1 - (j.description_embedding <=> query_embedding))::double precision AS similarity
  FROM public.jobs j
  WHERE
    j.status = 'active'
    AND j.description_embedding IS NOT NULL
    AND (1 - (j.description_embedding <=> query_embedding))::double precision > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;
