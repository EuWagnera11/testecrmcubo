-- Add monthly plan fields to clients table
ALTER TABLE public.clients 
ADD COLUMN monthly_plan_value numeric DEFAULT NULL,
ADD COLUMN plan_currency text DEFAULT 'BRL',
ADD COLUMN plan_start_date date DEFAULT NULL,
ADD COLUMN plan_billing_day integer DEFAULT 1;

-- Add included_in_plan field to projects table
ALTER TABLE public.projects 
ADD COLUMN included_in_plan boolean DEFAULT false;