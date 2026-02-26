import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tool definitions ────────────────────────────────────────────────────────

const tools = [
  // ─── PROJECTS ─────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "List projects. Returns id, name, status, client_name, project_type, created_at.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "active, planning, in_progress, completed, cancelled" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_details",
      description: "Get full details of a project including client info, task counts and fields.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project. Use list_clients first to get client_id.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          client_id: { type: "string", description: "Client UUID" },
          project_type: { type: "string", description: "social_media, traffic, branding, audiovisual, financial_advisory, social_ai, crm_integration, gmb, one_time" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update project name or status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", description: "active, planning, in_progress, completed, cancelled" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Delete a project by ID. DESTRUCTIVE action.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },

  // ─── CLIENTS ──────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "List clients/clinics. Returns id, name, company, email, phone, status, monthly_plan_value.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "active, inactive, lead" },
          search: { type: "string", description: "Search by name or company" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "Create a new client/clinic.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          company: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          status: { type: "string", description: "active, inactive, lead" },
          monthly_plan_value: { type: "number" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update client data.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          name: { type: "string" },
          company: { type: "string" },
          status: { type: "string" },
          monthly_plan_value: { type: "number" },
          email: { type: "string" },
          phone: { type: "string" },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: "Delete a client by ID. DESTRUCTIVE action.",
      parameters: { type: "object", properties: { client_id: { type: "string" } }, required: ["client_id"] },
    },
  },

  // ─── TASKS ────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List tasks for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          status: { type: "string", description: "todo, in_progress, review, done" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task in a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", description: "low, medium, high, urgent" },
          due_date: { type: "string", description: "ISO date" },
          assigned_to: { type: "string", description: "User UUID (use list_team_members to find)" },
        },
        required: ["project_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update a task's status, priority, assignment, title, or due date.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          title: { type: "string" },
          status: { type: "string", description: "todo, in_progress, review, done" },
          priority: { type: "string", description: "low, medium, high, urgent" },
          assigned_to: { type: "string" },
          due_date: { type: "string" },
          description: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task by ID.",
      parameters: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
    },
  },

  // ─── FINANCIAL ────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get financial summary with income, expenses, balance, grouped by category.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "ISO date" },
          end_date: { type: "string", description: "ISO date" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description: "List individual financial transactions with filters.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "income or expense" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_transaction",
      description: "Create a financial transaction (income or expense).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "income or expense" },
          category: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          date: { type: "string", description: "ISO date" },
          project_id: { type: "string" },
          payment_status: { type: "string", description: "pending, paid, overdue" },
          due_date: { type: "string" },
        },
        required: ["type", "category", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description: "Delete a financial transaction by ID.",
      parameters: { type: "object", properties: { transaction_id: { type: "string" } }, required: ["transaction_id"] },
    },
  },

  // ─── CALENDAR ─────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "List calendar events, optionally filtered by date range.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          start_date: { type: "string", description: "ISO datetime" },
          end_date: { type: "string", description: "ISO datetime" },
          event_type: { type: "string", description: "meeting, deadline, reminder, other" },
          project_id: { type: "string" },
          client_id: { type: "string" },
          all_day: { type: "boolean" },
        },
        required: ["title", "start_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description: "Update a calendar event (title, description, start_date, end_date, event_type, color, all_day).",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          start_date: { type: "string", description: "ISO datetime" },
          end_date: { type: "string", description: "ISO datetime" },
          event_type: { type: "string", description: "meeting, deadline, reminder, other" },
          color: { type: "string", description: "Hex color e.g. #3b82f6" },
          all_day: { type: "boolean" },
        },
        required: ["event_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Delete a calendar event by ID.",
      parameters: { type: "object", properties: { event_id: { type: "string" } }, required: ["event_id"] },
    },
  },

  // ─── CONTRACTS ────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_contract_templates",
      description: "List available contract templates. Use to find a template before creating a contract with its terms.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_contracts",
      description: "List contracts with optional status filter.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "active, expired, cancelled, draft" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_contract",
      description: "Create a new contract. Use list_contract_templates first if user wants to use a template, then pass the template terms.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          client_id: { type: "string" },
          project_id: { type: "string" },
          contract_type: { type: "string", description: "one_time, monthly, quarterly, yearly" },
          terms: { type: "string", description: "Contract terms/body text" },
          expiry_date: { type: "string", description: "ISO date" },
          status: { type: "string", description: "draft, active, expired, cancelled" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_contract",
      description: "Update a contract's status, terms or expiry.",
      parameters: {
        type: "object",
        properties: {
          contract_id: { type: "string" },
          status: { type: "string" },
          terms: { type: "string" },
          expiry_date: { type: "string" },
          title: { type: "string" },
        },
        required: ["contract_id"],
      },
    },
  },

  // ─── CAMPAIGNS ────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_campaigns",
      description: "List ad campaigns for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          status: { type: "string", description: "active, paused, completed" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Create an ad campaign for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          name: { type: "string" },
          platform: { type: "string", description: "facebook, google, instagram, tiktok, linkedin" },
          budget: { type: "number" },
          objective: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
        required: ["project_id", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_campaign_metrics",
      description: "Get performance metrics for a campaign (spend, clicks, impressions, leads, conversions, ROAS, CPC, CPL, CTR).",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
        required: ["campaign_id"],
      },
    },
  },

  // ─── COMMISSIONS ──────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_commissions_summary",
      description: "Get commissions summary for a period (YYYY-MM).",
      parameters: {
        type: "object",
        properties: {
          period_key: { type: "string", description: "YYYY-MM format" },
        },
      },
    },
  },

  // ─── TEAM ─────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_team_members",
      description: "List team members with their roles. Use to find user IDs for task assignment.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "admin, director, team_leader, designer, copywriter, traffic_manager, social_media, programmer, sdr, closer, video_editor" },
        },
      },
    },
  },

  // ─── SOCIAL CALENDAR ──────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_social_posts",
      description: "List social media posts from the calendar for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          status: { type: "string", description: "scheduled, published, draft" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_social_post",
      description: "Schedule a social media post in the calendar.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          platform: { type: "string", description: "instagram, facebook, linkedin, tiktok, twitter" },
          scheduled_date: { type: "string", description: "ISO date" },
          scheduled_time: { type: "string", description: "HH:MM format" },
          hashtags: { type: "string" },
          status: { type: "string", description: "draft, scheduled, published" },
        },
        required: ["project_id", "title", "platform", "scheduled_date"],
      },
    },
  },

  // ─── AUTOMATIONS ──────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_automations",
      description: "List automation flows/workflows.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "backlog, in_progress, active, paused, done" },
          client_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_automation",
      description: "Create a new automation flow/workflow.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          client_id: { type: "string" },
          project_id: { type: "string" },
          category: { type: "string", description: "whatsapp, email, crm, social, other" },
          priority: { type: "string", description: "low, medium, high, urgent" },
          n8n_workflow_url: { type: "string" },
        },
        required: ["name"],
      },
    },
  },

  // ─── PAYOUTS ──────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_payouts",
      description: "List project payouts (team member payments).",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          paid: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_payout",
      description: "Create a payout for a team member on a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          role: { type: "string" },
          amount: { type: "number" },
          member_name: { type: "string" },
          user_id: { type: "string" },
          description: { type: "string" },
        },
        required: ["project_id", "role", "amount"],
      },
    },
  },

  // ─── CLIENT INTERACTIONS ──────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_client_interactions",
      description: "List interaction history for a client (calls, meetings, emails).",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          type: { type: "string", description: "call, meeting, email, whatsapp, note" },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client_interaction",
      description: "Log a client interaction (call, meeting, email, etc).",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          type: { type: "string", description: "call, meeting, email, whatsapp, note" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["client_id", "type", "title"],
      },
    },
  },

  // ─── CHANGE REQUESTS ──────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_change_requests",
      description: "List change requests for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          status: { type: "string", description: "pending, approved, rejected, completed" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_change_request",
      description: "Create a change request for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          description: { type: "string" },
          notes: { type: "string" },
        },
        required: ["project_id", "description"],
      },
    },
  },

  // ─── COURSES ──────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_courses",
      description: "List training courses available in the system.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
        },
      },
    },
  },

  // ─── PROPOSALS / PIPELINE ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_proposals",
      description: "List proposals in the pipeline (kanban). Returns id, title, status, value, client info.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "lead, contact, proposal, negotiation, won, lost" },
        },
      },
    },
  },

  // ─── MONTHLY CLOSURES ─────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_client_closures",
      description: "List monthly closures for a client with performance data.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          limit: { type: "number" },
        },
        required: ["client_id"],
      },
    },
  },

  // ─── ACTIVITY LOG ─────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_activity_logs",
      description: "List recent activity/audit logs for a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          limit: { type: "number" },
        },
        required: ["project_id"],
      },
    },
  },

  // ─── PROJECT MODULES ──────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_project_strategy",
      description: "Get strategy data for a project: offer_big_idea, personas, funnel_structure, landing_page_url, landing_page_test_url.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_strategy",
      description: "Create or update project strategy. Fields: offer_big_idea, personas, funnel_structure, landing_page_url, landing_page_test_url.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          offer_big_idea: { type: "string" },
          personas: { type: "string" },
          funnel_structure: { type: "string" },
          landing_page_url: { type: "string" },
          landing_page_test_url: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_technical_setup",
      description: "Get technical setup: meta_pixel_id, tiktok_pixel_id, ad_account_id, capi_status, utm_pattern, ads_manager_link, drive_link.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_technical_setup",
      description: "Create or update technical setup. Fields: meta_pixel_id, tiktok_pixel_id, ad_account_id, capi_status, utm_pattern, ads_manager_link, drive_link.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          meta_pixel_id: { type: "string" },
          tiktok_pixel_id: { type: "string" },
          ad_account_id: { type: "string" },
          capi_status: { type: "string" },
          utm_pattern: { type: "string" },
          ads_manager_link: { type: "string" },
          drive_link: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_branding",
      description: "Get branding data: positioning_statement, brand_voice, color_palette, typography_notes, visual_identity_notes, target_audience, competitors, brand_guidelines_url.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_branding",
      description: "Create or update branding. Fields: positioning_statement, brand_voice, color_palette, typography_notes, visual_identity_notes, target_audience, competitors, brand_guidelines_url.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          positioning_statement: { type: "string" },
          brand_voice: { type: "string" },
          color_palette: { type: "string" },
          typography_notes: { type: "string" },
          visual_identity_notes: { type: "string" },
          target_audience: { type: "string" },
          competitors: { type: "string" },
          brand_guidelines_url: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_social_media",
      description: "Get social media config: platforms, posting_frequency, content_pillars, brand_voice, hashtag_strategy, engagement_goals.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_social_media",
      description: "Create or update social media config. Fields: platforms (array), posting_frequency, content_pillars, brand_voice, hashtag_strategy, engagement_goals.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          platforms: { type: "array", items: { type: "string" } },
          posting_frequency: { type: "string" },
          content_pillars: { type: "string" },
          brand_voice: { type: "string" },
          hashtag_strategy: { type: "string" },
          engagement_goals: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_audiovisual",
      description: "Get audiovisual config: video_types, production_notes, equipment_requirements, delivery_formats, style_references, script_notes.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_audiovisual",
      description: "Create or update audiovisual config. Fields: video_types (array), production_notes, equipment_requirements, delivery_formats, style_references, script_notes.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          video_types: { type: "array", items: { type: "string" } },
          production_notes: { type: "string" },
          equipment_requirements: { type: "string" },
          delivery_formats: { type: "string" },
          style_references: { type: "string" },
          script_notes: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_crm_integration",
      description: "Get CRM integration: crm_platform, api_endpoint, fields_mapped, integration_status, sync_frequency, last_sync_at, notes.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_crm_integration",
      description: "Create or update CRM integration. Fields: crm_platform, api_endpoint, fields_mapped, integration_status, sync_frequency, notes.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          crm_platform: { type: "string" },
          api_endpoint: { type: "string" },
          fields_mapped: { type: "string" },
          integration_status: { type: "string" },
          sync_frequency: { type: "string" },
          notes: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_financial_advisory",
      description: "Get project financial advisory data: budget_analysis, cash_flow_notes, financial_goals, investment_recommendations, report_frequency.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_financial_advisory",
      description: "Create or update project financial advisory fields: budget_analysis, cash_flow_notes, financial_goals, investment_recommendations, report_frequency.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          budget_analysis: { type: "string" },
          cash_flow_notes: { type: "string" },
          financial_goals: { type: "string" },
          investment_recommendations: { type: "string" },
          report_frequency: { type: "string" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_copy_bank",
      description: "List copy bank entries for a project. Each has: angle, content, status.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project_copy",
      description: "Add a copy to the project copy bank. Fields: angle, content, status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          angle: { type: "string" },
          content: { type: "string" },
          status: { type: "string", description: "active, paused, testing" },
        },
        required: ["project_id", "angle", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_creatives",
      description: "List creatives for a project. Each has: title, media_url, media_type, tags, dark_post_id, status.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project_creative",
      description: "Add a creative to the project. Fields: title, media_url, media_type, tags (array), dark_post_id, status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          title: { type: "string" },
          media_url: { type: "string" },
          media_type: { type: "string", description: "image, video, carousel" },
          tags: { type: "array", items: { type: "string" } },
          dark_post_id: { type: "string" },
        },
        required: ["project_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_tests",
      description: "List A/B tests for a project. Each has: hypothesis, variables, result, learnings, status.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project_test",
      description: "Create a test/experiment. Fields: hypothesis, variables, status.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          hypothesis: { type: "string" },
          variables: { type: "string" },
          status: { type: "string", description: "planned, running, completed" },
        },
        required: ["project_id", "hypothesis"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_optimization_log",
      description: "List optimization log entries for a project. Each has: action_date, action_description, reason.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project_optimization_log",
      description: "Add an optimization log entry. Fields: action_description, reason, action_date.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          action_description: { type: "string" },
          reason: { type: "string" },
          action_date: { type: "string", description: "ISO date" },
        },
        required: ["project_id", "action_description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_members",
      description: "List members assigned to a specific project with their roles.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },

  // ─── PROJECT FIELDS (Campos tab) ──────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_project_fields",
      description: "List all fields (Campos) for a project. Each has: field_type, content, link_url, attachments.",
      parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_project_field",
      description: "Create or update a project field (Campo). Use field_type as the key identifier (e.g. 'briefing', 'landing_page', 'drive', 'observacoes', 'referencias', or any custom name). You can set content (text), link_url (a URL/link), and attachments (array of URLs).",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          field_type: { type: "string", description: "Field identifier, e.g. 'briefing', 'landing_page', 'drive', 'observacoes', 'referencias', 'logo', etc." },
          content: { type: "string", description: "Text content for this field" },
          link_url: { type: "string", description: "URL/link to attach to this field" },
          attachments: { type: "array", items: { type: "string" }, description: "Array of file/image URLs" },
        },
        required: ["project_id", "field_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project_field",
      description: "Delete a project field by ID.",
      parameters: { type: "object", properties: { field_id: { type: "string" } }, required: ["field_id"] },
    },
  },

  // ─── CLIENT FILES ─────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "list_client_files",
      description: "List files attached to a client.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          project_id: { type: "string", description: "Optional: filter by project" },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client_file",
      description: "Attach a file reference to a client. Provide a title and URL (link to Drive, Dropbox, or any external file).",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          project_id: { type: "string" },
          title: { type: "string" },
          url: { type: "string", description: "File URL (Google Drive, Dropbox, direct link, etc.)" },
          description: { type: "string" },
          file_type: { type: "string", description: "image, video, document, spreadsheet, presentation, other" },
        },
        required: ["client_id", "title", "url"],
      },
    },
  },

  // ─── PROJECT MEMBER MANAGEMENT ────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "add_project_member",
      description: "Add a team member to a project. Use list_team_members first to get the user_id.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          user_id: { type: "string", description: "User UUID to add" },
          role: { type: "string", description: "Project role: director, designer, copywriter, traffic_manager, social_media" },
        },
        required: ["project_id", "user_id", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_project_member",
      description: "Remove a team member from a project.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          user_id: { type: "string", description: "User UUID to remove" },
        },
        required: ["project_id", "user_id"],
      },
    },
  },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_REGEX.test(v);

