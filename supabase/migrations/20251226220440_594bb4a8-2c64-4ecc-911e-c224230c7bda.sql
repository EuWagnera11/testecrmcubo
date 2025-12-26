-- Add cancelled_at field to projects for monthly project cancellation tracking
ALTER TABLE public.projects 
ADD COLUMN cancelled_at timestamp with time zone DEFAULT NULL;

-- Create monthly revenue goals table
CREATE TABLE public.monthly_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month date NOT NULL,
  revenue_goal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_goals
CREATE POLICY "Users can view their own monthly goals" 
ON public.monthly_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly goals" 
ON public.monthly_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly goals" 
ON public.monthly_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly goals" 
ON public.monthly_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_goals_updated_at
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();