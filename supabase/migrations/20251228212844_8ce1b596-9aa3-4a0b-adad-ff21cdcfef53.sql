-- Add metrics fields to project_social_calendar
ALTER TABLE public.project_social_calendar
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMP WITH TIME ZONE;

-- Create notifications table for post reminders
CREATE TABLE IF NOT EXISTS public.post_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.project_social_calendar(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'reminder',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_notifications
CREATE POLICY "Users can view notifications for their projects"
ON public.post_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_social_calendar psc
    JOIN public.projects p ON p.id = psc.project_id
    WHERE psc.id = post_notifications.post_id
    AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_project_participant(auth.uid(), p.id))
  )
);

CREATE POLICY "Users can create notifications for their projects"
ON public.post_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_social_calendar psc
    JOIN public.projects p ON p.id = psc.project_id
    WHERE psc.id = post_notifications.post_id
    AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_project_participant(auth.uid(), p.id))
  )
);

CREATE POLICY "Users can update notifications for their projects"
ON public.post_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_social_calendar psc
    JOIN public.projects p ON p.id = psc.project_id
    WHERE psc.id = post_notifications.post_id
    AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_project_participant(auth.uid(), p.id))
  )
);

CREATE POLICY "Users can delete notifications for their projects"
ON public.post_notifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_social_calendar psc
    JOIN public.projects p ON p.id = psc.project_id
    WHERE psc.id = post_notifications.post_id
    AND (p.user_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_project_participant(auth.uid(), p.id))
  )
);