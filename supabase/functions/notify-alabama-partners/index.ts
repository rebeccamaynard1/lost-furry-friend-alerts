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

    // Send real email to each partner via send-transactional-email
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const partner of partnersWithEmail) {
      try {
        const { error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "lost-pet-alert",
            recipientEmail: partner.email,
            idempotencyKey: `alabama-alert-${pet_id || pet_name}-${partner.id}`,
            templateData: {
              pet_name,
              species,
              breed,
              color,
              description,
              last_seen_address,
              contact_name,
              contact_phone,
              contact_email,
              photo_url,
              partner_name: partner.name,
            },
          },
        });

        if (invokeError) {
          console.error(`Failed to send email to ${partner.email}:`, invokeError);
          emailsFailed++;
        } else {
          emailsSent++;
        }
      } catch (err) {
        console.error(`Error sending to ${partner.email}:`, err);
        emailsFailed++;
      }
    }

    console.log(`Alabama Partner Alert: ${emailsSent} sent, ${emailsFailed} failed for pet: ${pet_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        partners_notified: partnersWithEmail.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
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
