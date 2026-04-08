
-- Table to track unique likes/upvotes on public profiles
CREATE TABLE public.profile_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ensure one like per visitor per profile
CREATE UNIQUE INDEX idx_profile_likes_unique ON public.profile_likes (profile_id, visitor_hash);

-- Index for counting likes per profile
CREATE INDEX idx_profile_likes_profile ON public.profile_likes (profile_id);

-- Enable RLS
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view like counts
CREATE POLICY "Anyone can view likes"
ON public.profile_likes
FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert a like (uniqueness enforced by unique index)
CREATE POLICY "Anyone can insert a like"
ON public.profile_likes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
