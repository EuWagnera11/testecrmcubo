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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;
    const { instanceId, phone, message } = await req.json();

    if (!instanceId || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "instanceId, phone and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get instance details
    const { data: instance, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: "Instance not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Send message via Evolution API
    const apiUrl = `${instance.api_url}/message/sendText/${instance.instance_name}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: instance.api_key,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Evolution API error [${response.status}]: ${JSON.stringify(result)}`
      );
    }

    // Upsert contact
    const { data: contact } = await supabase
      .from("whatsapp_contacts")
      .upsert({ phone, source: "manual" }, { onConflict: "phone" })
      .select("id")
      .single();

    if (contact) {
      // Upsert conversation
      const { data: conversation } = await supabase
        .from("whatsapp_conversations")
        .upsert(
          {
            contact_id: contact.id,
            instance_id: instanceId,
            last_message_at: new Date().toISOString(),
            status: "open",
          },
          { onConflict: "contact_id,instance_id" }
        )
        .select("id")
        .single();

      if (conversation) {
        await supabase.from("whatsapp_messages").insert({
          conversation_id: conversation.id,
          sender_type: "agent",
          content: message,
          status: "sent",
          sent_by: userId,
          external_id: result?.key?.id || null,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending WhatsApp message:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
