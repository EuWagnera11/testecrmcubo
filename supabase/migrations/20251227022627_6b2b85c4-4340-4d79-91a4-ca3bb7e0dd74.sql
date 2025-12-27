-- Parte 1: Apenas adicionar novos valores ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'copywriter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'traffic_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_media';

-- Tornar role opcional em project_members
ALTER TABLE public.project_members ALTER COLUMN role DROP NOT NULL;