
-- Lost pets: restrict to authenticated users (contact info is needed for the app but not for anonymous visitors)
DROP POLICY IF EXISTS "Lost pets are viewable by everyone" ON public.lost_pets;

CREATE POLICY "Authenticated users can view lost pets"
ON public.lost_pets
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous to see lost pets on public pages (map, home) but without contact details
-- Since RLS can't filter columns, we allow anon read too but the app should hide contact fields for non-auth
CREATE POLICY "Anonymous can view lost pet listings"
ON public.lost_pets
FOR SELECT
TO anon
USING (true);
