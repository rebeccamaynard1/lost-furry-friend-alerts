import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const url = `https://ctvxecoeszrpkriqskhr.supabase.co/functions/v1/stripe-webhook`;
    const events = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ];

    // Delete any existing endpoints matching this URL so we can create a fresh one
    // with a known signing secret.
    const existing = await stripe.webhookEndpoints.list({ limit: 100 });
    for (const e of existing.data) {
      if (e.url === url) {
        await stripe.webhookEndpoints.del(e.id);
      }
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url,
      enabled_events: events,
      description: "Lost Furry Friend Alerts — premium subscription sync",
      api_version: "2025-08-27.basil",
    });

    return new Response(
      JSON.stringify({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        enabled_events: endpoint.enabled_events,
        secret: (endpoint as any).secret ?? null, // only present on create
        livemode: endpoint.livemode,
        reused_existing: !!match,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
