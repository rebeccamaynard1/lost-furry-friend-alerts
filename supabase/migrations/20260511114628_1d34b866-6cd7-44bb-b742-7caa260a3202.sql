
-- Allow users to self-assign non-admin roles (admin must be granted manually)
CREATE POLICY "Users can self-assign non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role <> 'admin'::app_role
);

-- Allow users to remove their own non-admin roles (e.g. opt out of volunteer)
CREATE POLICY "Users can remove own non-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND role <> 'admin'::app_role
);

-- Admins manage all roles (including admin grants)
CREATE POLICY "Admins can insert any role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
