
-- 1. Remove self-delete-roles policy: only admins should manage roles
DROP POLICY IF EXISTS "Users can remove own non-admin roles" ON public.user_roles;

-- 2. Revoke EXECUTE on internal email queue helpers from public roles.
--    These are only invoked by edge functions running as service_role.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Revoke EXECUTE on trigger-only functions from public roles (still callable by triggers).
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Revoke anon EXECUTE on auth-only helpers (still callable by signed-in users / RLS).
REVOKE EXECUTE ON FUNCTION public.get_profile_display_names(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_display_name(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
