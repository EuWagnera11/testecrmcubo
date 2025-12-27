-- Parte 2: Criar funções para verificar cargos globais
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_designer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'designer'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_copywriter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'copywriter'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_traffic_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'traffic_manager'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_social_media(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'social_media'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_director(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'director'
  )
$$;

-- Atualizar RLS de project_fields para usar cargos globais
DROP POLICY IF EXISTS "Copywriters can edit copy fields" ON public.project_fields;
DROP POLICY IF EXISTS "Designers can edit design fields" ON public.project_fields;
DROP POLICY IF EXISTS "Social media can edit social_media fields" ON public.project_fields;
DROP POLICY IF EXISTS "Traffic managers can edit traffic fields" ON public.project_fields;

CREATE POLICY "Copywriters can edit copy fields"
ON public.project_fields FOR UPDATE
USING (
  field_type = 'copy' 
  AND is_copywriter(auth.uid()) 
  AND is_project_participant(auth.uid(), project_id)
);

CREATE POLICY "Designers can edit design fields"
ON public.project_fields FOR UPDATE
USING (
  field_type = 'design' 
  AND is_designer(auth.uid()) 
  AND is_project_participant(auth.uid(), project_id)
);

CREATE POLICY "Social media can edit social_media fields"
ON public.project_fields FOR UPDATE
USING (
  field_type = 'social_media' 
  AND is_social_media(auth.uid()) 
  AND is_project_participant(auth.uid(), project_id)
);

CREATE POLICY "Traffic managers can edit traffic fields"
ON public.project_fields FOR UPDATE
USING (
  field_type = 'traffic' 
  AND is_traffic_manager(auth.uid()) 
  AND is_project_participant(auth.uid(), project_id)
);