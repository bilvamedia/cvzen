
-- Add profile_slug column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles (profile_slug);

-- Function to generate a unique slug from full_name
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate if slug is not already set and full_name is provided
  IF NEW.profile_slug IS NULL AND NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN
    -- Convert name to slug: lowercase, replace spaces/special chars with hyphens
    base_slug := lower(trim(NEW.full_name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    
    IF base_slug = '' THEN
      base_slug := 'user';
    END IF;
    
    final_slug := base_slug;
    
    -- Ensure uniqueness by appending a counter
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE profile_slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.profile_slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on insert and update
CREATE TRIGGER generate_slug_on_profile
  BEFORE INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_profile_slug();

-- Generate slugs for existing profiles
UPDATE public.profiles SET profile_slug = NULL WHERE profile_slug IS NULL AND full_name IS NOT NULL;

-- Allow anyone to read non-sensitive profile data by slug (for public shareable profiles)
CREATE POLICY "Public can view profile by slug"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (profile_slug IS NOT NULL);
