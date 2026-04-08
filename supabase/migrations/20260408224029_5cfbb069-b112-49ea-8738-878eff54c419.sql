
CREATE TABLE public.shortlisted_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL,
  candidate_profile_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_profile_id)
);

ALTER TABLE public.shortlisted_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own shortlist"
ON public.shortlisted_candidates
FOR SELECT
TO authenticated
USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can add to shortlist"
ON public.shortlisted_candidates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND public.has_role(auth.uid(), 'recruiter')
);

CREATE POLICY "Recruiters can remove from shortlist"
ON public.shortlisted_candidates
FOR DELETE
TO authenticated
USING (auth.uid() = recruiter_id);
