-- Drop the SECURITY DEFINER view (scanner flags it) and expose safe columns via a definer function instead.
DROP VIEW IF EXISTS public.alabama_partners_public;

CREATE OR REPLACE FUNCTION public.get_public_alabama_partners()
RETURNS TABLE(id uuid, name text, type text, county text, website text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, type, county, website, created_at
  FROM public.alabama_partners
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.get_public_alabama_partners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_alabama_partners() TO anon, authenticated;