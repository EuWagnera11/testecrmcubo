-- Create enum for app roles (global)
CREATE TYPE public.app_role AS ENUM ('admin', 'director', 'user');

-- Create enum for project roles (specific to projects)
CREATE TYPE public.project_role AS ENUM ('director', 'designer', 'copywriter', 'traffic_manager', 'social_media');

-- Create user_roles table for global roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Add approval status to profiles
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create project_members table for project-specific roles
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role project_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id, role)
);

-- Create project_fields table to store editable content per role
CREATE TABLE public.project_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('design', 'copy', 'traffic', 'social_media', 'general')),
  content TEXT,
  attachments TEXT[],
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_fields ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check global role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create function to check project role
CREATE OR REPLACE FUNCTION public.has_project_role(_user_id UUID, _project_id UUID, _role project_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role = _role
  )
$$;

-- Create function to check if user is director on project
CREATE OR REPLACE FUNCTION public.is_project_director(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role = 'director'
  ) OR public.is_admin(_user_id)
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for project_members
CREATE POLICY "Admins can manage all project members"
ON public.project_members
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage project members"
ON public.project_members
FOR ALL
USING (public.is_project_director(auth.uid(), project_id));

CREATE POLICY "Users can view project members of their projects"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
  )
);

-- RLS Policies for project_fields
CREATE POLICY "Admins can manage all project fields"
ON public.project_fields
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Directors can manage all project fields"
ON public.project_fields
FOR ALL
USING (public.is_project_director(auth.uid(), project_id));

CREATE POLICY "Project members can view all fields"
ON public.project_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_fields.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Designers can edit design fields"
ON public.project_fields
FOR UPDATE
USING (
  field_type = 'design' AND
  public.has_project_role(auth.uid(), project_id, 'designer')
);

CREATE POLICY "Copywriters can edit copy fields"
ON public.project_fields
FOR UPDATE
USING (
  field_type = 'copy' AND
  public.has_project_role(auth.uid(), project_id, 'copywriter')
);

CREATE POLICY "Traffic managers can edit traffic fields"
ON public.project_fields
FOR UPDATE
USING (
  field_type = 'traffic' AND
  public.has_project_role(auth.uid(), project_id, 'traffic_manager')
);

CREATE POLICY "Social media can edit social_media fields"
ON public.project_fields
FOR UPDATE
USING (
  field_type = 'social_media' AND
  public.has_project_role(auth.uid(), project_id, 'social_media')
);

-- Update profiles policies to allow admins to manage all
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Create trigger for project_fields updated_at
CREATE TRIGGER update_project_fields_updated_at
BEFORE UPDATE ON public.project_fields
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_fields_project_id ON public.project_fields(project_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Insert admin role for the specified user (will be done after user registers)
-- This will be handled via a seed or manual insert