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

  async function setPetBoosted(petId: string | null, userId: string, boosted: boolean) {
    if (!petId) return;
    const { error } = await supabaseAdmin
      .from("lost_pets")
      .update({ boosted, boosted_at: boosted ? new Date().toISOString() : null })
      .eq("id", petId)
      .eq("user_id", userId);
    if (error) logStep("Pet boosted flag update error", { error: error.message });
  }

  // A subscription checkout's first invoice fires checkout.session.completed; we
  // record the boost row here, keyed by the Stripe subscription id so later
  // lifecycle events (renewal, cancellation) can find and update it.
  const recordBoostFromSession = async (session: Stripe.Checkout.Session) => {
    try {
      const tier = session.metadata?.tier ?? "";
      const petId = session.metadata?.pet_id || null;
      const userId = (session.metadata?.supabase_user_id as string | undefined) || session.client_reference_id || null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (!isBoostTierKey(tier)) {
        logStep("Payment not a known boost tier", { tier });
        return;
      }
      if (!userId || !subscriptionId) {
        logStep("Missing user id or subscription id on boost session", { sessionId: session.id });
        return;
      }

      const meta = BOOST_TIERS[tier];
      const priceId = (await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })).data[0]?.price?.id ?? null;

      const { error: insertError } = await supabaseAdmin.from("alert_boosts").insert({
        user_id: userId,
        pet_id: petId,
        tier,
        stripe_session_id: session.id,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        amount_cents: session.amount_total ?? meta.amountCents,
        radius_miles: meta.radiusMiles,
        status: "active",
        purchased_at: new Date().toISOString(),
        expires_at: null,
      });
      if (insertError) {
        logStep("Boost insert error", { error: insertError.message });
        return;
      }

      await setPetBoosted(petId, userId, true);
      logStep("Boost subscription recorded", { user_id: userId, tier, subscriptionId });
    } catch (err) {
      logStep("Boost handler error", { error: (err as Error).message });
    }
  };

  // Subscription renewed/still active (covers trialing too) — make sure the row
  // and the pet's boosted flag reflect that.
  const handleSubscriptionActive = async (sub: Stripe.Subscription) => {
    const { data: row } = await supabaseAdmin
      .from("alert_boosts")
      .select("user_id, pet_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    if (!row) {
      logStep("No boost row for active subscription", { subscriptionId: sub.id });
      return;
    }
    await supabaseAdmin.from("alert_boosts").update({ status: "active" }).eq("stripe_subscription_id", sub.id);
    await setPetBoosted(row.pet_id, row.user_id, true);
  };

  // Subscription canceled, or payment failed and Stripe gave up (unpaid) — turn
  // the boost off.
  const handleSubscriptionInactive = async (sub: Stripe.Subscription, status: string) => {
    const { data: row } = await supabaseAdmin
      .from("alert_boosts")
      .select("user_id, pet_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    if (!row) {
      logStep("No boost row for inactive subscription", { subscriptionId: sub.id });
      return;
    }
    await supabaseAdmin.from("alert_boosts").update({ status }).eq("stripe_subscription_id", sub.id);
    await setPetBoosted(row.pet_id, row.user_id, false);
    logStep("Boost subscription deactivated", { subscriptionId: sub.id, status });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await recordBoostFromSession(session);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.status === "active" || sub.status === "trialing") {
          await handleSubscriptionActive(sub);
        } else if (sub.status === "past_due" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
          await handleSubscriptionInactive(sub, "past_due");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionInactive(sub, "canceled");
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
