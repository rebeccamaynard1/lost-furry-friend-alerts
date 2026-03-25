
-- Allow admins to update shelters (for approval)
CREATE POLICY "Admins can update shelters" ON public.shelters
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update sponsors (for approval)
CREATE POLICY "Admins can update sponsors" ON public.sponsors
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all sponsors (including unapproved)
CREATE POLICY "Admins can view all sponsors" ON public.sponsors
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
