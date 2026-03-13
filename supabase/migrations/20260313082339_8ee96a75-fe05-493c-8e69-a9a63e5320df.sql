
-- Notifications table for in-app alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'alert',
  pet_id uuid,
  photo_url text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Donations table
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own donations" ON public.donations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create donations" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add boosted flag to lost_pets
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS boosted boolean DEFAULT false;
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS boosted_at timestamptz;

-- Add alert_radius_miles to profiles for premium
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alert_radius_miles integer DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
