
-- Add new columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_website text,
  ADD COLUMN IF NOT EXISTS work_mode text NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS job_slug text;

-- Create unique index on job_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs (job_slug) WHERE job_slug IS NOT NULL;

-- Create function to generate job slug
CREATE OR REPLACE FUNCTION public.generate_job_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.job_slug IS NULL AND NEW.title IS NOT NULL AND NEW.company IS NOT NULL THEN
    base_slug := lower(trim(NEW.title || ' at ' || NEW.company));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');

    IF base_slug = '' THEN
      base_slug := 'job';
    END IF;

    final_slug := base_slug;

    WHILE EXISTS (SELECT 1 FROM public.jobs WHERE job_slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.job_slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS generate_job_slug_trigger ON public.jobs;
CREATE TRIGGER generate_job_slug_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_job_slug();

-- Create a security definer function for public job viewing
CREATE OR REPLACE FUNCTION public.get_public_job_by_slug(_slug text)
RETURNS TABLE(
  id uuid, title text, company text, company_website text, work_mode text,
  description text, location text, employment_type text, experience_level text,
  salary_min integer, salary_max integer, salary_currency text, skills jsonb,
  created_at timestamptz, job_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id, j.title, j.company, j.company_website, j.work_mode,
         j.description, j.location, j.employment_type, j.experience_level,
         j.salary_min, j.salary_max, j.salary_currency, j.skills,
         j.created_at, j.job_slug
  FROM public.jobs j
  WHERE j.job_slug = _slug AND j.status = 'active'
  LIMIT 1;
$$;

-- Allow anon users to call this function (for public job pages)
-- RLS policy for anon to view active jobs by slug
CREATE POLICY "Anyone can view active jobs by slug"
  ON public.jobs
  FOR SELECT
  TO anon
  USING (status = 'active');
