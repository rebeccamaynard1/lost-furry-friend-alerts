
DROP VIEW IF EXISTS public.sponsors_public;

CREATE POLICY "Anon can view approved sponsors"
ON public.sponsors FOR SELECT TO anon
USING (approved = true);

GRANT SELECT (id, business_name, logo, website, tier, created_at, approved, user_id)
  ON public.sponsors TO anon;

CREATE VIEW public.sponsors_public
WITH (security_invoker = on) AS
SELECT id, business_name, logo, website, tier, created_at
FROM public.sponsors
WHERE approved = true;

GRANT SELECT ON public.sponsors_public TO anon, authenticated;
