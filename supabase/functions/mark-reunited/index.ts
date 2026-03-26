import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? ""
    );
    const { data: userData } = await anonClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { pet_id } = await req.json();
    if (!pet_id) throw new Error("pet_id required");

    // Update pet status
    const { data: pet } = await supabase
      .from("lost_pets")
      .update({ status: "reunited" })
      .eq("id", pet_id)
      .eq("user_id", userData.user.id)
      .select()
      .single();

    if (!pet) throw new Error("Pet not found or not owned by user");

    // Get sighting contributors
    const { data: sightings } = await supabase
      .from("sightings")
      .select("user_id")
      .eq("pet_id", pet_id);

    // Notify contributors
    const notifyUsers = new Set<string>();
    sightings?.forEach((s) => notifyUsers.add(s.user_id));

    const notifications = Array.from(notifyUsers).map((uid) => ({
      user_id: uid,
      title: `🎉 Happy Reunion: ${pet.pet_name}!`,
      message: `Great news! ${pet.pet_name} has been reunited with their family. Thank you for helping!`,
      type: "reunion",
      pet_id,
    }));

    // Also notify the owner
    notifications.push({
      user_id: pet.user_id,
      title: `🎉 ${pet.pet_name} Marked as Reunited!`,
      message: `We're so happy ${pet.pet_name} is back home! Thank you for using Lost Furry Friend Alerts.`,
      type: "reunion",
      pet_id,
    });

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
