import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CHECK-BOOST-EXPIRATIONS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const tierLabel = (t: string) =>
  t === "extended" ? "Extended Boost" : t === "standard" ? "Standard Boost" : "Alert Boost";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const nowIso = new Date().toISOString();
  const in24hIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const sendEmail = async (recipient: string, idempotencyKey: string, data: Record<string, unknown>) => {
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "boost-expiry",
          recipientEmail: recipient,
          idempotencyKey,
          templateData: data,
        },
      });
      if (error) log("Email send error", { recipient, error: error.message });
    } catch (e) {
      log("Email send exception", { recipient, error: (e as Error).message });
    }
  };

  const getEmail = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data?.email) return null;
    return data.email;
  };

  let expiringCount = 0;
  let expiredCount = 0;

  try {
    const { data: expiringSoon, error: e1 } = await supabase
      .from("alert_boosts")
      .select("id, user_id, tier, expires_at")
      .gt("expires_at", nowIso)
      .lte("expires_at", in24hIso)
      .is("expiring_soon_notified_at", null);

    if (e1) log("Query expiring error", { error: e1.message });

    for (const boost of expiringSoon ?? []) {
      const hoursLeft = Math.max(
        1,
        Math.round((new Date(boost.expires_at).getTime() - Date.now()) / 36e5)
      );
      const label = tierLabel(boost.tier);

      await supabase.from("notifications").insert({
        user_id: boost.user_id,
        title: "Alert Boost expiring soon",
        message: `Your ${label} expires in about ${hoursLeft} hours.`,
        type: "boost_expiring",
        link: "/premium",
      });

      const email = await getEmail(boost.user_id);
      if (email) {
        await sendEmail(email, `boost-expiring-${boost.id}`, {
          kind: "expiring_soon",
          tier: boost.tier,
          expires_at: boost.expires_at,
          hours_left: hoursLeft,
        });
      }

      await supabase
        .from("alert_boosts")
        .update({ expiring_soon_notified_at: nowIso })
        .eq("id", boost.id);

      expiringCount++;
    }

    const { data: expired, error: e2 } = await supabase
      .from("alert_boosts")
      .select("id, user_id, tier, expires_at")
      .lte("expires_at", nowIso)
      .is("expired_notified_at", null);

    if (e2) log("Query expired error", { error: e2.message });

    for (const boost of expired ?? []) {
      const label = tierLabel(boost.tier);

      await supabase.from("notifications").insert({
        user_id: boost.user_id,
        title: "Alert Boost expired",
        message: `Your ${label} has expired. Renew it to keep top placement.`,
        type: "boost_expired",
        link: "/premium",
      });

      const email = await getEmail(boost.user_id);
      if (email) {
        await sendEmail(email, `boost-expired-${boost.id}`, {
          kind: "expired",
          tier: boost.tier,
          expires_at: boost.expires_at,
        });
      }

      await supabase
        .from("alert_boosts")
        .update({ expired_notified_at: nowIso })
        .eq("id", boost.id);

      expiredCount++;
    }

    log("Done", { expiringCount, expiredCount });

    return new Response(
      JSON.stringify({ ok: true, expiring: expiringCount, expired: expiredCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    log("Handler error", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
