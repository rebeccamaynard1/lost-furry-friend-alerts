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
    const {
      type, pet_id, lat, lng, pet_name, species, breed, color,
      description, last_seen_address, contact_name, contact_phone, contact_email,
      photo_url, reporter_user_id,
    } = await req.json();

    const petLat = typeof lat === "number" ? lat : null;
    const petLng = typeof lng === "number" ? lng : null;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, name, home_address, subscription_status, alert_radius_miles, notification_prefs");

    if (!profiles) {
      return new Response(JSON.stringify({ sent: 0, emailed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications: any[] = [];
    const emailRecipients: { email: string; name: string | null; user_id: string }[] = [];
    const prefKey = type === "lost" ? "lost_nearby" : "found_nearby";

    for (const profile of profiles) {
      if (profile.user_id === reporter_user_id) continue;

      const radius = profile.alert_radius_miles || 5;
      let inRange = true;

      if (petLat !== null && petLng !== null && profile.home_address) {
        const userCoords = await geocodeAddress(profile.home_address);
        if (userCoords) {
          const dist = haversine(petLat, petLng, userCoords.lat, userCoords.lng);
          if (dist > radius) inRange = false;
        } else {
          inRange = false;
        }
      } else if (petLat !== null && petLng !== null && !profile.home_address) {
        inRange = false;
      }

      if (!inRange) continue;

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

      // Check email preference
      const prefs = (profile.notification_prefs as Record<string, boolean> | null) || {};
      const wantsEmail = prefs[prefKey] !== false; // default true
      if (wantsEmail && profile.email) {
        emailRecipients.push({ email: profile.email, name: profile.name, user_id: profile.user_id });
      }
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // Send real emails via transactional email pipeline (lost-pet-alert template)
    let emailed = 0;
    if (type === "lost" && emailRecipients.length > 0) {
      for (const r of emailRecipients) {
        try {
          const { error: mailErr } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "lost-pet-alert",
              recipientEmail: r.email,
              idempotencyKey: `lost-alert-${pet_id}-${r.user_id}`,
              templateData: {
                pet_name, species, breed, color, description,
                last_seen_address, contact_name, contact_phone, contact_email,
                photo_url, partner_name: r.name || undefined,
              },
            },
          });
          if (!mailErr) emailed++;
        } catch (err) {
          console.error("Email enqueue failed for", r.email, err);
        }
      }
    }

    return new Response(JSON.stringify({ sent: notifications.length, emailed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
