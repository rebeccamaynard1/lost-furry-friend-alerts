
-- 1. Privilege escalation fix
DROP POLICY IF EXISTS "Users can self-assign non-admin roles" ON public.user_roles;

-- 2. Volunteers: restrict raw SELECT to owner + admin
DROP POLICY IF EXISTS "Authenticated users can view volunteers" ON public.volunteers;
CREATE POLICY "Owners and admins can view volunteer records"
  ON public.volunteers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Rural partners: restrict raw SELECT to owner + admin
DROP POLICY IF EXISTS "Authenticated users can view rural partners" ON public.rural_partners;
CREATE POLICY "Owners and admins can view rural partner records"
  ON public.rural_partners FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4. Public-safe directory RPCs (no phone/email)
CREATE OR REPLACE FUNCTION public.get_public_volunteers()
RETURNS TABLE (
  id uuid,
  name text,
  county text,
  skills text,
  availability text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, county, skills, availability, created_at
  FROM public.volunteers
  ORDER BY created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.get_public_rural_partners()
RETURNS TABLE (
  id uuid,
  name text,
  county text,
  hunting_area text,
  trail_cam_count int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, county, hunting_area,
         COALESCE(array_length(trail_cam_uploads, 1), 0) AS trail_cam_count,
         created_at
  FROM public.rural_partners
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.get_public_volunteers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_rural_partners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_volunteers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_rural_partners() TO anon, authenticated;
