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

    const { action, instanceId } = await req.json();

    if (action === "check-status") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (!instance) {
        return new Response(JSON.stringify({ error: "Instance not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Check connection status with Evolution API
      const response = await fetch(
        `${instance.api_url}/instance/connectionState/${instance.instance_name}`,
        {
          headers: { apikey: instance.api_key },
        }
      );

      const result = await response.json();
      const status = result?.instance?.state || "disconnected";

      // Update status in DB
      await supabase
        .from("whatsapp_instances")
        .update({ status })
        .eq("id", instanceId);

      return new Response(
        JSON.stringify({ success: true, status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-qrcode") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (!instance) {
        return new Response(JSON.stringify({ error: "Instance not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      const response = await fetch(
        `${instance.api_url}/instance/connect/${instance.instance_name}`,
        {
          headers: { apikey: instance.api_key },
        }
      );

      const result = await response.json();

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set-webhook") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("id", instanceId)
        .single();

      if (!instance) {
        return new Response(JSON.stringify({ error: "Instance not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;

      const response = await fetch(
        `${instance.api_url}/webhook/set/${instance.instance_name}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: instance.api_key,
          },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ["MESSAGES_UPSERT"],
          }),
        }
      );

      const result = await response.json();

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    console.error("Instance error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
