-- Fix trigger to also generate slug on UPDATE when profile_slug is still null
DROP TRIGGER IF EXISTS generate_slug_on_profile ON public.profiles;

CREATE TRIGGER generate_slug_on_profile
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.profile_slug IS NULL AND NEW.full_name IS NOT NULL AND NEW.full_name <> '')
  EXECUTE FUNCTION public.generate_profile_slug();

-- Backfill: force slug generation for profiles that have a name but no slug
UPDATE public.profiles
SET updated_at = now()
WHERE profile_slug IS NULL AND full_name IS NOT NULL AND full_name <> '';