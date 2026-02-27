import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Robust JSON parsing with fallback
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      try {
        const rawText = await req.text();
        console.log("whatsapp-bot-update: raw text received:", rawText);
        body = JSON.parse(rawText);
      } catch {
        console.error("whatsapp-bot-update: failed to parse body");
        return new Response(
          JSON.stringify({ error: "Invalid JSON payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("whatsapp-bot-update: body received:", JSON.stringify(body));

    const { instance_name, phone, ai_summary, is_bot_active } = body as Record<string, any>;

    // Accept alternative text fields with ai_summary as fallback
    const botText = (body.reply_text || body.text || body.message || body.content || "") as string;
    const aiSummaryText = (ai_summary || "") as string;
    const finalText = botText.trim() || aiSummaryText.trim() || "Mensagem enviada pelo bot";
    const usedFallback = !botText.trim();

    if (!instance_name || !phone) {
      return new Response(
        JSON.stringify({ error: "instance_name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone (remove non-digits)
    const normalizedPhone = (phone as string).replace(/\D/g, "");

    // Find instance by name
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name", instance_name)
      .single();

    if (!instance) {
      return new Response(
        JSON.stringify({ error: `Instance '${instance_name}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create contact
    const { data: contact } = await supabase
      .from("whatsapp_contacts")
      .upsert(
        { phone: normalizedPhone, source: "bot" },
        { onConflict: "phone" }
      )
      .select("id")
      .single();

    if (!contact) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert contact" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create conversation
    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .upsert(
        {
          contact_id: contact.id,
          instance_id: instance.id,
          last_message_at: new Date().toISOString(),
          status: "open",
        },
        { onConflict: "contact_id,instance_id" }
      )
      .select("id, is_bot_active, bot_paused_until")
      .single();

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert conversation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if bot is paused (handoff active) — reject bot messages during pause
    if (conversation.is_bot_active === false && conversation.bot_paused_until) {
      const pausedUntil = new Date(conversation.bot_paused_until);
      if (pausedUntil > new Date()) {
        console.log("Bot paused until", pausedUntil.toISOString(), "— rejecting bot update");
        return new Response(
          JSON.stringify({ ok: false, paused: true, paused_until: pausedUntil.toISOString() }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Always insert bot message (even with fallback text)
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      sender_type: "bot",
      content: finalText,
      status: "sent",
    });

    // Sanitize ai_summary — remove "Tipo CRM: desconhecido"
    let cleanSummary = ai_summary as string | undefined;
    if (cleanSummary) {
      cleanSummary = cleanSummary.replace(/Tipo CRM:\s*desconhecido[,;\s]*/gi, '').trim() || undefined;
    }

    // Update conversation with preview + optional AI fields
    const updateFields: Record<string, unknown> = {
      last_message_preview: finalText.substring(0, 100),
      last_message_at: new Date().toISOString(),
    };

    if (cleanSummary !== undefined) {
      updateFields.ai_summary = cleanSummary;
      updateFields.ai_summary_at = new Date().toISOString();
    }

    if (is_bot_active !== undefined) {
      updateFields.is_bot_active = is_bot_active;
    }

    await supabase
      .from("whatsapp_conversations")
      .update(updateFields)
      .eq("id", conversation.id);

    console.log("Bot update saved:", { conversation_id: conversation.id, phone: normalizedPhone, usedFallback });

    return new Response(
      JSON.stringify({ ok: true, conversation_id: conversation.id, ...(usedFallback ? { warning: "Used fallback text — original reply_text was empty" } : {}) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("whatsapp-bot-update error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
