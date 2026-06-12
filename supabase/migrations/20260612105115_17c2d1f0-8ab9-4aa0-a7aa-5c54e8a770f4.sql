
-- 1. Create protected contacts table
CREATE TABLE public.lost_pet_contacts (
  pet_id UUID PRIMARY KEY REFERENCES public.lost_pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_pet_contacts TO authenticated;
GRANT ALL ON public.lost_pet_contacts TO service_role;

ALTER TABLE public.lost_pet_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their pet contact"
  ON public.lost_pet_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their pet contact"
  ON public.lost_pet_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their pet contact"
  ON public.lost_pet_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their pet contact"
  ON public.lost_pet_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_lost_pet_contacts_updated_at
  BEFORE UPDATE ON public.lost_pet_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Backfill from existing lost_pets rows
INSERT INTO public.lost_pet_contacts (pet_id, user_id, contact_name, contact_phone, contact_email)
SELECT id, user_id, contact_name, contact_phone, contact_email
FROM public.lost_pets
ON CONFLICT (pet_id) DO NOTHING;

-- 3. Drop the exposed columns from lost_pets
ALTER TABLE public.lost_pets
  DROP COLUMN contact_name,
  DROP COLUMN contact_phone,
  DROP COLUMN contact_email;
