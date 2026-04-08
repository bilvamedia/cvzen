
CREATE OR REPLACE FUNCTION public.get_candidate_shortlist_count(_candidate_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.shortlisted_candidates
  WHERE candidate_profile_id = _candidate_id;
$$;
