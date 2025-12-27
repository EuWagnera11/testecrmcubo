CREATE OR REPLACE FUNCTION public.set_user_roles(_target_user uuid, _roles public.app_role[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can change roles
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Prevent admin from removing their own admin role (avoid lockout)
  IF _target_user = auth.uid() THEN
    IF _roles IS NULL OR array_position(_roles, 'admin'::public.app_role) IS NULL THEN
      RAISE EXCEPTION 'cannot remove own admin role';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user;

  IF _roles IS NOT NULL AND array_length(_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _target_user, r
    FROM unnest(_roles) AS r;
  END IF;
END;
$$;