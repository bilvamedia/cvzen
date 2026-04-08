
-- Jobs table
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  description text NOT NULL,
  employment_type text NOT NULL DEFAULT 'full_time',
  experience_level text,
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  skills jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  description_embedding extensions.vector(768),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own jobs" ON public.jobs FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Authenticated users can view active jobs" ON public.jobs FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "Recruiters can insert own jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Recruiters can update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete own jobs" ON public.jobs FOR DELETE TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Interviews table
CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  recruiter_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'video',
  scheduling_type text NOT NULL DEFAULT 'fixed',
  proposed_times jsonb DEFAULT '[]'::jsonb,
  confirmed_time timestamp with time zone,
  duration_minutes integer NOT NULL DEFAULT 60,
  location_details text,
  video_link text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own interviews" ON public.interviews FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Candidates can view own interviews" ON public.interviews FOR SELECT TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can create interviews" ON public.interviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Recruiters can update own interviews" ON public.interviews FOR UPDATE TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Candidates can update own interviews" ON public.interviews FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can delete own interviews" ON public.interviews FOR DELETE TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
