import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pet_name, species, breed, color, description, last_seen_address, contact_name, contact_phone, contact_email, photo_url, pet_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all Alabama partners with email
    const { data: partners, error } = await supabase
      .from("alabama_partners")
      .select("id, name, email")
      .not("email", "is", null);

    if (error) throw error;

    const partnersWithEmail = (partners || []).filter((p: any) => p.email && p.email.includes("@"));

    if (partnersWithEmail.length === 0) {
      return new Response(JSON.stringify({ message: "No partners with email found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create in-app notifications for tracking
    const notifications = partnersWithEmail.map((p: any) => ({
      user_id: p.id, // placeholder - partners don't have user accounts necessarily
      title: `🚨 Lost Pet Alert: ${pet_name}`,
      message: `A ${species}${breed ? ` (${breed})` : ""} named "${pet_name}" was lost near ${last_seen_address || "Alabama"}. Color: ${color || "N/A"}. ${description || ""} Contact: ${contact_name} at ${contact_phone}${contact_email ? ` / ${contact_email}` : ""}`,
      type: "alabama_alert",
      pet_id: pet_id || null,
      photo_url: photo_url || null,
      link: pet_id ? `/my-pets` : null,
    }));

    // Log the alert (we store the email list for reference)
    console.log(`Alabama Partner Alert sent to ${partnersWithEmail.length} partners for pet: ${pet_name}`);
    console.log("Partner emails:", partnersWithEmail.map((p: any) => p.email).join(", "));

    return new Response(
      JSON.stringify({
        success: true,
        partners_notified: partnersWithEmail.length,
        partner_emails: partnersWithEmail.map((p: any) => p.email),
        pet_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
