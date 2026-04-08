-- Make vector operators available in public schema
CREATE OR REPLACE FUNCTION public.search_resume_sections(
  query_embedding extensions.vector,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 20,
  filter_section_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  resume_id uuid,
  section_title text,
  section_type text,
  content jsonb,
  improved_content jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.user_id,
    rs.resume_id,
    rs.section_title,
    rs.section_type,
    rs.content,
    rs.improved_content,
    (1 - (COALESCE(rs.improved_content_embedding, rs.content_embedding) <=> query_embedding))::float AS similarity
  FROM public.resume_sections rs
  JOIN public.resumes r ON r.id = rs.resume_id
  WHERE
    r.status = 'parsed'
    AND (rs.content_embedding IS NOT NULL OR rs.improved_content_embedding IS NOT NULL)
    AND (filter_section_type IS NULL OR rs.section_type = filter_section_type)
    AND (1 - (COALESCE(rs.improved_content_embedding, rs.content_embedding) <=> query_embedding))::float > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
