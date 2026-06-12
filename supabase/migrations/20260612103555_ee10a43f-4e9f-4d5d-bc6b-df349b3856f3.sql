ALTER TABLE public.alert_boosts
  ADD COLUMN IF NOT EXISTS expiring_soon_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_alert_boosts_expiry_notify
  ON public.alert_boosts(expires_at)
  WHERE expiring_soon_notified_at IS NULL OR expired_notified_at IS NULL;