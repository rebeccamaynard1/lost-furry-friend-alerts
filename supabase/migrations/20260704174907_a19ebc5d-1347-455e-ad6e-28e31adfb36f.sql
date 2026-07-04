
-- Public read for lost_pets
CREATE POLICY "Anyone can view lost pets"
ON public.lost_pets FOR SELECT TO anon USING (true);
GRANT SELECT ON public.lost_pets TO anon;

-- Public read for found_pets
CREATE POLICY "Anyone can view found pets"
ON public.found_pets FOR SELECT TO anon USING (true);
GRANT SELECT ON public.found_pets TO anon;

-- Public read for sightings
CREATE POLICY "Anyone can view sightings"
ON public.sightings FOR SELECT TO anon USING (true);
GRANT SELECT ON public.sightings TO anon;

-- Fix shelters policy: replace has_role-in-USING (fails for anon) with split policies
DROP POLICY IF EXISTS "Public can view approved shelters" ON public.shelters;

CREATE POLICY "Anon can view approved shelters"
ON public.shelters FOR SELECT TO anon
USING (approved = true);

CREATE POLICY "Authenticated can view shelters"
ON public.shelters FOR SELECT TO authenticated
USING (approved = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.shelters TO anon;
