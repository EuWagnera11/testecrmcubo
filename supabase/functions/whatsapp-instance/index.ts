import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getNormalizedUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

function toHttpUrl(rawUrl: string): string {
  const normalized = getNormalizedUrl(rawUrl);
  // Strip any protocol and force http://
  const stripped = normalized.replace(/^https?:\/\//i, "");
  return `http://${stripped}`;
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
  if (Array.isArray(messages) && messages.length > 0) return String(messages[0]);
  if (typeof typed.message === "string") return typed.message;
  return JSON.stringify(payload);
}

/**
 * Attempts to call the Evolution API with two strategies:
 *
 * Strategy 1: HTTP with redirect: "manual" + insecure httpClient.
 *   - Sends to http:// URL with redirect:"manual" so the runtime does NOT
 *     auto-follow to https:// (which would trigger the TLS error).
 *   - If server returns 3xx with Location header, we rewrite it to http://
 *     and follow manually (still with the insecure client).
 *   - If the server responds with content (2xx or error), we use that.
 *
 * Strategy 2 (fallback): Direct fetch with insecure httpClient.
 *   - Tries the original URL (could be https) with the insecure client
 *     that has unsafelyIgnoreCertificateErrors set to the target hostname.
 *   - This works if the Edge Runtime actually honours the flag.
 */
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
  const headers: Record<string, string> = {
    apikey: apiKey,
    ...(body ? { "Content-Type": "application/json" } : {}),
  };
  const fetchBody = body ? JSON.stringify(body) : undefined;

  // Extract hostname for the array-based client (Strategy 2 fallback)
  let hostname = "evoapi.refinecubo.com.br";
  try {
    const n = getNormalizedUrl(apiUrl);
    const withProto = /^https?:\/\//i.test(n) ? n : `https://${n}`;
    hostname = new URL(withProto).hostname;
  } catch { /* keep default */ }

  const errors: string[] = [];

  // ── Strategy 1: HTTP + manual redirect control ──
  {
    const httpUrl = `${toHttpUrl(apiUrl)}${path}`;
    console.log(`[whatsapp-instance] Strategy1: ${method} ${httpUrl} (redirect:manual)`);

    // Create a client just for this attempt
    const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: [hostname] });
    try {
      let response = await fetch(httpUrl, {
        method,
        headers,
        body: fetchBody,
        redirect: "manual",
        client,
      });

      // If redirected, follow manually rewriting https→http
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (location) {
          const rewrittenUrl = location.replace(/^https:\/\//i, "http://");
          console.log(`[whatsapp-instance] Strategy1: redirect → ${rewrittenUrl}`);
          response = await fetch(rewrittenUrl, {
            method,
            headers,
            body: fetchBody,
            redirect: "manual",
            client,
          });
        }
      }

      // If we got a real response (not another redirect), use it
      if (![301, 302, 303, 307, 308].includes(response.status)) {
        const payload = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(`Evolution API [${response.status}]: ${extractErrorMessage(payload)}`);
        }
        console.log(`[whatsapp-instance] Strategy1: success ${response.status}`);
        return payload;
      }

      errors.push(`Strategy1: still redirecting after rewrite (status ${response.status})`);
      console.warn(`[whatsapp-instance] ${errors[errors.length - 1]}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Strategy1: ${msg}`);
      console.error(`[whatsapp-instance] Strategy1 failed:`, msg);
    } finally {
      client.close();
    }
  }

  // ── Strategy 2: Direct fetch with insecure client (hostname array) ──
  {
    const normalized = getNormalizedUrl(apiUrl);
    const directUrl = (/^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`) + path;
    console.log(`[whatsapp-instance] Strategy2: ${method} ${directUrl} (insecure client)`);

    const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: [hostname] });
    try {
      const response = await fetch(directUrl, {
        method,
        headers,
        body: fetchBody,
        client,
      });

      const payload = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(`Evolution API [${response.status}]: ${extractErrorMessage(payload)}`);
      }
      console.log(`[whatsapp-instance] Strategy2: success ${response.status}`);
      return payload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Strategy2: ${msg}`);
      console.error(`[whatsapp-instance] Strategy2 failed:`, msg);
    } finally {
      client.close();
    }
  }

  // All strategies failed
  const consolidated = errors.join(" | ");
  throw new Error(
    `Falha ao conectar com Evolution API. Detalhes: ${consolidated}. ` +
    `Se o erro persistir com 'CaUsedAsEndEntity', o certificado SSL do servidor Evolution (${hostname}) ` +
    `precisa ser corrigido (a CA está sendo usada como certificado final).`
  );
}

// ── Main handler ──

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
          ? ((result as Record<string, unknown>).instance as Record<string, unknown>)?.state ?? "disconnected"
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
