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

    const body = await req.json();
    const { instance_name, phone, reply_text, ai_summary, is_bot_active } = body;

    if (!instance_name || !phone || !reply_text) {
      return new Response(
        JSON.stringify({ error: "instance_name, phone and reply_text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, "");

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

    // Insert bot message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      sender_type: "bot",
      content: reply_text,
      status: "sent",
    });

    // Update conversation with preview + optional AI fields
    const updateFields: Record<string, unknown> = {
      last_message_preview: reply_text.substring(0, 100),
      last_message_at: new Date().toISOString(),
    };

    if (ai_summary !== undefined) {
      updateFields.ai_summary = ai_summary;
      updateFields.ai_summary_at = new Date().toISOString();
    }

    if (is_bot_active !== undefined) {
      updateFields.is_bot_active = is_bot_active;
    }

    await supabase
      .from("whatsapp_conversations")
      .update(updateFields)
      .eq("id", conversation.id);

    console.log("Bot update saved:", { conversation_id: conversation.id, phone: normalizedPhone });

    return new Response(
      JSON.stringify({ ok: true, conversation_id: conversation.id }),
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
