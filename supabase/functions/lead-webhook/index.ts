import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Accept flexible field names
    const name = body.name || body.nome || body.full_name || body.fullName || 'Lead sem nome';
    const email = body.email || body.e_mail || null;
    const phone = body.phone || body.telefone || body.whatsapp || body.cel || null;
    const source = body.source || body.origem || body.utm_source || 'webhook';
    const message = body.message || body.mensagem || body.msg || null;

    // Store any extra fields
    const knownKeys = ['name', 'nome', 'full_name', 'fullName', 'email', 'e_mail', 'phone', 'telefone', 'whatsapp', 'cel', 'source', 'origem', 'utm_source', 'message', 'mensagem', 'msg'];
    const extraData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(body)) {
      if (!knownKeys.includes(key)) {
        extraData[key] = val;
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabase
      .from('webhook_leads')
      .insert({
        name,
        email,
        phone,
        source,
        message,
        extra_data: Object.keys(extraData).length > 0 ? extraData : null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Lead webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
