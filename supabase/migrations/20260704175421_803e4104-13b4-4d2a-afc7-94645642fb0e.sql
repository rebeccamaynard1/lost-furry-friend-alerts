
-- 1. found_pets: allow owner to delete
CREATE POLICY "Users can delete own found pet reports"
ON public.found_pets FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 2. Prevent self-approval on shelters and sponsors
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.approved := false;
    ELSIF TG_OP = 'UPDATE' AND NEW.approved IS DISTINCT FROM OLD.approved THEN
      NEW.approved := OLD.approved;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shelters_prevent_self_approval ON public.shelters;
CREATE TRIGGER shelters_prevent_self_approval
BEFORE INSERT OR UPDATE ON public.shelters
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

DROP TRIGGER IF EXISTS sponsors_prevent_self_approval ON public.sponsors;
CREATE TRIGGER sponsors_prevent_self_approval
BEFORE INSERT OR UPDATE ON public.sponsors
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

-- 3. Sponsors: hide email from public listing
DROP POLICY IF EXISTS "Approved sponsors are viewable" ON public.sponsors;

CREATE POLICY "Authenticated can view own or approved sponsors"
ON public.sponsors FOR SELECT TO authenticated
USING (approved = true OR auth.uid() = user_id);

CREATE OR REPLACE VIEW public.sponsors_public AS
SELECT id, business_name, logo, website, tier, created_at
FROM public.sponsors
WHERE approved = true;

GRANT SELECT ON public.sponsors_public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;
