
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT jsonb_build_object(
  'lost_nearby', true,
  'found_nearby', true,
  'sighting_nearby', true,
  'pet_match', true,
  'new_message', true,
  'approval', true
);
