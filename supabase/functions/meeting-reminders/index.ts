import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const twentyMinFromNow = new Date(now.getTime() + 20 * 60 * 1000);

    // Find meetings scheduled within next 20 min that haven't received a reminder
    const { data: meetings, error } = await supabaseAdmin
      .from("pipeline_meetings")
      .select("id")
      .eq("status", "scheduled")
      .is("reminder_sent_at", null)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", twentyMinFromNow.toISOString());

    if (error) {
      console.error("Error fetching meetings:", error);
      throw error;
    }

    console.log(`Found ${meetings?.length || 0} meetings needing reminders`);

    const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meeting-notify`;
    const results = [];

    for (const meeting of meetings || []) {
      try {
        const res = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ meeting_id: meeting.id, type: "reminder" }),
        });
        const data = await res.json();
        results.push({ meeting_id: meeting.id, success: data.success });
      } catch (e) {
        console.error(`Error sending reminder for meeting ${meeting.id}:`, e);
        results.push({ meeting_id: meeting.id, success: false });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Meeting reminders error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
