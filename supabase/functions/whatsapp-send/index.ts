import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(raw: string): string {
  let digits = raw.replace(/@.*$/, '').replace(/\D/g, '');
  // Remove duplicate 55 prefix
  if (digits.startsWith('55') && digits.length > 13) {
    const rest = digits.slice(2);
    if (rest.startsWith('55') && (rest.length - 2 === 10 || rest.length - 2 === 11)) {
      digits = '55' + rest.slice(2);
    }
  }
  // Add 55 for local numbers (10-11 digits)
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

function toHttp(url: string): string {
  return url.replace(/^https:\/\//, "http://");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { instanceId, phone, message } = await req.json();

    if (!instanceId || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "instanceId, phone and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: instance, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: "Instance not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = toHttp(instance.api_url);
    const apiUrl = `${baseUrl}/message/sendText/${instance.instance_name}`;
    const httpClient = Deno.createHttpClient({
      unsafelyIgnoreCertificateErrors: true,
    });
    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: instance.api_key,
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
        client: httpClient,
      });
    } catch (e) {
      httpClient.close();
      throw e;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Evolution API error [${response.status}]: ${JSON.stringify(result)}`
      );
    }

    // Upsert contact with normalized phone
    const normalizedPhone = normalizePhone(phone);
    const { data: contact } = await supabase
      .from("whatsapp_contacts")
      .upsert({ phone: normalizedPhone, source: "manual" }, { onConflict: "phone" })
      .select("id")
      .single();

    if (contact) {
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

        // Handoff: pause bot for 1 hour when human sends message
        const pauseUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await supabase
          .from("whatsapp_conversations")
          .update({
            is_bot_active: false,
            bot_paused_until: pauseUntil,
            last_message_preview: message.substring(0, 100),
          })
          .eq("id", conversation.id);
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
