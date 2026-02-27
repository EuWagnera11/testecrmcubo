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
    console.log("Webhook received:", JSON.stringify(body));

    const event = body.event;

    if (event === "messages.upsert") {
      const data = body.data;
      const instanceName = body.instance;
      const remoteJid = data.key?.remoteJid;
      const fromMe = data.key?.fromMe || false;
      const messageContent =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        data.message?.imageMessage?.caption ||
        "";
      const messageId = data.key?.id;

      if (!remoteJid || !instanceName) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      // Extract phone number from JID
      const phone = remoteJid.split("@")[0];

      // Find instance
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("instance_name", instanceName)
        .single();

      if (!instance) {
        console.error("Instance not found:", instanceName);
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      // Upsert contact
      const { data: contact } = await supabase
        .from("whatsapp_contacts")
        .upsert(
          {
            phone,
            name: data.pushName || null,
            source: "webhook",
          },
          { onConflict: "phone" }
        )
        .select("id")
        .single();

      if (!contact) {
        console.error("Failed to upsert contact");
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      // Upsert conversation
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
        .select("id, unread_count")
        .single();

      if (!conversation) {
        console.error("Failed to upsert conversation");
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      // Insert message
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversation.id,
        sender_type: fromMe ? "agent" : "contact",
        content: messageContent || null,
        external_id: messageId,
        status: "received",
        media_url: data.message?.imageMessage?.url || null,
        media_type: data.message?.imageMessage ? "image" : null,
      });

      // Update conversation: unread count + last_message_preview
      const preview = (messageContent || "").substring(0, 100);
      if (!fromMe) {
        await supabase
          .from("whatsapp_conversations")
          .update({
            unread_count: (conversation.unread_count || 0) + 1,
            last_message_at: new Date().toISOString(),
            last_message_preview: preview || null,
          })
          .eq("id", conversation.id);
      } else {
        await supabase
          .from("whatsapp_conversations")
          .update({
            last_message_preview: preview || null,
          })
          .eq("id", conversation.id);
      }
    }

    // Forward to n8n (fire-and-forget)
    try {
      fetch("https://n8n.refinecubo.com.br/webhook/webhook-evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }
});
