
CREATE OR REPLACE FUNCTION public.get_profile_contact_for_recruiter(_profile_id uuid)
RETURNS TABLE(email text, phone text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.email, p.phone, p.address
  FROM public.profiles p
  WHERE p.id = _profile_id
    AND public.has_role(auth.uid(), 'recruiter')
  LIMIT 1;
$$;
