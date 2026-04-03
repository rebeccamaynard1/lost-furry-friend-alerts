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

// Simple geocode using Nominatim (same as client-side helper)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "LostFurryFriendAlerts/1.0" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // geocode failed silently
  }
  return null;
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
    const { type, pet_id, lat, lng, pet_name, species, breed, photo_url, reporter_user_id } = await req.json();

    // We need coordinates to do distance filtering
    const petLat = typeof lat === "number" ? lat : null;
    const petLng = typeof lng === "number" ? lng : null;

    // Get all user profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, home_address, subscription_status, alert_radius_miles");

    if (!profiles) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = [];

    for (const profile of profiles) {
      // Skip the reporting user
      if (profile.user_id === reporter_user_id) continue;

      const radius = profile.alert_radius_miles || 5;

      // If we have pet coordinates AND user has a home address, do distance filtering
      if (petLat !== null && petLng !== null && profile.home_address) {
        const userCoords = await geocodeAddress(profile.home_address);
        if (userCoords) {
          const dist = haversine(petLat, petLng, userCoords.lat, userCoords.lng);
          if (dist > radius) continue; // Outside alert radius — skip
        } else {
          // Can't geocode user address — skip to avoid spamming
          continue;
        }
      } else if (petLat !== null && petLng !== null && !profile.home_address) {
        // No home address set — skip (can't determine distance)
        continue;
      }
      // If no pet coordinates, fall through and notify (rare edge case)

      notifications.push({
        user_id: profile.user_id,
        title: type === "lost" ? `🚨 Lost Pet Alert: ${pet_name}` : `✅ Found Pet Alert`,
        message: type === "lost"
          ? `A ${species}${breed ? ` (${breed})` : ""} named ${pet_name} was reported lost nearby.`
          : `A ${species}${breed ? ` (${breed})` : ""} was found nearby.`,
        type: "alert",
        pet_id,
        photo_url,
        link: `/pet/${pet_id}?type=${type}`,
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
