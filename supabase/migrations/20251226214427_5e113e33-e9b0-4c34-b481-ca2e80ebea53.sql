-- Add status to clients for active/inactive
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add project_type and contract_type to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'one_time';

-- Add contract_type to contracts (monthly or one_time)
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'one_time';