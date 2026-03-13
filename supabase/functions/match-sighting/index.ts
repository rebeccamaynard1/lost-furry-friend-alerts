import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { sighting_id, lat, lng } = await req.json();

    if (!lat || !lng) {
      return new Response(JSON.stringify({ matched: false, reason: "No coordinates" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find lost pets within 2 miles
    const { data: lostPets } = await supabase
      .from("lost_pets")
      .select("id, pet_name, user_id, last_seen_lat, last_seen_lng")
      .eq("status", "lost")
      .not("last_seen_lat", "is", null)
      .not("last_seen_lng", "is", null);

    if (!lostPets || lostPets.length === 0) {
      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let closestPet = null;
    let closestDist = Infinity;

    for (const pet of lostPets) {
      const dist = haversine(lat, lng, pet.last_seen_lat!, pet.last_seen_lng!);
      if (dist <= 2 && dist < closestDist) {
        closestDist = dist;
        closestPet = pet;
      }
    }

    if (closestPet) {
      // Attach sighting to pet
      await supabase
        .from("sightings")
        .update({ pet_id: closestPet.id })
        .eq("id", sighting_id);

      // Notify the pet owner
      await supabase.from("notifications").insert({
        user_id: closestPet.user_id,
        title: `👁️ New Sighting of ${closestPet.pet_name}!`,
        message: `Someone spotted a pet matching ${closestPet.pet_name}'s description ${closestDist.toFixed(1)} miles from the last seen location.`,
        type: "sighting",
        pet_id: closestPet.id,
        link: `/sightings`,
      });

      return new Response(JSON.stringify({
        matched: true,
        pet_id: closestPet.id,
        pet_name: closestPet.pet_name,
        distance: closestDist,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ matched: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
