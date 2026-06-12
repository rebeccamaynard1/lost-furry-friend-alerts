CREATE TABLE public.alert_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tier TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_price_id TEXT,
  amount_cents INTEGER,
  duration_days INTEGER NOT NULL DEFAULT 3,
  radius_miles INTEGER NOT NULL DEFAULT 15,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_boosts_user_id ON public.alert_boosts(user_id);
CREATE INDEX idx_alert_boosts_expires_at ON public.alert_boosts(expires_at);

GRANT SELECT ON public.alert_boosts TO authenticated;
GRANT ALL ON public.alert_boosts TO service_role;

ALTER TABLE public.alert_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own boosts"
  ON public.alert_boosts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all boosts"
  ON public.alert_boosts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_alert_boosts_updated_at
  BEFORE UPDATE ON public.alert_boosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();