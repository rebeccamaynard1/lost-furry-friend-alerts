-- Deduplicate alabama_partners by normalized email, keep the earliest row per email
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY lower(trim(email))
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.alabama_partners
  WHERE email IS NOT NULL AND trim(email) <> ''
)
DELETE FROM public.alabama_partners a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

-- Prevent future duplicate emails (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS alabama_partners_email_unique
  ON public.alabama_partners (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';