
-- ============ PROFILES: owner + admin only ============
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Safe display-name lookup for messaging UI (no PII exposure)
CREATE OR REPLACE FUNCTION public.get_profile_display_name(_user_id uuid)
RETURNS TABLE(user_id uuid, name text, profile_photo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.profile_photo
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_profile_display_names(_user_ids uuid[])
RETURNS TABLE(user_id uuid, name text, profile_photo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.profile_photo
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_display_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_display_names(uuid[]) TO authenticated;

-- ============ FOUND_PETS: require auth ============
DROP POLICY IF EXISTS "Found pets are viewable by everyone" ON public.found_pets;
CREATE POLICY "Authenticated users can view found pets"
ON public.found_pets FOR SELECT TO authenticated
USING (true);

-- ============ SIGHTINGS: require auth ============
DROP POLICY IF EXISTS "Sightings are viewable by everyone" ON public.sightings;
CREATE POLICY "Authenticated users can view sightings"
ON public.sightings FOR SELECT TO authenticated
USING (true);

-- ============ pet-photos storage hardening ============
-- Drop any existing pet-photos policies to start clean
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%pet-photos%' OR policyname ILIKE '%pet photos%' OR qual ILIKE '%pet-photos%' OR with_check ILIKE '%pet-photos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Public read by direct URL (bucket stays public for img-tag rendering of existing photos)
CREATE POLICY "pet-photos public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'pet-photos');

-- Authenticated uploads only into own folder (path prefix = user_id)
CREATE POLICY "pet-photos authenticated insert own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "pet-photos authenticated update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "pet-photos owner or admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pet-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);
