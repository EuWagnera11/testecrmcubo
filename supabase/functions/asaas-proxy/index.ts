import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_BASE = 'https://api.asaas.com/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
  if (!ASAAS_API_KEY) {
    return new Response(JSON.stringify({ error: 'ASAAS_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, ...params } = await req.json();

    const asaasFetch = async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${ASAAS_BASE}${path}`, {
        ...options,
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }
      return data;
    };

    let result;

    switch (action) {
      // === CUSTOMERS ===
      case 'list_customers': {
        const query = new URLSearchParams();
        if (params.name) query.set('name', params.name);
        if (params.cpfCnpj) query.set('cpfCnpj', params.cpfCnpj);
        if (params.email) query.set('email', params.email);
        query.set('limit', String(params.limit || 20));
        query.set('offset', String(params.offset || 0));
        result = await asaasFetch(`/customers?${query.toString()}`);
        break;
      }
      case 'create_customer': {
        result = await asaasFetch('/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: params.name,
            cpfCnpj: params.cpfCnpj,
            email: params.email,
            phone: params.phone,
            mobilePhone: params.mobilePhone,
            externalReference: params.externalReference,
          }),
        });
        break;
      }

      // === PAYMENTS (Cobranças) ===
      case 'list_payments': {
        const query = new URLSearchParams();
        if (params.customer) query.set('customer', params.customer);
        if (params.status) query.set('status', params.status);
        query.set('limit', String(params.limit || 20));
        query.set('offset', String(params.offset || 0));
        result = await asaasFetch(`/payments?${query.toString()}`);
        break;
      }
      case 'create_payment': {
        result = await asaasFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            customer: params.customer,
            billingType: params.billingType,
            value: params.value,
            dueDate: params.dueDate,
            description: params.description,
            externalReference: params.externalReference,
          }),
        });
        break;
      }
      case 'get_payment': {
        result = await asaasFetch(`/payments/${params.id}`);
        break;
      }
      case 'delete_payment': {
        result = await asaasFetch(`/payments/${params.id}`, { method: 'DELETE' });
        break;
      }

      // === PIX QR CODE ===
      case 'get_pix_qrcode': {
        result = await asaasFetch(`/payments/${params.id}/pixQrCode`);
        break;
      }

      // === PAYMENT LINK ===
      case 'get_payment_link': {
        result = await asaasFetch(`/payments/${params.id}/identificationField`);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Asaas proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
