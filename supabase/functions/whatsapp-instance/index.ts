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
 * Strategy 1: HTTP-first + manual redirect control with explicit insecure client.
 *   - Starts from http:// and follows redirects manually.
 *   - Rewrites any https:// redirect target back to http://.
 *   - Handles multiple redirects (up to a safe limit) to avoid false failures on chained 301/302.
 *
 * Strategy 2 (fallback): Direct request to normalized URL with explicit insecure client.
 *   - Uses fetch(..., { client }) with unsafelyIgnoreCertificateErrors: true.
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
  const errors: string[] = [];

  let hostHint = "evoapi.refinecubo.com.br";
  try {
    const normalized = getNormalizedUrl(apiUrl);
    const withProto = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    hostHint = new URL(withProto).hostname;
  } catch {
    // keep fallback host
  }

  const redirectStatuses = new Set([301, 302, 303, 307, 308]);

  // ── Strategy 1: HTTP + manual redirect control (explicit insecure client) ──
  {
    const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true });
    let currentUrl = `${toHttpUrl(apiUrl)}${path}`;
    const maxRedirects = 8;

    console.log(
      `[whatsapp-instance] Strategy1: ${method} ${currentUrl} (redirect:manual, insecure-client:true)`
    );

    try {
      let redirects = 0;

      while (true) {
        const response = await fetch(currentUrl, {
          method,
          headers,
          body: fetchBody,
          redirect: "manual",
          client,
        });

        if (redirectStatuses.has(response.status)) {
          const location = response.headers.get("location");
          if (!location) {
            errors.push(`Strategy1: redirect ${response.status} sem header location`);
            console.warn(`[whatsapp-instance] ${errors[errors.length - 1]}`);
            break;
          }

          if (redirects >= maxRedirects) {
            errors.push(`Strategy1: redirect loop (>${maxRedirects})`);
            console.warn(`[whatsapp-instance] ${errors[errors.length - 1]}`);
            break;
          }

          let nextUrl: string;
          try {
            nextUrl = new URL(location, currentUrl).toString();
          } catch {
            nextUrl = location;
          }

          nextUrl = nextUrl.replace(/^https:\/\//i, "http://");
          redirects += 1;
          console.log(
            `[whatsapp-instance] Strategy1: redirect ${response.status} (#${redirects}) → ${nextUrl}`
          );
          currentUrl = nextUrl;
          continue;
        }

        const payload = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(`Evolution API [${response.status}]: ${extractErrorMessage(payload)}`);
        }

        console.log(`[whatsapp-instance] Strategy1: success ${response.status}`);
        return payload;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Strategy1: ${msg}`);
      console.error(`[whatsapp-instance] Strategy1 failed:`, msg);
    } finally {
      client.close();
    }
  }

  // ── Strategy 1b: try explicit port 8080 over HTTP (common Evolution setup) ──
  {
    let host: string | null = null;
    try {
      const normalized = getNormalizedUrl(apiUrl);
      const withProto = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
      host = new URL(withProto).hostname;
    } catch {
      host = null;
    }

    if (host) {
      const url8080 = `http://${host}:8080${path}`;
      console.log(`[whatsapp-instance] Strategy1b: ${method} ${url8080} (http:8080)`);

      const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true });
      try {
        const response = await fetch(url8080, {
          method,
          headers,
          body: fetchBody,
          redirect: "manual",
          signal: AbortSignal.timeout(5000),
          client,
        });

        if (!redirectStatuses.has(response.status)) {
          const payload = await parseResponseBody(response);
          if (!response.ok) {
            throw new Error(`Evolution API [${response.status}]: ${extractErrorMessage(payload)}`);
          }
          console.log(`[whatsapp-instance] Strategy1b: success ${response.status}`);
          return payload;
        }

        errors.push(`Strategy1b: redirect ${response.status} em ${url8080}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Strategy1b: ${msg}`);
        console.error(`[whatsapp-instance] Strategy1b failed:`, msg);
      } finally {
        client.close();
      }
    }
  }

  // ── Strategy 1c: resolve DNS and call HTTP via IP (bypass host-level redirects) ──
  {
    try {
      const ips = await Deno.resolveDns(hostHint, "A");
      for (const ip of ips.slice(0, 2)) {
        const ipUrl = `http://${ip}${path}`;
        console.log(`[whatsapp-instance] Strategy1c: ${method} ${ipUrl} (host:${hostHint})`);

        const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true });
        try {
          const response = await fetch(ipUrl, {
            method,
            headers: { ...headers, host: hostHint },
            body: fetchBody,
            redirect: "manual",
            signal: AbortSignal.timeout(5000),
            client,
          });

          if (!redirectStatuses.has(response.status)) {
            const payload = await parseResponseBody(response);
            if (!response.ok) {
              throw new Error(`Evolution API [${response.status}]: ${extractErrorMessage(payload)}`);
            }
            console.log(`[whatsapp-instance] Strategy1c: success ${response.status}`);
            return payload;
          }

          errors.push(`Strategy1c: redirect ${response.status} via ${ip}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Strategy1c(${ip}): ${msg}`);
          console.error(`[whatsapp-instance] Strategy1c failed (${ip}):`, msg);
        } finally {
          client.close();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Strategy1c: DNS ${msg}`);
      console.error(`[whatsapp-instance] Strategy1c DNS failed:`, msg);
    }
  }

  // ── Strategy 2: Direct URL with explicit insecure client ──
  {
    const normalized = getNormalizedUrl(apiUrl);
    const directUrl =
      (/^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`) + path;

    console.log(
      `[whatsapp-instance] Strategy2: ${method} ${directUrl} (redirect:follow, insecure-client:true)`
    );

    const client = Deno.createHttpClient({ unsafelyIgnoreCertificateErrors: true });
    try {
      const response = await fetch(directUrl, {
        method,
        headers,
        body: fetchBody,
        redirect: "follow",
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
      `Se persistir 'CaUsedAsEndEntity', o SSL do servidor Evolution (${hostHint}) está inválido e precisa ser corrigido na origem.`
  );
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
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
    const configuredApiUrl = Deno.env.get("EVOLUTION_API_URL")?.trim();
    const configuredApiKey = Deno.env.get("EVOLUTION_API_KEY")?.trim();

    const evolutionApiUrl = configuredApiUrl || instance.api_url;
    const evolutionApiKey = configuredApiKey || instance.api_key;

    console.log(
      `[whatsapp-instance] Using API URL source: ${configuredApiUrl ? "secret" : "instance"}`
    );

    if (action === "check-status") {
      const result = await callEvolutionApi({
        apiUrl: evolutionApiUrl,
        apiKey: evolutionApiKey,
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
        apiUrl: evolutionApiUrl,
        apiKey: evolutionApiKey,
        path: `/instance/connect/${instanceName}`,
      });

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set-webhook") {
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Webhook já configurado: https://n8n.refinecubo.com.br/webhook/webhook-evolution",
    webhook_url: "https://n8n.refinecubo.com.br/webhook/webhook-evolution"
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
