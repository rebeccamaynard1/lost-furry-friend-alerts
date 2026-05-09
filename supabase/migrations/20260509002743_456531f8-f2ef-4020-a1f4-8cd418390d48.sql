
-- 1. Lock down SECURITY DEFINER functions that should NOT be callable via the API
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

-- Profile lookup functions: only signed-in users
REVOKE EXECUTE ON FUNCTION public.get_profile_display_name(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_display_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_display_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_display_names(uuid[]) TO authenticated;

-- has_role is used inside RLS by signed-in users; revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Drop the broad public SELECT policy on pet-photos so files cannot be listed.
-- The bucket is public, so direct file URLs continue to work for displaying images.
DROP POLICY IF EXISTS "pet-photos public read" ON storage.objects;