const PROJECT_SCOPED_TOOLS = new Set([
  "get_project_details",
  "list_tasks",
  "create_task",
  "list_campaigns",
  "create_campaign",
  "list_social_posts",
  "create_social_post",
  "list_change_requests",
  "create_change_request",
  "list_payouts",
  "create_payout",
  "list_activity_logs",
  "get_project_strategy",
  "upsert_project_strategy",
  "get_project_technical_setup",
  "upsert_project_technical_setup",
  "get_project_branding",
  "upsert_project_branding",
  "get_project_social_media",
  "upsert_project_social_media",
  "get_project_audiovisual",
  "upsert_project_audiovisual",
  "get_project_crm_integration",
  "upsert_project_crm_integration",
  "get_project_financial_advisory",
  "upsert_project_financial_advisory",
  "list_project_copy_bank",
  "create_project_copy",
  "list_project_creatives",
  "create_project_creative",
  "list_project_tests",
  "create_project_test",
  "list_project_optimization_log",
  "create_project_optimization_log",
  "list_project_members",
  "add_project_member",
  "remove_project_member",
  "list_project_fields",
  "upsert_project_field",
  "delete_project_field",
  "list_client_files",
  "create_client_file",
]);

async function resolveProjectId(
  rawProjectId: unknown,
  currentProjectId: string | null,
  supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  if (isUuid(rawProjectId)) {
    const { data: byRawId } = await supabase.from("projects").select("id").eq("id", rawProjectId).maybeSingle();
    if (byRawId?.id) return byRawId.id;
  }

  if (isUuid(currentProjectId)) {
    const { data: byContextId } = await supabase.from("projects").select("id").eq("id", currentProjectId).maybeSingle();
    if (byContextId?.id) return byContextId.id;
  }

  if (typeof rawProjectId !== "string") return null;
  const query = rawProjectId.trim();
  if (!query) return null;

  const { data: exactByName } = await supabase
    .from("projects")
    .select("id")
    .ilike("name", query)
    .limit(2);

  if (exactByName && exactByName.length === 1) {
    return exactByName[0].id;
  }

  const { data: partialByName } = await supabase
    .from("projects")
    .select("id")
    .ilike("name", `%${query}%`)
    .limit(2);

  if (partialByName && partialByName.length === 1) {
    return partialByName[0].id;
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .or(`name.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(3);

  const clientIds = (clients || []).map((c: any) => c.id);
  if (clientIds.length) {
    const { data: byClient } = await supabase
      .from("projects")
      .select("id")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false })
      .limit(2);

    if (byClient && byClient.length === 1) {
      return byClient[0].id;
    }
  }

  return null;
}

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  currentProjectId: string | null,
) {
  if (PROJECT_SCOPED_TOOLS.has(name)) {
    const resolvedProjectId = await resolveProjectId(args.project_id, currentProjectId, supabase);
    if (!resolvedProjectId) {
      return {
        error: "Não consegui identificar o projeto desta ação. Informe o nome exato do projeto ou abra o projeto correto antes de pedir preenchimento.",
      };
    }
    args.project_id = resolvedProjectId;
  }

  switch (name) {
    case "list_projects": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, client_id, created_at, project_type, clients(name, company)")
        .order("created_at", { ascending: false })
        .limit((args.limit as number) || 20);
      if (error) {
        const fb = await supabase.from("projects").select("id, name, status, client_id, created_at, project_type").order("created_at", { ascending: false }).limit((args.limit as number) || 20);
        if (fb.error) throw fb.error;
        return fb.data;
      }
      return (data || []).map((p: any) => ({ id: p.id, name: p.name, status: p.status, client_id: p.client_id, client_name: p.clients?.name || p.clients?.company || null, created_at: p.created_at, project_type: p.project_type }));
    }

    case "get_project_details": {
      const { data, error } = await supabase.from("projects").select("*, clients(name, company, email)").eq("id", args.project_id).single();
      if (error) throw error;
      const { data: tasks } = await supabase.from("project_tasks").select("status").eq("project_id", args.project_id);
      const tc = { total: tasks?.length || 0, todo: tasks?.filter((t: any) => t.status === "todo").length || 0, in_progress: tasks?.filter((t: any) => t.status === "in_progress").length || 0, done: tasks?.filter((t: any) => t.status === "done").length || 0 };
      return { ...data, client_name: data.clients?.name || data.clients?.company || null, task_counts: tc };
    }

    case "create_project": {
      const rawCid = typeof args.client_id === "string" ? args.client_id.trim() : "";
      const pt = typeof args.project_type === "string" && args.project_type.trim() ? args.project_type.trim().toLowerCase().replace(/\s+/g, "_") : "one_time";
      const payload: Record<string, unknown> = { name: args.name, user_id: userId, status: "active", project_type: pt, project_types: [pt] };
      if (isUuid(rawCid)) payload.client_id = rawCid;
      const { data, error } = await supabase.from("projects").insert(payload).select().single();
      if (error) throw error;
      return { success: true, project: data };
    }

    case "update_project": {
      const ud: Record<string, unknown> = {};
      if (args.name) ud.name = args.name;
      if (args.status) ud.status = args.status;
      if (!Object.keys(ud).length) return { error: "Nenhum campo para atualizar." };
      const { data, error } = await supabase.from("projects").update(ud).eq("id", args.project_id).select().single();
      if (error) throw error;
      return { success: true, project: data };
    }

    case "delete_project": {
      const { error } = await supabase.from("projects").delete().eq("id", args.project_id);
      if (error) throw error;
      return { success: true, message: "Projeto deletado." };
    }

    // ── CLIENTS ──────────────────────────────────────────────
    case "list_clients": {
      let q = supabase.from("clients").select("id, name, company, email, phone, status, monthly_plan_value, contract_renewal_date").order("name").limit((args.limit as number) || 20);
      if (args.status) q = q.eq("status", args.status);
      if (args.search) q = q.or(`name.ilike.%${args.search}%,company.ilike.%${args.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_client": {
      const { data, error } = await supabase.from("clients").insert({ name: args.name, company: args.company || null, email: args.email || null, phone: args.phone || null, status: args.status || "active", monthly_plan_value: args.monthly_plan_value || null, user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, client: data };
    }

    case "update_client": {
      const ud: Record<string, unknown> = {};
      for (const k of ["name", "company", "status", "email", "phone"]) if (args[k]) ud[k] = args[k];
      if (args.monthly_plan_value !== undefined) ud.monthly_plan_value = args.monthly_plan_value;
      const { data, error } = await supabase.from("clients").update(ud).eq("id", args.client_id).select().single();
      if (error) throw error;
      return { success: true, client: data };
    }

    case "delete_client": {
      const { error } = await supabase.from("clients").delete().eq("id", args.client_id);
      if (error) throw error;
      return { success: true, message: "Cliente deletado." };
    }

    // ── TASKS ────────────────────────────────────────────────
    case "list_tasks": {
      let q = supabase.from("project_tasks").select("id, title, status, priority, due_date, assigned_to, description, created_at").eq("project_id", args.project_id).order("position", { ascending: true });
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_task": {
      const { data, error } = await supabase.from("project_tasks").insert({ project_id: args.project_id, title: args.title, description: args.description || null, priority: args.priority || "medium", due_date: args.due_date || null, assigned_to: args.assigned_to || null, status: "todo", user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, task: data };
    }

    case "update_task": {
      const ud: Record<string, unknown> = {};
      for (const k of ["title", "status", "priority", "assigned_to", "due_date", "description"]) if (args[k] !== undefined) ud[k] = args[k];
      if (!Object.keys(ud).length) return { error: "Nenhum campo para atualizar." };
      const { data, error } = await supabase.from("project_tasks").update(ud).eq("id", args.task_id).select().single();
      if (error) throw error;
      return { success: true, task: data };
    }

    case "delete_task": {
      const { error } = await supabase.from("project_tasks").delete().eq("id", args.task_id);
      if (error) throw error;
      return { success: true, message: "Tarefa deletada." };
    }

    // ── FINANCIAL ────────────────────────────────────────────
    case "get_financial_summary": {
      let q = supabase.from("financial_transactions").select("type, amount, date, category, description");
      if (args.start_date) q = q.gte("date", args.start_date);
      if (args.end_date) q = q.lte("date", args.end_date);
      const { data, error } = await q;
      if (error) throw error;
      const txs = data || [];
      const income = txs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expenses = txs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const byCategory: Record<string, number> = {};
      txs.forEach((t: any) => { const k = `${t.type}:${t.category}`; byCategory[k] = (byCategory[k] || 0) + Number(t.amount); });
      return { total_income: income, total_expenses: expenses, balance: income - expenses, transaction_count: txs.length, by_category: byCategory };
    }

    case "list_transactions": {
      let q = supabase.from("financial_transactions").select("id, type, amount, date, category, description, payment_status, due_date, project_id").order("date", { ascending: false }).limit((args.limit as number) || 30);
      if (args.type) q = q.eq("type", args.type);
      if (args.start_date) q = q.gte("date", args.start_date);
      if (args.end_date) q = q.lte("date", args.end_date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_transaction": {
      const { data, error } = await supabase.from("financial_transactions").insert({ type: args.type, category: args.category, amount: args.amount, description: args.description || null, date: args.date || new Date().toISOString().split("T")[0], project_id: args.project_id || null, payment_status: args.payment_status || "pending", due_date: args.due_date || null, user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, transaction: data };
    }

    case "delete_transaction": {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", args.transaction_id);
      if (error) throw error;
      return { success: true, message: "Transação deletada." };
    }

    // ── CALENDAR ─────────────────────────────────────────────
    case "list_calendar_events": {
      let q = supabase.from("calendar_events").select("id, title, description, start_date, end_date, event_type, all_day, color").order("start_date");
      if (args.start_date) q = q.gte("start_date", args.start_date);
      if (args.end_date) q = q.lte("start_date", args.end_date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_calendar_event": {
      const { data, error } = await supabase.from("calendar_events").insert({ title: args.title, description: args.description || null, start_date: args.start_date, end_date: args.end_date || null, event_type: args.event_type || "other", project_id: args.project_id || null, client_id: args.client_id || null, all_day: args.all_day || false, created_by: userId }).select().single();
      if (error) throw error;
      return { success: true, event: data };
    }

    case "update_calendar_event": {
      const ud: Record<string, unknown> = {};
      for (const k of ["title", "description", "start_date", "end_date", "event_type", "color", "all_day"]) if (args[k] !== undefined) ud[k] = args[k];
      if (!Object.keys(ud).length) return { error: "Nenhum campo para atualizar." };
      const { data, error } = await supabase.from("calendar_events").update(ud).eq("id", args.event_id).select().single();
      if (error) throw error;
      return { success: true, event: data };
    }

    case "delete_calendar_event": {
      const { error } = await supabase.from("calendar_events").delete().eq("id", args.event_id);
      if (error) throw error;
      return { success: true, message: "Evento deletado." };
    }

    // ── CONTRACTS ────────────────────────────────────────────
    case "list_contract_templates": {
      const { data, error } = await supabase.from("contract_templates").select("id, name, description, contract_type, terms, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }

    case "list_contracts": {
      const { data, error } = await supabase.from("contracts").select("id, title, status, contract_type, expiry_date, client_id, created_at, clients(name, company)").order("created_at", { ascending: false }).limit(20);
      if (error) {
        const fb = await supabase.from("contracts").select("id, title, status, contract_type, expiry_date, client_id, created_at").order("created_at", { ascending: false }).limit(20);
        if (fb.error) throw fb.error;
        return fb.data;
      }
      return (data || []).map((c: any) => ({ ...c, client_name: c.clients?.name || c.clients?.company || null, clients: undefined }));
    }

    case "create_contract": {
      const { data, error } = await supabase.from("contracts").insert({ title: args.title, client_id: args.client_id || null, project_id: args.project_id || null, contract_type: args.contract_type || "one_time", terms: args.terms || null, expiry_date: args.expiry_date || null, status: args.status || "draft", user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, contract: data };
    }

    case "update_contract": {
      const ud: Record<string, unknown> = {};
      for (const k of ["status", "terms", "expiry_date", "title"]) if (args[k]) ud[k] = args[k];
      const { data, error } = await supabase.from("contracts").update(ud).eq("id", args.contract_id).select().single();
      if (error) throw error;
      return { success: true, contract: data };
    }

    // ── CAMPAIGNS ────────────────────────────────────────────
    case "list_campaigns": {
      let q = supabase.from("campaigns").select("id, name, status, platform, budget, objective, start_date, end_date").eq("project_id", args.project_id).order("created_at", { ascending: false });
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_campaign": {
      const { data, error } = await supabase.from("campaigns").insert({ project_id: args.project_id, name: args.name, platform: args.platform || null, budget: args.budget || 0, objective: args.objective || null, start_date: args.start_date || null, end_date: args.end_date || null, status: "active" }).select().single();
      if (error) throw error;
      return { success: true, campaign: data };
    }

    case "get_campaign_metrics": {
      let q = supabase.from("campaign_metrics").select("*").eq("campaign_id", args.campaign_id).order("date", { ascending: false });
      if (args.start_date) q = q.gte("date", args.start_date);
      if (args.end_date) q = q.lte("date", args.end_date);
      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) return { message: "Nenhuma métrica encontrada para esta campanha." };
      const totals = { spend: 0, clicks: 0, impressions: 0, leads: 0, conversions: 0, revenue: 0, reach: 0 };
      data.forEach((m: any) => { totals.spend += Number(m.spend || 0); totals.clicks += Number(m.clicks || 0); totals.impressions += Number(m.impressions || 0); totals.leads += Number(m.leads || 0); totals.conversions += Number(m.conversions || 0); totals.revenue += Number(m.revenue || 0); totals.reach += Number(m.reach || 0); });
      return { ...totals, cpc: totals.clicks ? totals.spend / totals.clicks : 0, cpl: totals.leads ? totals.spend / totals.leads : 0, ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0, roas: totals.spend ? totals.revenue / totals.spend : 0, days: data.length };
    }

    // ── COMMISSIONS ──────────────────────────────────────────
    case "get_commissions_summary": {
      let q = supabase.from("closure_commissions").select("amount, user_name, paid, description, created_at");
      if (args.period_key) {
        const start = `${args.period_key}-01T00:00:00`;
        const [y, m] = (args.period_key as string).split("-").map(Number);
        q = q.gte("created_at", start).lt("created_at", new Date(y, m, 1).toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      const total = (data || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
      const paid = (data || []).filter((c: any) => c.paid).reduce((s: number, c: any) => s + Number(c.amount), 0);
      return { commissions: data, total_amount: total, total_paid: paid, total_pending: total - paid };
    }

    // ── TEAM ─────────────────────────────────────────────────
    case "list_team_members": {
      let q = supabase.from("user_roles").select("user_id, role");
      if (args.role) q = q.eq("role", args.role);
      const { data: roles, error } = await q;
      if (error) throw error;
      if (!roles || !roles.length) return [];
      const uids = [...new Set(roles.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, status").in("user_id", uids);
      const pm = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const um = new Map<string, any>();
      for (const r of roles) {
        if (!um.has(r.user_id)) { const p = pm.get(r.user_id); um.set(r.user_id, { user_id: r.user_id, full_name: p?.full_name || "Sem nome", status: p?.status || "unknown", roles: [] }); }
        um.get(r.user_id).roles.push(r.role);
      }
      return Array.from(um.values());
    }

    // ── SOCIAL CALENDAR ──────────────────────────────────────
    case "list_social_posts": {
      let q = supabase.from("project_social_calendar").select("id, title, content, platform, scheduled_date, scheduled_time, status, hashtags, likes, comments, impressions, reach, engagement_rate").eq("project_id", args.project_id).order("scheduled_date", { ascending: false });
      if (args.status) q = q.eq("status", args.status);
      if (args.start_date) q = q.gte("scheduled_date", args.start_date);
      if (args.end_date) q = q.lte("scheduled_date", args.end_date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_social_post": {
      const { data, error } = await supabase.from("project_social_calendar").insert({ project_id: args.project_id, title: args.title, content: args.content || null, platform: args.platform, scheduled_date: args.scheduled_date, scheduled_time: args.scheduled_time || null, hashtags: args.hashtags || null, status: args.status || "scheduled" }).select().single();
      if (error) throw error;
      return { success: true, post: data };
    }

    // ── AUTOMATIONS ──────────────────────────────────────────
    case "list_automations": {
      let q = supabase.from("automation_flows").select("id, name, description, status, category, priority, client_id, project_id, n8n_workflow_url, created_at").order("created_at", { ascending: false }).limit(20);
      if (args.status) q = q.eq("status", args.status);
      if (args.client_id) q = q.eq("client_id", args.client_id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_automation": {
      const { data, error } = await supabase.from("automation_flows").insert({ name: args.name, description: args.description || null, client_id: args.client_id || null, project_id: args.project_id || null, category: args.category || "other", priority: args.priority || "medium", n8n_workflow_url: args.n8n_workflow_url || null, created_by: userId, status: "backlog" }).select().single();
      if (error) throw error;
      return { success: true, automation: data };
    }

    // ── PAYOUTS ──────────────────────────────────────────────
    case "list_payouts": {
      let q = supabase.from("project_payouts").select("id, project_id, role, amount, member_name, user_id, paid, paid_at, description, created_at").order("created_at", { ascending: false });
      if (args.project_id) q = q.eq("project_id", args.project_id);
      if (args.paid !== undefined) q = q.eq("paid", args.paid);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_payout": {
      const { data, error } = await supabase.from("project_payouts").insert({ project_id: args.project_id, role: args.role, amount: args.amount, member_name: args.member_name || null, user_id: args.user_id || null, description: args.description || null, paid: false }).select().single();
      if (error) throw error;
      return { success: true, payout: data };
    }

    // ── CLIENT INTERACTIONS ──────────────────────────────────
    case "list_client_interactions": {
      let q = supabase.from("client_interactions").select("id, type, title, description, interaction_date, created_at").eq("client_id", args.client_id).order("interaction_date", { ascending: false }).limit(20);
      if (args.type) q = q.eq("type", args.type);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_client_interaction": {
      const { data, error } = await supabase.from("client_interactions").insert({ client_id: args.client_id, type: args.type, title: args.title, description: args.description || null, user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, interaction: data };
    }

    // ── CHANGE REQUESTS ──────────────────────────────────────
    case "list_change_requests": {
      let q = supabase.from("project_change_requests").select("id, description, status, notes, requested_at, created_at").eq("project_id", args.project_id).order("created_at", { ascending: false });
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "create_change_request": {
      const { data, error } = await supabase.from("project_change_requests").insert({ project_id: args.project_id, description: args.description, notes: args.notes || null, created_by: userId, status: "pending" }).select().single();
      if (error) throw error;
      return { success: true, change_request: data };
    }

    // ── COURSES ──────────────────────────────────────────────
    case "list_courses": {
      let q = supabase.from("courses").select("id, title, description, category, drive_url, thumbnail_url, created_at").order("created_at", { ascending: false });
      if (args.category) q = q.eq("category", args.category);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    // ── PROPOSALS / PIPELINE ─────────────────────────────────
    case "list_proposals": {
      let q = supabase.from("proposals" as any).select("*").order("created_at", { ascending: false }).limit(20);
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) return { message: "Tabela de propostas não encontrada ou sem acesso.", error: error.message };
      return data;
    }

    // ── CLIENT CLOSURES ──────────────────────────────────────
    case "list_client_closures": {
      const { data, error } = await supabase.from("client_month_closures").select("id, period_key, period_start, period_end, status, total_spend, total_clicks, total_impressions, total_leads, total_conversions, total_revenue, total_roas, avg_cpc, avg_cpl, avg_ctr, campaigns_count, closed_at").eq("client_id", args.client_id).order("period_start", { ascending: false }).limit((args.limit as number) || 12);
      if (error) throw error;
      return data;
    }

    // ── ACTIVITY LOG ─────────────────────────────────────────
    case "list_activity_logs": {
      const { data, error } = await supabase.from("activity_logs").select("id, action, field_type, old_value, new_value, created_at, user_id").eq("project_id", args.project_id).order("created_at", { ascending: false }).limit((args.limit as number) || 20);
      if (error) throw error;
      return data;
    }

    // ── PROJECT MODULES ──────────────────────────────────────
    case "get_project_strategy": {
      const { data, error } = await supabase.from("project_strategy").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhuma estratégia cadastrada ainda." };
    }
    case "upsert_project_strategy": {
      const fields: Record<string, unknown> = {};
      for (const k of ["offer_big_idea", "personas", "funnel_structure", "landing_page_url", "landing_page_test_url"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_strategy").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_strategy").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, strategy: data };
      } else {
        const { data, error } = await supabase.from("project_strategy").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, strategy: data };
      }
    }
    case "get_project_technical_setup": {
      const { data, error } = await supabase.from("project_technical_setup").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhum setup técnico cadastrado ainda." };
    }
    case "upsert_project_technical_setup": {
      const fields: Record<string, unknown> = {};
      for (const k of ["meta_pixel_id", "tiktok_pixel_id", "ad_account_id", "capi_status", "utm_pattern", "ads_manager_link", "drive_link"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_technical_setup").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_technical_setup").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, setup: data };
      } else {
        const { data, error } = await supabase.from("project_technical_setup").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, setup: data };
      }
    }
    case "get_project_branding": {
      const { data, error } = await supabase.from("project_branding").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhum branding cadastrado ainda." };
    }
    case "upsert_project_branding": {
      const fields: Record<string, unknown> = {};
      for (const k of ["positioning_statement", "brand_voice", "color_palette", "typography_notes", "visual_identity_notes", "target_audience", "competitors", "brand_guidelines_url"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_branding").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_branding").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, branding: data };
      } else {
        const { data, error } = await supabase.from("project_branding").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, branding: data };
      }
    }
    case "get_project_social_media": {
      const { data, error } = await supabase.from("project_social_media").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhuma config de social media cadastrada ainda." };
    }
    case "upsert_project_social_media": {
      const fields: Record<string, unknown> = {};
      for (const k of ["platforms", "posting_frequency", "content_pillars", "brand_voice", "hashtag_strategy", "engagement_goals"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_social_media").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_social_media").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, social_media: data };
      } else {
        const { data, error } = await supabase.from("project_social_media").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, social_media: data };
      }
    }
    case "get_project_audiovisual": {
      const { data, error } = await supabase.from("project_audiovisual").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhuma config audiovisual cadastrada ainda." };
    }
    case "upsert_project_audiovisual": {
      const fields: Record<string, unknown> = {};
      for (const k of ["video_types", "production_notes", "equipment_requirements", "delivery_formats", "style_references", "script_notes"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_audiovisual").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_audiovisual").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, audiovisual: data };
      } else {
        const { data, error } = await supabase.from("project_audiovisual").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, audiovisual: data };
      }
    }
    case "get_project_crm_integration": {
      const { data, error } = await supabase.from("project_crm_integration").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhuma integração CRM cadastrada ainda." };
    }
    case "upsert_project_crm_integration": {
      const fields: Record<string, unknown> = {};
      for (const k of ["crm_platform", "api_endpoint", "fields_mapped", "integration_status", "sync_frequency", "notes"]) if (args[k] !== undefined) fields[k] = args[k];
      const { data: existing } = await supabase.from("project_crm_integration").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_crm_integration").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, crm: data };
      } else {
        const { data, error } = await supabase.from("project_crm_integration").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, crm: data };
      }
    }
    case "get_project_financial_advisory": {
      const { data, error } = await supabase.from("project_financial_advisory").select("*").eq("project_id", args.project_id).maybeSingle();
      if (error) throw error;
      return data || { message: "Nenhum financeiro do projeto cadastrado ainda." };
    }
    case "upsert_project_financial_advisory": {
      const fields: Record<string, unknown> = {};
      for (const k of ["budget_analysis", "cash_flow_notes", "financial_goals", "investment_recommendations", "report_frequency"]) {
        if (args[k] !== undefined) fields[k] = args[k];
      }
      const { data: existing } = await supabase.from("project_financial_advisory").select("id").eq("project_id", args.project_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_financial_advisory").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, financial_advisory: data };
      } else {
        const { data, error } = await supabase.from("project_financial_advisory").insert({ project_id: args.project_id, ...fields }).select().single();
        if (error) throw error;
        return { success: true, financial_advisory: data };
      }
    }
    case "list_project_copy_bank": {
      const { data, error } = await supabase.from("project_copy_bank").select("id, angle, content, status, created_at").eq("project_id", args.project_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "create_project_copy": {
      const { data, error } = await supabase.from("project_copy_bank").insert({ project_id: args.project_id, angle: args.angle, content: args.content, status: args.status || "active" }).select().single();
      if (error) throw error;
      return { success: true, copy: data };
    }
    case "list_project_creatives": {
      const { data, error } = await supabase.from("project_creatives").select("id, title, media_url, media_type, tags, dark_post_id, status, created_at").eq("project_id", args.project_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "create_project_creative": {
      const { data, error } = await supabase.from("project_creatives").insert({ project_id: args.project_id, title: args.title, media_url: args.media_url || null, media_type: args.media_type || "image", tags: args.tags || null, dark_post_id: args.dark_post_id || null }).select().single();
      if (error) throw error;
      return { success: true, creative: data };
    }
    case "list_project_tests": {
      const { data, error } = await supabase.from("project_tests").select("id, hypothesis, variables, result, learnings, status, created_at").eq("project_id", args.project_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "create_project_test": {
      const { data, error } = await supabase.from("project_tests").insert({ project_id: args.project_id, hypothesis: args.hypothesis, variables: args.variables || null, status: args.status || "planned" }).select().single();
      if (error) throw error;
      return { success: true, test: data };
    }
    case "list_project_optimization_log": {
      const { data, error } = await supabase.from("project_optimization_log").select("id, action_date, action_description, reason, user_id, created_at").eq("project_id", args.project_id).order("action_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    case "create_project_optimization_log": {
      const { data, error } = await supabase.from("project_optimization_log").insert({ project_id: args.project_id, action_description: args.action_description, reason: args.reason || null, action_date: args.action_date || new Date().toISOString().split("T")[0], user_id: userId }).select().single();
      if (error) throw error;
      return { success: true, log: data };
    }
    case "list_project_members": {
      const { data, error } = await supabase.from("project_members").select("id, user_id, role, created_at").eq("project_id", args.project_id);
      if (error) throw error;
      if (!data || !data.length) return [];
      const uids = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", uids);
      const pm = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      return data.map((m: any) => ({ ...m, full_name: pm.get(m.user_id) || "Sem nome" }));
    }
    case "add_project_member": {
      // Check if already a member
      const { data: existing } = await supabase.from("project_members").select("id").eq("project_id", args.project_id).eq("user_id", args.user_id).maybeSingle();
      if (existing) {
        // Update role if already exists
        const { data, error } = await supabase.from("project_members").update({ role: args.role }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, message: "Cargo do membro atualizado.", member: data };
      }
      const { data, error } = await supabase.from("project_members").insert({ project_id: args.project_id as string, user_id: args.user_id as string, role: args.role as string }).select().single();
      if (error) throw error;
      return { success: true, message: "Membro adicionado ao projeto.", member: data };
    }
    case "remove_project_member": {
      const { error } = await supabase.from("project_members").delete().eq("project_id", args.project_id).eq("user_id", args.user_id);
      if (error) throw error;
      return { success: true, message: "Membro removido do projeto." };
    }

    // ── PROJECT FIELDS (Campos) ─────────────────────────────
    case "list_project_fields": {
      const { data, error } = await supabase.from("project_fields").select("id, field_type, content, link_url, attachments, created_at, updated_at").eq("project_id", args.project_id).order("created_at");
      if (error) throw error;
      return data || [];
    }
    case "upsert_project_field": {
      const fields: Record<string, unknown> = {};
      if (args.content !== undefined) fields.content = args.content;
      if (args.link_url !== undefined) fields.link_url = args.link_url;
      if (args.attachments !== undefined) fields.attachments = args.attachments;
      fields.last_edited_by = userId;
      const { data: existing } = await supabase.from("project_fields").select("id").eq("project_id", args.project_id).eq("field_type", args.field_type).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("project_fields").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, field: data };
      } else {
        const { data, error } = await supabase.from("project_fields").insert({ project_id: args.project_id, field_type: args.field_type as string, ...fields }).select().single();
        if (error) throw error;
        return { success: true, field: data };
      }
    }
    case "delete_project_field": {
      const { error } = await supabase.from("project_fields").delete().eq("id", args.field_id);
      if (error) throw error;
      return { success: true, message: "Campo deletado." };
    }

    // ── CLIENT FILES ─────────────────────────────────────────
    case "list_client_files": {
      let q = supabase.from("client_files").select("id, title, url, description, file_type, project_id, created_at").eq("client_id", args.client_id).order("created_at", { ascending: false });
      if (args.project_id) q = q.eq("project_id", args.project_id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    case "create_client_file": {
      const { data, error } = await supabase.from("client_files").insert({
        client_id: args.client_id as string,
        project_id: args.project_id || null,
        title: args.title as string,
        url: args.url as string,
        description: args.description || null,
        file_type: args.file_type || "document",
        user_id: userId,
      }).select().single();
      if (error) throw error;
      return { success: true, file: data };
    }

    default:
      return { error: `Tool '${name}' não encontrada.` };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[ai-chat] Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = user.id;
    const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const userRoles = (rolesData || []).map((r: any) => r.role);
    const { data: profileData } = await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
    const userName = profileData?.full_name || "Usuário";

    const { messages, conversation_id, current_project_id } = await req.json();
    const currentProjectId = isUuid(current_project_id) ? current_project_id : null;
    const roleNames = userRoles.length > 0 ? userRoles.join(", ") : "user";

    const systemPrompt = `Você é o CUBO AI, assistente inteligente do CRM CUBO. Você tem acesso COMPLETO e IRRESTRITO a TODOS os módulos do sistema.

CONTEXTO DO USUÁRIO:
- Nome: ${userName}
- Cargos: ${roleNames}
- Projeto em contexto atual: ${currentProjectId || "nenhum"}
- Data atual: ${new Date().toISOString().split("T")[0]}

MÓDULOS DISPONÍVEIS (você pode fazer TUDO):
📁 Projetos — criar, listar, editar, deletar, ver detalhes, logs de atividade
👥 Clientes — criar, listar, editar, deletar, interações, fechamentos mensais
✅ Tarefas — criar, listar, editar status/prioridade/responsável, deletar
💰 Financeiro — resumo, listar transações, criar receita/despesa, deletar
📅 Agenda — listar, criar, editar, deletar eventos (reuniões, prazos, lembretes)
📄 Contratos — listar, criar (com templates), editar status/termos, listar templates
📢 Campanhas — listar, criar, ver métricas de performance (spend, clicks, leads, ROAS, CPC, CPL, CTR)
💵 Comissões — resumo por período
👔 Equipe — listar membros e cargos (global e por projeto)
📱 Social — listar e criar posts no calendário social
🤖 Automações — listar e criar fluxos de automação
💳 Pagamentos — listar e criar payouts por projeto
📋 Solicitações de alteração — listar e criar change requests
📚 Cursos — listar cursos de treinamento
🔄 Pipeline — listar propostas

SUBCATEGORIAS DE PROJETO (campos reais do sistema — use SOMENTE estes):

🎯 Estratégia (project_strategy):
  - offer_big_idea: Oferta / Big Idea principal
  - personas: Personas/público-alvo detalhado
  - funnel_structure: Estrutura do funil de vendas
  - landing_page_url: URL da landing page
  - landing_page_test_url: URL de teste da landing page

⚙️ Setup Técnico (project_technical_setup):
  - meta_pixel_id: ID do Pixel Meta/Facebook
  - tiktok_pixel_id: ID do Pixel TikTok
  - ad_account_id: ID da conta de anúncios
  - capi_status: Status da API de Conversões (CAPI)
  - utm_pattern: Padrão de UTMs utilizado
  - ads_manager_link: Link do gerenciador de anúncios
  - drive_link: Link do Google Drive

🎨 Branding (project_branding):
  - positioning_statement: Declaração de posicionamento
  - brand_voice: Tom de voz da marca
  - color_palette: Paleta de cores
  - typography_notes: Notas de tipografia
  - visual_identity_notes: Notas de identidade visual
  - target_audience: Público-alvo
  - competitors: Concorrentes
  - brand_guidelines_url: URL do brand guide

📱 Social Media (project_social_media):
  - platforms: Plataformas ativas (array: instagram, facebook, linkedin, tiktok, etc.)
  - posting_frequency: Frequência de postagem
  - content_pillars: Pilares de conteúdo
  - brand_voice: Tom de voz nas redes
  - hashtag_strategy: Estratégia de hashtags
  - engagement_goals: Metas de engajamento

🎬 Audiovisual (project_audiovisual):
  - video_types: Tipos de vídeo (array: reels, stories, institucional, etc.)
  - production_notes: Notas de produção
  - equipment_requirements: Equipamentos necessários
  - delivery_formats: Formatos de entrega
  - style_references: Referências de estilo
  - script_notes: Notas de roteiro

🔗 Integração CRM (project_crm_integration):
  - crm_platform: Plataforma CRM (HubSpot, Salesforce, etc.)
  - api_endpoint: Endpoint da API
  - fields_mapped: Campos mapeados
  - integration_status: Status da integração
  - sync_frequency: Frequência de sincronização
  - notes: Notas adicionais

💸 Financeiro do Projeto (project_financial_advisory):
  - budget_analysis: Análise de orçamento
  - cash_flow_notes: Notas de fluxo de caixa
  - financial_goals: Metas financeiras
  - investment_recommendations: Recomendações de investimento
  - report_frequency: Frequência de relatórios

✍️ Copy Bank (project_copy_bank) — lista de copies:
  - angle: Ângulo/abordagem da copy
  - content: Conteúdo da copy
  - status: Status (active, paused, testing)

🖼️ Criativos (project_creatives) — lista de criativos:
  - title: Título do criativo
  - media_url: URL da mídia
  - media_type: Tipo (image, video, carousel)
  - tags: Tags (array)
  - dark_post_id: ID do dark post
  - status: Status

🧪 Testes (project_tests) — lista de testes A/B:
  - hypothesis: Hipótese do teste
  - variables: Variáveis testadas
  - result: Resultado
  - learnings: Aprendizados
  - status: Status (planned, running, completed)

📝 Log de Otimização (project_optimization_log) — histórico de ações:
  - action_date: Data da ação
  - action_description: Descrição da ação
  - reason: Motivo/razão

📋 Campos do Projeto (project_fields) — campos personalizados com links e conteúdo:
  - field_type: Identificador do campo (ex: "briefing", "landing_page", "drive", "observacoes", "referencias", "logo")
  - content: Conteúdo de texto do campo
  - link_url: URL/link associado ao campo
  - attachments: Array de URLs de arquivos/imagens anexados

📎 Arquivos do Cliente (client_files) — anexos e documentos:
  - title: Título do arquivo
  - url: URL do arquivo (Google Drive, Dropbox, link direto, etc.)
  - description: Descrição do arquivo
  - file_type: Tipo (image, video, document, spreadsheet, presentation, other)

INSTRUÇÕES:
- Responda SEMPRE em português do Brasil
- Seja conciso e direto
- Use ferramentas para consultar e modificar dados — NUNCA invente dados
- Quando o usuário perguntar sobre campos de um módulo, consulte a lista acima e retorne os CAMPOS REAIS do sistema
- Quando o usuário der dados claros, execute IMEDIATAMENTE sem confirmação
- Para ações DESTRUTIVAS (deletar), peça confirmação antes
- Formate valores em R$ (BRL) e datas em dd/mm/yyyy
- Use markdown para formatar listas e tabelas
- Quando pedir para criar projeto para um cliente pelo nome, use list_clients primeiro para achar o ID
- Quando pedir para atribuir tarefa ou adicionar membro ao projeto, use list_team_members para achar o user_id e depois add_project_member
- Para definir equipe do projeto, use add_project_member para cada membro com o role correto (director, designer, copywriter, traffic_manager, social_media)
- Nunca use IDs fictícios como PRJ-XXXX, CLI-XXXX, USER-XXXX
- Para qualquer ação que exija project_id, use o projeto em contexto atual quando disponível
- Quando pedir informações de subcategorias, use as ferramentas get_project_* para buscar dados REAIS
- Quando pedirem para colar um link em "Campos", use upsert_project_field com o field_type adequado e o link_url
- Quando pedirem para anexar arquivo/imagem/vídeo, use create_client_file com a URL fornecida ou upsert_project_field com attachments
- Para AGENDA: use create_calendar_event para agendar reuniões, prazos, lembretes. Use update_calendar_event para alterar. Sempre inclua start_date com hora quando relevante
- Para CONTRATOS: quando o usuário pedir para criar um contrato usando template, primeiro use list_contract_templates para buscar os templates disponíveis, depois use create_contract passando os terms do template escolhido. Sempre associe o contrato ao client_id e project_id quando possível`;

    const apiMessages = [{ role: "system", content: systemPrompt }, ...messages];

    let openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: apiMessages, tools, tool_choice: "auto", stream: false, temperature: 0.7, max_tokens: 4096 }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", openaiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro na API de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result = await openaiResponse.json();
    let assistantMessage = result.choices[0].message;

    // Handle tool calls (up to 10 iterations for complex multi-step workflows)
    let iterations = 0;
    while (assistantMessage.tool_calls && iterations < 10) {
      iterations++;
      const toolResults: any[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown>;
        try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { fnArgs = {}; }
        console.log(`[ai-chat] Tool #${iterations}: ${fnName}`, JSON.stringify(fnArgs));

        let toolResult: unknown;
        try {
          toolResult = await executeTool(fnName, fnArgs, supabase, userId, currentProjectId);
        } catch (e: any) {
          console.error(`[ai-chat] Tool error (${fnName}):`, e?.message || e);
          toolResult = { error: e.message };
        }

        toolResults.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
      }

      apiMessages.push(assistantMessage);
      apiMessages.push(...toolResults);

      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: apiMessages, tools, tool_choice: "auto", stream: false, temperature: 0.7, max_tokens: 4096 }),
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI error (loop):", openaiResponse.status, await openaiResponse.text());
        break;
      }

      result = await openaiResponse.json();
      assistantMessage = result.choices[0].message;
    }

    const responseContent = assistantMessage.content || "Desculpe, não consegui processar sua solicitação.";

    if (conversation_id) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg) {
        await supabase.from("ai_chat_messages").insert([
          { conversation_id, role: "user", content: lastUserMsg.content },
          { conversation_id, role: "assistant", content: responseContent, tool_calls: assistantMessage.tool_calls || null },
        ]);
      }
    }

    return new Response(JSON.stringify({ content: responseContent, tool_calls: assistantMessage.tool_calls || null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[ai-chat] Error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
