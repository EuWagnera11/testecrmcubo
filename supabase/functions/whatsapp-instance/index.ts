import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getNormalizedUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

function getEvolutionHost(rawUrl: string): string | null {
  const normalized = getNormalizedUrl(rawUrl);

  try {
    const withProtocol = /^https?:\/\//i.test(normalized)
      ? normalized
      : `https://${normalized}`;
    return new URL(withProtocol).hostname;
  } catch {
    return null;
  }
}

function createEvolutionHttpClient(rawUrl: string): Deno.HttpClient | null {
  const host = getEvolutionHost(rawUrl);

  if (!host) return null;

  return Deno.createHttpClient({
    unsafelyIgnoreCertificateErrors: [host],
  });
}

function getBaseCandidates(rawUrl: string): string[] {
  const normalized = getNormalizedUrl(rawUrl);

  try {
    const url = new URL(normalized);
    const httpUrl = `http://${url.host}`;
    return [httpUrl];
  } catch {
    const stripped = normalized.replace(/^https?:\/\//i, "");
    return [`http://${stripped}`];
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown): string {
  if (!payload) return "Sem detalhes";
  if (typeof payload === "string") return payload;

  const typed = payload as Record<string, unknown>;
  const response = typed.response as Record<string, unknown> | undefined;
  const messages = response?.message as unknown;

  if (Array.isArray(messages) && messages.length > 0) {
    return String(messages[0]);
  }

  if (typeof typed.message === "string") return typed.message;
  return JSON.stringify(payload);
}

async function callEvolutionApi({
  apiUrl,
  apiKey,
  path,
  method = "GET",
  body,
}: {
  apiUrl: string;
  apiKey: string;
  path: string;
  method?: string;
  body?: unknown;
}) {
  const baseCandidates = getBaseCandidates(apiUrl);
  const evolutionHttpClient = createEvolutionHttpClient(apiUrl);
  let lastError: Error | null = null;

  try {
    for (const base of baseCandidates) {
      const requestUrl = `${base}${path}`;

      try {
        console.log(`[whatsapp-instance] ${method} ${requestUrl}`);

        const response = await fetch(requestUrl, {
          method,
          headers: {
            apikey: apiKey,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          ...(evolutionHttpClient ? { client: evolutionHttpClient } : {}),
        });

        const payload = await parseResponseBody(response);

        if (!response.ok) {
          throw new Error(
            `Evolution API [${response.status}]: ${extractErrorMessage(payload)}`
          );
        }

        return payload;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[whatsapp-instance] failed on ${requestUrl}:`, message);
        lastError = error instanceof Error ? error : new Error(message);
      }
    }
  } finally {
    evolutionHttpClient?.close();
  }

  throw (
    lastError ??
    new Error("Falha ao conectar com Evolution API em todos os endpoints testados")
  );
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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, instanceId } = await req.json();

    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = encodeURIComponent(instance.instance_name);

    if (action === "check-status") {
      const result = await callEvolutionApi({
        apiUrl: instance.api_url,
        apiKey: instance.api_key,
        path: `/instance/connectionState/${instanceName}`,
      });

      const status =
        (result as Record<string, unknown>)?.instance &&
        typeof (result as Record<string, unknown>).instance === "object"
          ? ((result as Record<string, unknown>).instance as Record<string, unknown>)
              ?.state ?? "disconnected"
          : "disconnected";

      await supabase
        .from("whatsapp_instances")
        .update({ status: String(status) })
        .eq("id", instanceId);

      return new Response(JSON.stringify({ success: true, status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-qrcode") {
      const result = await callEvolutionApi({
        apiUrl: instance.api_url,
        apiKey: instance.api_key,
        path: `/instance/connect/${instanceName}`,
      });

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set-webhook") {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;

      const result = await callEvolutionApi({
        apiUrl: instance.api_url,
        apiKey: instance.api_key,
        path: `/webhook/set/${instanceName}`,
        method: "POST",
        body: {
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: ["MESSAGES_UPSERT"],
        },
      });

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Instance error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
