-- Add new columns to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS notify_projects boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_clients boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_approvals boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_start time DEFAULT null,
ADD COLUMN IF NOT EXISTS quiet_hours_end time DEFAULT null;