-- Create financial transactions table
CREATE TABLE public.financial_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for financial_transactions (only directors/admins can see)
CREATE POLICY "Admins can manage all transactions"
ON public.financial_transactions FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Directors can view all transactions"
ON public.financial_transactions FOR SELECT
USING (has_role(auth.uid(), 'director'));

CREATE POLICY "Directors can manage their own transactions"
ON public.financial_transactions FOR ALL
USING (auth.uid() = user_id AND has_role(auth.uid(), 'director'));

CREATE POLICY "Users can create transactions"
ON public.financial_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for project_fields (for notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_fields;

-- Set replica identity for realtime
ALTER TABLE public.project_fields REPLICA IDENTITY FULL;