import { useState } from "react";
import { Database, Download, Copy, Check, Loader2, Table2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportTableToCSV } from "@/lib/csvExport";

const TABLE_CATEGORIES = [
  {
    label: "Clientes & Pipeline",
    tables: [
      "clients", "sales_pipeline", "pipeline_meetings", "webhook_leads",
      "proposals", "client_interactions", "client_files", "client_messages",
      "client_month_closures", "closure_commissions",
    ],
  },
  {
    label: "Projetos",
    tables: [
      "projects", "project_members", "project_tasks", "project_fields",
      "project_messages", "project_change_requests", "project_metrics",
      "project_creatives", "project_branding", "project_social_calendar",
      "project_copy_bank", "project_optimization_log", "project_alterations",
      "project_payouts", "project_audiovisual", "project_gmb",
      "project_crm_integration", "project_financial_advisory",
      "campaigns", "campaign_metrics",
    ],
  },
  {
    label: "Financeiro",
    tables: [
      "financial_transactions", "transaction_categories", "contracts",
      "contract_templates", "commission_rules", "payment_reminders",
      "monthly_goals",
    ],
  },
  {
    label: "WhatsApp",
    tables: [
      "whatsapp_contacts", "whatsapp_conversations", "whatsapp_messages",
      "whatsapp_instances", "whatsapp_contact_notes", "whatsapp_conversation_tags",
      "whatsapp_tags", "whatsapp_contact_memory", "agent_memory",
    ],
  },
  {
    label: "Usuários & Sistema",
    tables: [
      "profiles", "user_roles", "audit_logs", "activity_logs",
      "notification_preferences", "achievements", "onboarding_steps",
      "courses", "team_goals", "calendar_events", "dashboard_access_logs",
    ],
  },
  {
    label: "Automações & Templates",
    tables: [
      "automation_flows", "scheduled_reports", "project_templates",
      "quick_replies", "post_notifications",
    ],
  },
  {
    label: "IA & Chat",
    tables: [
      "ai_chat_conversations", "ai_chat_messages", "andre_crisis_log",
    ],
  },
];

const SCHEMA_SQL = `-- =============================================
-- SQL de criação das tabelas do sistema CUBO CRM
-- Gerado em: ${new Date().toISOString().slice(0, 10)}
-- =============================================

-- ENUM: app_role
CREATE TYPE public.app_role AS ENUM (
  'admin','director','team_leader','designer','copywriter',
  'traffic_manager','social_media','programmer','sdr','closer','video_editor'
);

-- ENUM: project_role
CREATE TYPE public.project_role AS ENUM ('director','manager','member','viewer');

-- =============================================
-- TABELA: profiles
-- =============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  status text NOT NULL DEFAULT 'pending',
  theme text,
  revenue_goal numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: user_roles
-- =============================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: clients
-- =============================================
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  country_code text,
  birthday date,
  notes text,
  status text NOT NULL DEFAULT 'active',
  monthly_plan_value numeric,
  plan_currency text,
  plan_start_date date,
  plan_billing_day integer,
  contract_renewal_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: projects
-- =============================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  project_type text,
  share_token text UNIQUE,
  share_enabled boolean DEFAULT false,
  monthly_fee numeric DEFAULT 0,
  ad_budget numeric DEFAULT 0,
  extra_costs numeric DEFAULT 0,
  modules text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: sales_pipeline
-- =============================================
CREATE TABLE public.sales_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  stage text NOT NULL DEFAULT 'lead',
  source text,
  notes text,
  expected_value numeric,
  assigned_to uuid,
  created_by uuid NOT NULL,
  priority text DEFAULT 'medium',
  next_action text,
  next_action_date timestamptz,
  lost_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sales_pipeline ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: pipeline_meetings
-- =============================================
CREATE TABLE public.pipeline_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_item_id uuid NOT NULL REFERENCES public.sales_pipeline(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  meeting_link text,
  location text,
  notes text,
  confirmation_sent_at timestamptz,
  reminder_sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pipeline_meetings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: financial_transactions
-- =============================================
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  category_id uuid REFERENCES public.transaction_categories(id),
  amount numeric NOT NULL DEFAULT 0,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_date date,
  payment_status text,
  project_id uuid REFERENCES public.projects(id),
  is_recurring boolean DEFAULT false,
  recurrence_type text,
  next_occurrence date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: contracts
-- =============================================
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  terms text,
  status text NOT NULL DEFAULT 'draft',
  contract_type text DEFAULT 'service',
  client_id uuid REFERENCES public.clients(id),
  project_id uuid REFERENCES public.projects(id),
  expiry_date date,
  auto_renew boolean DEFAULT false,
  renewal_reminder_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: campaigns
-- =============================================
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  name text NOT NULL,
  platform text,
  status text NOT NULL DEFAULT 'active',
  objective text,
  budget numeric,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: campaign_metrics
-- =============================================
CREATE TABLE public.campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  impressions integer,
  clicks integer,
  spend numeric,
  conversions integer,
  leads integer,
  reach integer,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  cost_per_lead numeric,
  cost_per_conversion numeric,
  revenue numeric,
  roas numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA: whatsapp_instances
-- =============================================
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  status text DEFAULT 'disconnected',
  phone_number text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCOES DE SEGURANCA
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_participant(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
  ) OR public.is_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.set_user_roles(_target_user uuid, _roles app_role[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _target_user = auth.uid() THEN
    IF _roles IS NULL OR array_position(_roles, 'admin'::public.app_role) IS NULL THEN
      RAISE EXCEPTION 'cannot remove own admin role';
    END IF;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user;
  IF _roles IS NOT NULL AND array_length(_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _target_user, r FROM unnest(_roles) AS r;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN NEW.email = 'euwagnerofficial@gmail.com' THEN 'approved' ELSE 'pending' END
  );
  IF NEW.email = 'euwagnerofficial@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text, _table_name text DEFAULT NULL, _record_id text DEFAULT NULL,
  _old_data jsonb DEFAULT NULL, _new_data jsonb DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data);
END;
$$;
`;

