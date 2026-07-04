-- Remove permissive anon SELECT on base alabama_partners table; expose only via view.
DROP POLICY IF EXISTS "Anon can view alabama partners public columns" ON public.alabama_partners;

-- Switch view to run as owner so anon can read via view without base-table RLS access.
ALTER VIEW public.alabama_partners_public SET (security_invoker = off);

-- Ensure anon/authenticated can read the safe public view.
GRANT SELECT ON public.alabama_partners_public TO anon, authenticated;

-- Revoke any lingering column-level grants on the base table from anon.
REVOKE ALL ON public.alabama_partners FROM anon;