import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(raw: string): string {
  let digits = raw.replace(/@.*$/, "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 13) {
    const rest = digits.slice(2);
    if (rest.startsWith("55") && (rest.length - 2 === 10 || rest.length - 2 === 11)) {
      digits = "55" + rest.slice(2);
    }
  }
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

function toHttp(url: string): string {
  return url.replace(/^https:\/\//, "http://");
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return { date, time };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { meeting_id, type } = await req.json();

    if (!meeting_id || !type) {
      return new Response(JSON.stringify({ error: "meeting_id and type are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch meeting + pipeline item
    const { data: meeting, error: meetingErr } = await supabaseAdmin
      .from("pipeline_meetings")
      .select("*, sales_pipeline:pipeline_item_id(*)")
      .eq("id", meeting_id)
      .single();

    if (meetingErr || !meeting) {
      return new Response(JSON.stringify({ error: "Meeting not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pipelineItem = meeting.sales_pipeline;
    const contactName = pipelineItem.contact_name || "Cliente";
    const contactPhone = pipelineItem.contact_phone;
    const contactEmail = pipelineItem.contact_email;
    const { date, time } = formatDateTime(meeting.scheduled_at);
    const linkPart = meeting.meeting_link ? `\n📎 Link: ${meeting.meeting_link}` : "";
    const locationPart = meeting.location ? `\n📍 Local: ${meeting.location}` : "";

    let messageText = "";
    if (type === "confirmation") {
      messageText = `Olá, ${contactName}! 🎯\n\nSua reunião com a Cubo está confirmada para ${date} às ${time}.${linkPart}${locationPart}\n\nAté lá! 👋`;
    } else if (type === "reminder") {
      messageText = `Olá, ${contactName}! ⏰\n\nSua reunião começa em 20 minutos (${time}).${linkPart}${locationPart}\n\nEstamos te esperando! 🚀`;
    }

    const results: { whatsapp?: boolean; email?: boolean } = {};

    // Send via WhatsApp if phone exists
    if (contactPhone) {
      try {
        const normalizedPhone = normalizePhone(contactPhone);

        // Get first active whatsapp instance
        const { data: instance } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("status", "connected")
          .limit(1)
          .single();

        if (instance) {
          const baseUrl = toHttp(instance.api_url);
          const apiUrl = `${baseUrl}/message/sendText/${instance.instance_name}`;
          const httpClient = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true });

          try {
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: instance.api_key },
              body: JSON.stringify({ number: normalizedPhone, text: messageText }),
              client: httpClient,
            });

            if (response.ok) {
              results.whatsapp = true;
              console.log("WhatsApp sent successfully to", normalizedPhone);
            } else {
              const err = await response.text();
              console.error("WhatsApp API error:", err);
            }
          } finally {
            httpClient.close();
          }
        } else {
          console.log("No active WhatsApp instance found");
        }
      } catch (e) {
        console.error("WhatsApp send error:", e);
      }
    }

    // TODO: Email sending can be added here when email domain is configured
    // For now, log intent
    if (contactEmail) {
      console.log(`Email would be sent to ${contactEmail}: ${messageText}`);
      results.email = false; // Not yet implemented
    }

    // Update meeting with sent timestamp
    const updateField = type === "confirmation" ? "confirmation_sent_at" : "reminder_sent_at";
    await supabaseAdmin
      .from("pipeline_meetings")
      .update({ [updateField]: new Date().toISOString() })
      .eq("id", meeting_id);

    return new Response(
      JSON.stringify({ success: true, results, message: messageText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Meeting notify error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
