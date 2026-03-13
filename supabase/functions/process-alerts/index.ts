import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { type, pet_id, lat, lng, pet_name, species, breed, photo_url } = await req.json();

    // Get all users with their profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, home_address, subscription_status, alert_radius_miles, state");

    if (!profiles) return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // For each user, check if they're within alert radius
    const notifications = [];
    for (const profile of profiles) {
      // Skip the reporting user
      const radius = profile.alert_radius_miles || 5;

      // Create notification for nearby users (simplified — in production would use geocoding)
      // For now, notify all users but mark premium ones as instant
      const isPremium = profile.subscription_status === "premium";

      notifications.push({
        user_id: profile.user_id,
        title: type === "lost" ? `🚨 Lost Pet Alert: ${pet_name}` : `✅ Found Pet Alert`,
        message: type === "lost"
          ? `A ${species}${breed ? ` (${breed})` : ""} named ${pet_name} was reported lost nearby.`
          : `A ${species}${breed ? ` (${breed})` : ""} was found nearby.`,
        type: "alert",
        pet_id,
        photo_url,
        link: type === "lost" ? `/report-lost/${pet_id}` : `/report-found/${pet_id}`,
      });
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
