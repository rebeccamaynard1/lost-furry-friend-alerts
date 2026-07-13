
-- 1. stripe_customer_id on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 2. role_requests table
CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.role_requests TO authenticated;
GRANT ALL ON public.role_requests TO service_role;

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role requests" ON public.role_requests;
CREATE POLICY "Users can view own role requests" ON public.role_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Users can create own role requests" ON public.role_requests;
CREATE POLICY "Users can create own role requests" ON public.role_requests
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND requested_role <> 'admin'
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Admins can update role requests" ON public.role_requests;
CREATE POLICY "Admins can update role requests" ON public.role_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS update_role_requests_updated_at ON public.role_requests;
CREATE TRIGGER update_role_requests_updated_at
BEFORE UPDATE ON public.role_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. On approval, grant the role
CREATE OR REPLACE FUNCTION public.apply_role_request_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, NEW.requested_role)
    ON CONFLICT DO NOTHING;
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_role_request_approval ON public.role_requests;
CREATE TRIGGER trg_apply_role_request_approval
BEFORE UPDATE ON public.role_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_role_request_approval();
