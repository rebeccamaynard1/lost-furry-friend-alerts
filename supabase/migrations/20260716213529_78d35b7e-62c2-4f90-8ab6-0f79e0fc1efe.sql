CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  req_role text;
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  req_role := NEW.raw_user_meta_data->>'requested_role';
  IF req_role IS NOT NULL
     AND req_role IN ('shelter','volunteer','rural_partner','sponsor') THEN
    INSERT INTO public.role_requests (user_id, requested_role, status)
    VALUES (NEW.id, req_role::app_role, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;