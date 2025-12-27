-- Corrigir política RLS para permitir INSERT/UPDATE/DELETE por admins (com WITH CHECK)
DO $$
BEGIN
  -- Remove política antiga se existir
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Admins can manage all roles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can manage all roles" ON public.user_roles';
  END IF;
END $$;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));