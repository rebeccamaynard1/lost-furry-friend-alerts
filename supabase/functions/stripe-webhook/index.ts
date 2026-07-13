import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
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

  const updateProfilePremium = async (
    opts: { customerId?: string | null; email?: string | null; userId?: string | null },
    isPremium: boolean,
  ) => {
    const update: Record<string, unknown> = {
      subscription_status: isPremium ? "premium" : "free",
      alert_radius_miles: isPremium ? 25 : 5,
    };
    // Prefer stripe_customer_id, then user_id, then email as a last resort.
    let query = supabaseAdmin.from("profiles").update(update);
    if (opts.customerId) query = query.eq("stripe_customer_id", opts.customerId);
    else if (opts.userId) query = query.eq("user_id", opts.userId);
    else if (opts.email) query = query.eq("email", opts.email);
    else return;
    const { error } = await query;
    if (error) logStep("Profile update error", { ...opts, error: error.message });
    else logStep("Profile updated", { ...opts, isPremium });

    // Backfill customer id if we matched by email/user_id.
    if (opts.customerId && (opts.userId || opts.email) && !error) {
      const backfill = supabaseAdmin.from("profiles").update({ stripe_customer_id: opts.customerId });
      if (opts.userId) await backfill.eq("user_id", opts.userId);
      else if (opts.email) await backfill.eq("email", opts.email);
    }
  };


  const BOOST_PRICE_MAP: Record<string, { tier: string; duration_days: number; radius_miles: number }> = {
    "price_1ThR93Cn19AGQAKo7L2lYlna": { tier: "standard", duration_days: 3, radius_miles: 15 },
    "price_1ThR94Cn19AGQAKomoFmagza": { tier: "extended", duration_days: 7, radius_miles: 25 },
  };

  const resolveUserId = async (opts: { customerId?: string | null; userId?: string | null; email?: string | null }): Promise<string | null> => {
    if (opts.userId) return opts.userId;
    if (opts.customerId) {
      const { data } = await supabaseAdmin.from("profiles").select("user_id").eq("stripe_customer_id", opts.customerId).maybeSingle();
      if (data?.user_id) return data.user_id;
    }
    if (opts.email) {
      const { data } = await supabaseAdmin.from("profiles").select("user_id").eq("email", opts.email).maybeSingle();
      if (data?.user_id) return data.user_id;
    }
    return null;
  };

  const recordBoostFromSession = async (session: Stripe.Checkout.Session) => {
    try {
      const email = session.customer_details?.email || session.customer_email;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const metaUserId = (session.metadata?.supabase_user_id as string | undefined) || session.client_reference_id || null;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      const priceId = lineItems.data[0]?.price?.id;
      const meta = priceId ? BOOST_PRICE_MAP[priceId] : undefined;
      if (!meta) {
        logStep("Payment not a known boost price", { priceId });
        return;
      }

      const userId = await resolveUserId({ customerId, userId: metaUserId, email });
      if (!userId) {
        logStep("Profile not found for boost", { email, customerId });
        return;
      }
      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt.getTime() + meta.duration_days * 24 * 60 * 60 * 1000);
      const { error: insertError } = await supabaseAdmin.from("alert_boosts").insert({
        user_id: userId,
        tier: meta.tier,
        stripe_session_id: session.id,
        stripe_price_id: priceId,
        amount_cents: session.amount_total ?? lineItems.data[0]?.amount_total ?? null,
        duration_days: meta.duration_days,
        radius_miles: meta.radius_miles,
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
      if (insertError) logStep("Boost insert error", { error: insertError.message });
      else logStep("Boost recorded", { user_id: userId, tier: meta.tier, expires_at: expiresAt.toISOString() });
    } catch (err) {
      logStep("Boost handler error", { error: (err as Error).message });
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const email = session.customer_details?.email || session.customer_email;
        const metaUserId = (session.metadata?.supabase_user_id as string | undefined) || session.client_reference_id || null;
        if (session.mode === "subscription") {
          await updateProfilePremium({ customerId, email, userId: metaUserId }, true);
        } else if (session.mode === "payment") {
          await recordBoostFromSession(session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;
        const isActive = sub.status === "active" || sub.status === "trialing";
        await updateProfilePremium({ customerId, email }, isActive);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;
        await updateProfilePremium({ customerId, email }, false);
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
