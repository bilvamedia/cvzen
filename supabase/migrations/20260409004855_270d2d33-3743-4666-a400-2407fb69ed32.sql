
-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  optimized_resume_snapshot JSONB DEFAULT '[]'::jsonb,
  match_score DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Candidates can view own applications
CREATE POLICY "Candidates can view own applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = candidate_id);

-- Recruiters can view applications for their jobs
CREATE POLICY "Recruiters can view applications for own jobs"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.recruiter_id = auth.uid())
  );

-- Candidates can insert own applications
CREATE POLICY "Candidates can insert own applications"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = candidate_id
    AND has_role(auth.uid(), 'candidate'::app_role)
  );

-- Candidates can update own applications (withdraw)
CREATE POLICY "Candidates can update own applications"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_id);

-- Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update applications for own jobs"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.recruiter_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
