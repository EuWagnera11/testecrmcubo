import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tool definitions for the CRM CUBO ──────────────────────────────────────

const tools = [
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "List projects with optional filters (status, client). Returns id, name, status, client_name, created_at, project_type.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: planning, in_progress, completed, cancelled" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project in the CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          client_id: { type: "string", description: "Client UUID" },
          project_type: { type: "string", description: "Type: social_media, traffic, branding, audiovisual, financial_advisory, social_ai, crm_integration, gmb" },
          description: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "List clients/clinics with optional filters. Returns id, name, company, email, phone, status, monthly_plan_value.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: active, inactive, lead" },
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
      description: "Create a new client/clinic in the CRM.",
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
      description: "Update a client's data.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "Client UUID" },
          name: { type: "string" },
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
      name: "list_tasks",
      description: "List tasks for a project. Returns id, title, status, priority, due_date, assigned_to.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project UUID" },
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
          assigned_to: { type: "string", description: "User UUID" },
        },
        required: ["project_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get financial summary: total income, expenses, balance, with optional date range.",
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
      name: "create_transaction",
      description: "Create a financial transaction.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "income or expense" },
          category: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          date: { type: "string", description: "ISO date" },
          project_id: { type: "string" },
        },
        required: ["type", "category", "amount"],
      },
    },
  },
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
      name: "get_commissions_summary",
      description: "Get commissions summary for a period.",
      parameters: {
        type: "object",
        properties: {
          period_key: { type: "string", description: "YYYY-MM format" },
        },
      },
    },
  },
];

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userRoles: string[]
) {
  const isAdminOrDirector = userRoles.some((r) => ["admin", "director"].includes(r));
  const isTeamLeader = userRoles.includes("team_leader");

  switch (name) {
    case "list_projects": {
      let query = supabase
        .from("projects")
        .select("id, name, status, client_name, created_at, project_type, description")
        .order("created_at", { ascending: false })
        .limit((args.limit as number) || 20);
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "create_project": {
      if (!isAdminOrDirector && !isTeamLeader) {
        return { error: "Sem permissão para criar projetos." };
      }
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: args.name,
          client_id: args.client_id || null,
          client_name: args.client_name || null,
          project_type: args.project_type || "social_media",
          description: args.description || null,
          user_id: userId,
          status: "planning",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "list_clients": {
      let query = supabase
        .from("clients")
        .select("id, name, company, email, phone, status, monthly_plan_value, contract_renewal_date")
        .order("name")
        .limit((args.limit as number) || 20);
      if (args.status) query = query.eq("status", args.status);
      if (args.search) query = query.or(`name.ilike.%${args.search}%,company.ilike.%${args.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "create_client": {
      if (!isAdminOrDirector && !isTeamLeader) {
        return { error: "Sem permissão para criar clientes." };
      }
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: args.name,
          company: args.company || null,
          email: args.email || null,
          phone: args.phone || null,
          status: args.status || "active",
          monthly_plan_value: args.monthly_plan_value || null,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "update_client": {
      if (!isAdminOrDirector && !isTeamLeader) {
        return { error: "Sem permissão para atualizar clientes." };
      }
      const updateData: Record<string, unknown> = {};
      if (args.name) updateData.name = args.name;
      if (args.status) updateData.status = args.status;
      if (args.monthly_plan_value !== undefined) updateData.monthly_plan_value = args.monthly_plan_value;
      if (args.email) updateData.email = args.email;
      if (args.phone) updateData.phone = args.phone;

      const { data, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", args.client_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "list_tasks": {
      let query = supabase
        .from("project_tasks")
        .select("id, title, status, priority, due_date, assigned_to, created_at")
        .eq("project_id", args.project_id)
        .order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "create_task": {
      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          project_id: args.project_id,
          title: args.title,
          description: args.description || null,
          priority: args.priority || "medium",
          due_date: args.due_date || null,
          assigned_to: args.assigned_to || null,
          status: "todo",
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "get_financial_summary": {
      if (!isAdminOrDirector) {
        return { error: "Sem permissão para ver dados financeiros." };
      }
      let query = supabase.from("financial_transactions").select("type, amount, date, category");
      if (args.start_date) query = query.gte("date", args.start_date);
      if (args.end_date) query = query.lte("date", args.end_date);
      const { data, error } = await query;
      if (error) throw error;

      const income = (data || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expenses = (data || []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      return { total_income: income, total_expenses: expenses, balance: income - expenses, transaction_count: data?.length || 0 };
    }

    case "create_transaction": {
      if (!isAdminOrDirector) {
        return { error: "Sem permissão para criar transações." };
      }
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert({
          type: args.type,
          category: args.category,
          amount: args.amount,
          description: args.description || null,
          date: args.date || new Date().toISOString().split("T")[0],
          project_id: args.project_id || null,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "list_calendar_events": {
      let query = supabase
        .from("calendar_events")
        .select("id, title, description, start_date, end_date, event_type, all_day, color")
        .order("start_date");
      if (args.start_date) query = query.gte("start_date", args.start_date);
      if (args.end_date) query = query.lte("start_date", args.end_date);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "create_calendar_event": {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          title: args.title,
          description: args.description || null,
          start_date: args.start_date,
          end_date: args.end_date || null,
          event_type: args.event_type || "other",
          project_id: args.project_id || null,
          client_id: args.client_id || null,
          all_day: args.all_day || false,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    case "list_contracts": {
      let query = supabase
        .from("contracts")
        .select("id, title, status, contract_type, expiry_date, client_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "get_commissions_summary": {
      if (!isAdminOrDirector) {
        return { error: "Sem permissão para ver comissões." };
      }
      let query = supabase.from("closure_commissions").select("amount, user_name, paid, description, created_at");
      if (args.period_key) {
        const start = `${args.period_key}-01`;
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + 1);
        query = query.gte("created_at", start).lt("created_at", endDate.toISOString().split("T")[0]);
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = (data || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
      return { commissions: data, total_amount: total };
    }

    default:
      return { error: `Tool '${name}' not found.` };
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get user roles
    const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const userRoles = (rolesData || []).map((r: any) => r.role);

    // Get user profile
    const { data: profileData } = await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
    const userName = profileData?.full_name || "Usuário";

    const { messages, conversation_id } = await req.json();

    // Build role-aware system prompt
    const roleNames = userRoles.length > 0 ? userRoles.join(", ") : "user";
    const isAdminOrDirector = userRoles.some((r: string) => ["admin", "director"].includes(r));

    const systemPrompt = `Você é o CUBO AI, assistente inteligente do CRM CUBO. Você ajuda a equipe a gerenciar projetos, clientes (clínicas), finanças, agenda e mais.

CONTEXTO DO USUÁRIO:
- Nome: ${userName}
- Cargos: ${roleNames}
- Data atual: ${new Date().toISOString().split("T")[0]}

REGRAS DE PERMISSÃO:
${isAdminOrDirector ? "- Este usuário tem acesso COMPLETO a todos os módulos (admin/diretor)." : ""}
${userRoles.includes("team_leader") ? "- Este usuário pode criar projetos, gerenciar tarefas e ver clientes." : ""}
${!isAdminOrDirector ? "- Este usuário NÃO tem acesso a dados financeiros detalhados ou comissões." : ""}

INSTRUÇÕES:
- Responda sempre em português do Brasil
- Seja conciso mas completo
- Use as ferramentas disponíveis para consultar e modificar dados do CRM
- Quando o usuário pedir para criar algo, confirme os dados antes de executar, a menos que o comando seja claro
- Formate valores monetários em R$ (BRL)
- Para datas, use o formato brasileiro (dd/mm/yyyy)
- Quando listar itens, use formatação organizada com markdown
- Se o usuário não tem permissão para uma ação, explique educadamente e sugira alternativas
- Para ações destrutivas, sempre peça confirmação`;

    // Prepare messages for OpenAI
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call OpenAI with tools
    let openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        tools,
        tool_choice: "auto",
        stream: false,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", openaiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro na API de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result = await openaiResponse.json();
    let assistantMessage = result.choices[0].message;

    // Handle tool calls (up to 5 iterations)
    let iterations = 0;
    while (assistantMessage.tool_calls && iterations < 5) {
      iterations++;
      const toolResults: any[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        const fnArgs = JSON.parse(toolCall.function.arguments);
        console.log(`[ai-chat] Tool call: ${fnName}`, fnArgs);

        let toolResult: unknown;
        try {
          toolResult = await executeTool(fnName, fnArgs, supabase, userId, userRoles);
        } catch (e: any) {
          toolResult = { error: e.message };
        }

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Send tool results back to OpenAI
      apiMessages.push(assistantMessage);
      apiMessages.push(...toolResults);

      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: apiMessages,
          tools,
          tool_choice: "auto",
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        console.error("OpenAI error (tool loop):", openaiResponse.status, errText);
        break;
      }

      result = await openaiResponse.json();
      assistantMessage = result.choices[0].message;
    }

    const responseContent = assistantMessage.content || "Desculpe, não consegui processar sua solicitação.";

    // Persist messages if conversation_id provided
    if (conversation_id) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg) {
        await supabase.from("ai_chat_messages").insert([
          { conversation_id, role: "user", content: lastUserMsg.content },
          { conversation_id, role: "assistant", content: responseContent, tool_calls: assistantMessage.tool_calls || null },
        ]);
      }
    }

    return new Response(
      JSON.stringify({
        content: responseContent,
        tool_calls: assistantMessage.tool_calls || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[ai-chat] Error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
