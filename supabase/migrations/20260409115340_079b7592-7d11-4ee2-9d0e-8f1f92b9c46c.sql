
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  suffix text;
  counter integer := 0;
BEGIN
  IF NEW.profile_slug IS NULL AND NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN
    base_slug := lower(trim(NEW.full_name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    
    IF base_slug = '' THEN
      base_slug := 'user';
    END IF;
    
    -- Always append a short alphanumeric suffix for uniqueness
    suffix := substr(md5(gen_random_uuid()::text), 1, 5);
    final_slug := base_slug || '-' || suffix;
    
    -- Ensure uniqueness (extremely unlikely collision but safe)
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE profile_slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      suffix := substr(md5(gen_random_uuid()::text), 1, 5);
      final_slug := base_slug || '-' || suffix;
      IF counter > 10 THEN
        final_slug := base_slug || '-' || suffix || counter;
        EXIT;
      END IF;
    END LOOP;
    
    NEW.profile_slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$function$;
