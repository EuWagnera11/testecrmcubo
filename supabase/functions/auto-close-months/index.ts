import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const currentDay = today.getDate();
    
    console.log(`[auto-close-months] Running for day ${currentDay}`);

    // Find all clients with billing_day matching today
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, plan_billing_day')
      .eq('plan_billing_day', currentDay)
      .eq('status', 'active');

    if (clientsError) {
      console.error('[auto-close-months] Error fetching clients:', clientsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clients' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[auto-close-months] Found ${clients?.length || 0} clients with billing day ${currentDay}`);

    const results: any[] = [];

    for (const client of clients || []) {
      // Calculate which period should be closed
      // If today is billing day, we close the previous month
      // E.g., if today is Jan 12 and billing day is 12, we close December
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const periodKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

      console.log(`[auto-close-months] Checking client ${client.name} for period ${periodKey}`);

      // Check if already closed
      const { data: existingClosure } = await supabase
        .from('client_month_closures')
        .select('id')
        .eq('client_id', client.id)
        .eq('period_key', periodKey)
        .maybeSingle();

      if (existingClosure) {
        console.log(`[auto-close-months] Client ${client.name} already has closure for ${periodKey}`);
        results.push({
          client_id: client.id,
          client_name: client.name,
          period_key: periodKey,
          status: 'skipped',
          reason: 'already_closed',
        });
        continue;
      }

      // Call close-client-month function
      try {
        const { data, error } = await supabase.functions.invoke('close-client-month', {
          body: {
            client_id: client.id,
            period_key: periodKey,
          },
        });

        if (error) {
          console.error(`[auto-close-months] Error closing month for ${client.name}:`, error);
          results.push({
            client_id: client.id,
            client_name: client.name,
            period_key: periodKey,
            status: 'error',
            error: error.message,
          });
        } else {
          console.log(`[auto-close-months] Successfully closed month for ${client.name}`);
          results.push({
            client_id: client.id,
            client_name: client.name,
            period_key: periodKey,
            status: 'closed',
            closure_id: data?.closure_id,
          });
        }
      } catch (err: unknown) {
        console.error(`[auto-close-months] Exception closing month for ${client.name}:`, err);
        results.push({
          client_id: client.id,
          client_name: client.name,
          period_key: periodKey,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today.toISOString(),
        billing_day: currentDay,
        clients_processed: clients?.length || 0,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[auto-close-months] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
