-- Adicionar cargo de líder de equipe ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_leader';