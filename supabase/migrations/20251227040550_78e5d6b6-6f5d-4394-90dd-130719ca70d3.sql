-- Create a table for team-wide monthly goals (only admins/directors can set)
CREATE TABLE public.team_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month VARCHAR(7) NOT NULL UNIQUE, -- Format: YYYY-MM
  revenue_goal NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_goals ENABLE ROW LEVEL SECURITY;

-- Everyone can view team goals
CREATE POLICY "Team goals are viewable by everyone"
ON public.team_goals
FOR SELECT
USING (true);

-- Only admins and directors can manage team goals
CREATE POLICY "Admins and directors can insert team goals"
ON public.team_goals
FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) OR public.is_director(auth.uid())
);

CREATE POLICY "Admins and directors can update team goals"
ON public.team_goals
FOR UPDATE
USING (
  public.is_admin(auth.uid()) OR public.is_director(auth.uid())
);

CREATE POLICY "Admins and directors can delete team goals"
ON public.team_goals
FOR DELETE
USING (
  public.is_admin(auth.uid()) OR public.is_director(auth.uid())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_team_goals_updated_at
BEFORE UPDATE ON public.team_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();