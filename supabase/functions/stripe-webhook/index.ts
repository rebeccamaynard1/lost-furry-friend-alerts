import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { BOOST_TIERS, isBoostTierKey } from "../_shared/boost-tiers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Stripe keys not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Signature verification failed", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  logStep("Event received", { type: event.type, id: event.id });

  const recordBoostFromSession = async (session: Stripe.Checkout.Session) => {
    try {
      const tier = session.metadata?.tier ?? "";
      const petId = session.metadata?.pet_id || null;
      const userId = (session.metadata?.supabase_user_id as string | undefined) || session.client_reference_id || null;

      if (!isBoostTierKey(tier)) {
        logStep("Payment not a known boost tier", { tier });
        return;
      }
      if (!userId) {
        logStep("No user id on boost session", { sessionId: session.id });
        return;
      }

      const meta = BOOST_TIERS[tier];
      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt.getTime() + meta.durationDays * 24 * 60 * 60 * 1000);

      const { error: insertError } = await supabaseAdmin.from("alert_boosts").insert({
        user_id: userId,
        tier,
        stripe_session_id: session.id,
        stripe_price_id:
          typeof session.line_items === "undefined"
            ? null
            : (await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })).data[0]?.price?.id ?? null,
        amount_cents: session.amount_total ?? meta.amountCents,
        duration_days: meta.durationDays,
        radius_miles: meta.radiusMiles,
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
      if (insertError) {
        logStep("Boost insert error", { error: insertError.message });
        return;
      }

      if (petId) {
        const { error: petUpdateError } = await supabaseAdmin
          .from("lost_pets")
          .update({ boosted: true, boosted_at: purchasedAt.toISOString() })
          .eq("id", petId)
          .eq("user_id", userId);
        if (petUpdateError) logStep("Pet boosted flag update error", { error: petUpdateError.message });
      }

      logStep("Boost recorded", { user_id: userId, tier, expires_at: expiresAt.toISOString() });
    } catch (err) {
      logStep("Boost handler error", { error: (err as Error).message });
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") {
          await recordBoostFromSession(session);
        }
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Handler error", { error: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
