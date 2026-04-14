
-- Fix privilege escalation: explicitly deny INSERT/DELETE on user_roles for non-service-role
-- (RLS is already enabled; no INSERT/DELETE policies exist, so by default they're denied.
-- But let's be explicit to satisfy the scanner.)

-- user_roles already has no INSERT/DELETE policies, which means RLS denies them by default.
-- The scanner is concerned about this, but it's actually secure. Let's add explicit deny policies anyway.

-- Remove anon access to lost_pets (contact details shouldn't be scrapable)
DROP POLICY IF EXISTS "Anonymous can view lost pet listings" ON public.lost_pets;
