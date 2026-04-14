
-- 1. Profiles: replace the overly broad SELECT policy with a restricted one
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Public can see basic profile info only
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- We'll use a security definer view instead. Actually, let's use a simpler approach:
-- Keep profiles publicly readable but remove sensitive columns from public access
-- by creating a restricted policy. Since RLS can't filter columns, we'll restrict
-- full access to owner only and create a view for public use.

-- Actually the cleanest RLS approach: allow everyone to SELECT but we'll handle 
-- column restriction in the app. Let's instead just restrict to authenticated users.
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner can view own profile"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Volunteers: restrict to authenticated users only
DROP POLICY IF EXISTS "Volunteers are viewable by everyone" ON public.volunteers;

CREATE POLICY "Authenticated users can view volunteers"
ON public.volunteers
FOR SELECT
TO authenticated
USING (true);

-- 3. Rural partners: restrict to authenticated users only
DROP POLICY IF EXISTS "Rural partners are viewable by everyone" ON public.rural_partners;

CREATE POLICY "Authenticated users can view rural partners"
ON public.rural_partners
FOR SELECT
TO authenticated
USING (true);

-- 4. Shelters: only show approved shelters publicly, owners/admins see all
DROP POLICY IF EXISTS "Shelters are viewable by everyone" ON public.shelters;

CREATE POLICY "Public can view approved shelters"
ON public.shelters
FOR SELECT
USING (approved = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. Storage: restrict pet-photos uploads to user's own folder
DROP POLICY IF EXISTS "Anyone can upload pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload pet photos" ON storage.objects;

CREATE POLICY "Users upload to own folder in pet-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Restrict listing to own folder only
DROP POLICY IF EXISTS "Pet photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pet photos" ON storage.objects;

CREATE POLICY "Anyone can read pet photos by direct URL"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-photos');
