import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloseMonthRequest {
  client_id: string;
  period_key: string; // "2024-12"
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id, period_key }: CloseMonthRequest = await req.json();

    if (!client_id || !period_key) {
      return new Response(
        JSON.stringify({ error: 'client_id and period_key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[close-client-month] Starting closure for client ${client_id}, period ${period_key}`);

    // 1. Check if already closed
    const { data: existingClosure } = await supabase
      .from('client_month_closures')
      .select('id')
      .eq('client_id', client_id)
      .eq('period_key', period_key)
      .maybeSingle();

    if (existingClosure) {
      return new Response(
        JSON.stringify({ error: 'Month already closed', closure_id: existingClosure.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, company, plan_billing_day, monthly_plan_value')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      console.error('[close-client-month] Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const billingDay = client.plan_billing_day || 1;
    const [year, month] = period_key.split('-').map(Number);

    // Calculate period start and end based on billing day
    // For period "2024-12" with billing day 12:
    // Start: Nov 12, 2024
    // End: Dec 11, 2024
    const periodEnd = new Date(year, month - 1, billingDay - 1);
    const periodStart = new Date(year, month - 2, billingDay);

    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr = periodEnd.toISOString().split('T')[0];

    console.log(`[close-client-month] Period: ${periodStartStr} to ${periodEndStr}`);

    // 3. Get all projects for this client
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', client_id);

    const projectIds = projects?.map(p => p.id) || [];
    console.log(`[close-client-month] Found ${projectIds.length} projects`);

    // 4. Get all campaigns for these projects
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

    const campaignIds = campaigns?.map(c => c.id) || [];
    console.log(`[close-client-month] Found ${campaignIds.length} campaigns`);

    // 5. Get all metrics for the period
    const { data: metrics } = await supabase
      .from('campaign_metrics')
      .select('*')
      .in('campaign_id', campaignIds.length > 0 ? campaignIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('date', periodStartStr)
      .lte('date', periodEndStr);

    console.log(`[close-client-month] Found ${metrics?.length || 0} metrics in period`);

    // 6. Calculate totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalLeads = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let totalReach = 0;

    metrics?.forEach(m => {
      totalSpend += Number(m.spend) || 0;
      totalImpressions += Number(m.impressions) || 0;
      totalClicks += Number(m.clicks) || 0;
      totalLeads += Number(m.leads) || 0;
      totalConversions += Number(m.conversions) || 0;
      totalRevenue += Number(m.revenue) || 0;
      totalReach += Number(m.reach) || 0;
    });

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Calculate project/creative totals
    let totalStaticCreatives = 0;
    let totalCarouselCreatives = 0;
    let totalProjectValue = 0;

    projects?.forEach(p => {
      totalStaticCreatives += p.static_creatives || 0;
      totalCarouselCreatives += p.carousel_creatives || 0;
      totalProjectValue += Number(p.total_value) || 0;
    });

    // 7. Build snapshot data
    const snapshotData = {
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        billing_day: billingDay,
        monthly_plan_value: client.monthly_plan_value,
      },
      period: {
        key: period_key,
        start: periodStartStr,
        end: periodEndStr,
      },
      projects: projects?.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        project_types: p.project_types,
        total_value: p.total_value,
        static_creatives: p.static_creatives,
        carousel_creatives: p.carousel_creatives,
      })) || [],
      campaigns: campaigns?.map(c => {
        const campaignMetrics = metrics?.filter(m => m.campaign_id === c.id) || [];
        const cSpend = campaignMetrics.reduce((acc, m) => acc + (Number(m.spend) || 0), 0);
        const cImpressions = campaignMetrics.reduce((acc, m) => acc + (Number(m.impressions) || 0), 0);
        const cClicks = campaignMetrics.reduce((acc, m) => acc + (Number(m.clicks) || 0), 0);
        const cLeads = campaignMetrics.reduce((acc, m) => acc + (Number(m.leads) || 0), 0);
        const cConversions = campaignMetrics.reduce((acc, m) => acc + (Number(m.conversions) || 0), 0);
        const cRevenue = campaignMetrics.reduce((acc, m) => acc + (Number(m.revenue) || 0), 0);

        return {
          id: c.id,
          name: c.name,
          platform: c.platform,
          status: c.status,
          spend: cSpend,
          impressions: cImpressions,
          clicks: cClicks,
          leads: cLeads,
          conversions: cConversions,
          revenue: cRevenue,
          ctr: cImpressions > 0 ? (cClicks / cImpressions) * 100 : 0,
          cpc: cClicks > 0 ? cSpend / cClicks : 0,
          roas: cSpend > 0 ? cRevenue / cSpend : 0,
        };
      }) || [],
      metrics_daily: metrics || [],
      totals: {
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        leads: totalLeads,
        conversions: totalConversions,
        revenue: totalRevenue,
        reach: totalReach,
        ctr: avgCtr,
        cpc: avgCpc,
        cpl: avgCpl,
        roas: totalRoas,
        static_creatives: totalStaticCreatives,
        carousel_creatives: totalCarouselCreatives,
        project_value: totalProjectValue,
      },
    };

    // 8. Insert closure record
    const { data: closure, error: closureError } = await supabase
      .from('client_month_closures')
      .insert({
        client_id,
        period_key,
        period_start: periodStartStr,
        period_end: periodEndStr,
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_leads: totalLeads,
        total_conversions: totalConversions,
        total_revenue: totalRevenue,
        total_reach: totalReach,
        avg_ctr: avgCtr,
        avg_cpc: avgCpc,
        avg_cpl: avgCpl,
        total_roas: totalRoas,
        total_static_creatives: totalStaticCreatives,
        total_carousel_creatives: totalCarouselCreatives,
        projects_count: projects?.length || 0,
        campaigns_count: campaigns?.length || 0,
        snapshot_data: snapshotData,
        status: 'closed',
      })
      .select()
      .single();

    if (closureError) {
      console.error('[close-client-month] Error creating closure:', closureError);
      return new Response(
        JSON.stringify({ error: 'Failed to create closure', details: closureError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[close-client-month] Closure created with ID: ${closure.id}`);

    // 9. Get active commission rules and calculate commissions
    const { data: rules } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('is_active', true);

    const commissions: any[] = [];

    if (rules && rules.length > 0) {
      // Get project members to find users by role
      const { data: projectMembers } = await supabase
        .from('project_members')
        .select('user_id, role')
        .in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

      // Get profiles for user names
      const memberUserIds = projectMembers?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      for (const rule of rules) {
        let applicableUsers: string[] = [];

        if (rule.target_user_id) {
          // Specific user rule
          applicableUsers = [rule.target_user_id];
        } else if (rule.target_role) {
          // Role-based rule
          applicableUsers = projectMembers
            ?.filter(m => m.role === rule.target_role)
            .map(m => m.user_id) || [];
        }

        // Calculate base value based on base_field
        let baseValue = 0;
        switch (rule.base_field) {
          case 'total_spend':
            baseValue = totalSpend;
            break;
          case 'total_revenue':
            baseValue = totalRevenue;
            break;
          case 'project_value':
            baseValue = totalProjectValue;
            break;
          case 'plan_value':
            baseValue = Number(client.monthly_plan_value) || 0;
            break;
          default:
            baseValue = totalSpend;
        }

        for (const userId of applicableUsers) {
          let amount = 0;
          let percentage = null;

          if (rule.calc_type === 'percentage') {
            percentage = Number(rule.value);
            amount = baseValue * (percentage / 100);
          } else {
            amount = Number(rule.value);
          }

          if (amount > 0) {
            commissions.push({
              closure_id: closure.id,
              user_id: userId,
              user_name: profileMap.get(userId) || 'Usuário',
              rule_id: rule.id,
              base_value: baseValue,
              percentage,
              amount,
              description: `${rule.name} - ${period_key}`,
            });
          }
        }
      }

      // Insert commissions
      if (commissions.length > 0) {
        const { error: commError } = await supabase
          .from('closure_commissions')
          .insert(commissions);

        if (commError) {
          console.error('[close-client-month] Error creating commissions:', commError);
        } else {
          console.log(`[close-client-month] Created ${commissions.length} commission records`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        closure_id: closure.id,
        period_key,
        totals: {
          spend: totalSpend,
          impressions: totalImpressions,
          clicks: totalClicks,
          leads: totalLeads,
          conversions: totalConversions,
          revenue: totalRevenue,
        },
        commissions_count: commissions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[close-client-month] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
