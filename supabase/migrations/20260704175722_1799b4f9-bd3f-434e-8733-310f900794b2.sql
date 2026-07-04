
-- 1. Revoke EXECUTE on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_approval() FROM PUBLIC, anon, authenticated;

-- 2. alabama_partners: hide email/phone from anon; require sign-in
DROP POLICY IF EXISTS "Alabama partners are viewable by everyone" ON public.alabama_partners;

CREATE POLICY "Authenticated can view alabama partners"
ON public.alabama_partners FOR SELECT TO authenticated
USING (true);

-- Public directory view without contact PII
CREATE OR REPLACE VIEW public.alabama_partners_public
WITH (security_invoker = on) AS
SELECT id, name, type, county, website, created_at
FROM public.alabama_partners;

-- Anon can read the view; grant column-level SELECT on base table for the view to work under invoker mode
CREATE POLICY "Anon can view alabama partners public columns"
ON public.alabama_partners FOR SELECT TO anon
USING (true);

REVOKE SELECT ON public.alabama_partners FROM anon;
GRANT SELECT (id, name, type, county, website, created_at) ON public.alabama_partners TO anon;
GRANT SELECT ON public.alabama_partners_public TO anon, authenticated;
