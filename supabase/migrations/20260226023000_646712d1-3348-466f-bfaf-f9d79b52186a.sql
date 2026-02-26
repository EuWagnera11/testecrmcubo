
-- Add new role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'programmer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'closer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'video_editor';