export default function DataExport() {
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const handleExport = async (tableName: string) => {
    setLoading(tableName);
    try {
      const count = await exportTableToCSV(tableName);
      toast.success(`${tableName}: ${count} registros exportados`);
    } catch (err: any) {
      toast.error(err?.message === "Tabela vazia" ? `${tableName} está vazia` : `Erro ao exportar ${tableName}`);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    let success = 0;
    let empty = 0;
    let errors = 0;

    for (const cat of TABLE_CATEGORIES) {
      for (const table of cat.tables) {
        try {
          await exportTableToCSV(table);
          success++;
        } catch (err: any) {
          if (err?.message === "Tabela vazia") empty++;
          else errors++;
        }
        // Small delay to avoid overwhelming the browser
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    toast.success(`Exportação completa: ${success} tabelas exportadas, ${empty} vazias, ${errors} erros`);
    setExportingAll(false);
  };

  const handleCopySQL = async () => {
    await navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    toast.success("SQL copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exporte dados em CSV ou copie o SQL das tabelas para migração
          </p>
        </div>
      </div>

      <Tabs defaultValue="csv" className="space-y-4">
        <TabsList>
          <TabsTrigger value="csv" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </TabsTrigger>
          <TabsTrigger value="sql" className="gap-2">
            <Table2 className="h-4 w-4" />
            SQL das Tabelas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleExportAll} disabled={exportingAll} className="gap-2">
              {exportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exportingAll ? "Exportando..." : "Exportar Tudo"}
            </Button>
          </div>

          {TABLE_CATEGORIES.map((cat) => (
            <Card key={cat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  {cat.label}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {cat.tables.length} tabelas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {cat.tables.map((table) => (
                    <Button
                      key={table}
                      variant="outline"
                      size="sm"
                      className="justify-between text-xs font-mono h-9"
                      disabled={loading === table || exportingAll}
                      onClick={() => handleExport(table)}
                    >
                      <span className="truncate">{table}</span>
                      {loading === table ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-2 flex-shrink-0" />
                      ) : (
                        <Download className="h-3 w-3 ml-2 flex-shrink-0 text-muted-foreground" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sql" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCopySQL} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar SQL"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <pre className="p-4 text-xs font-mono text-foreground bg-muted/30 rounded-lg overflow-auto max-h-[70vh] whitespace-pre-wrap">
                {SCHEMA_SQL}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
