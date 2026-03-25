
CREATE TABLE public.alabama_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rescue',
  county TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alabama_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alabama partners are viewable by everyone"
  ON public.alabama_partners FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can insert alabama partners"
  ON public.alabama_partners FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alabama partners"
  ON public.alabama_partners FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alabama partners"
  ON public.alabama_partners FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
