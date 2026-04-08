
-- Security definer function to get public resume sections for a profile
CREATE OR REPLACE FUNCTION public.get_public_resume_sections(_profile_id uuid)
RETURNS TABLE(
  id uuid,
  section_title text,
  section_type text,
  content jsonb,
  improved_content jsonb,
  display_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rs.id, rs.section_title, rs.section_type, rs.content, rs.improved_content, rs.display_order
  FROM public.resume_sections rs
  JOIN public.resumes r ON r.id = rs.resume_id
  WHERE r.user_id = _profile_id
    AND r.status = 'parsed'
    AND r.id = (
      SELECT r2.id FROM public.resumes r2
      WHERE r2.user_id = _profile_id AND r2.status = 'parsed'
      ORDER BY r2.created_at DESC LIMIT 1
    )
  ORDER BY rs.display_order ASC;
$$;
