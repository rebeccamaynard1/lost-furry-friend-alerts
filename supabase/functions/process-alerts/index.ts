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
    const body = await req.json();
    const {
      type, pet_id, pet_name, species, breed, color,
      description, last_seen_address, contact_name, contact_phone, contact_email,
      photo_url, reporter_user_id,
    } = body;

    const labelType: string = type || "lost";
    const displayName = pet_name || (labelType === "sighting" ? "a pet" : `a ${species || "pet"}`);

    // ---- In-app notifications: send to ALL registered users (except reporter) ----
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, name");

    const notifications: any[] = [];
    const emailSet = new Set<string>();

    for (const p of profiles || []) {
      if (p.user_id === reporter_user_id) continue;
      notifications.push({
        user_id: p.user_id,
        title:
          labelType === "lost"   ? `🚨 Lost Pet Alert: ${displayName}` :
          labelType === "found"  ? `✅ Found Pet Alert` :
                                   `👁️ New Pet Sighting Reported`,
        message:
          labelType === "lost"   ? `A ${species || "pet"}${breed ? ` (${breed})` : ""} named ${displayName} was reported lost.` :
          labelType === "found"  ? `A ${species || "pet"}${breed ? ` (${breed})` : ""} was found and needs its owner.` :
                                   `A new sighting was posted${last_seen_address ? ` near ${last_seen_address}` : ""}.`,
        type: "alert",
        pet_id: pet_id || null,
        photo_url: photo_url || null,
        link: pet_id ? `/pet/${pet_id}?type=${labelType}` : `/sightings`,
      });
      if (p.email) emailSet.add(p.email.trim().toLowerCase());
    }

    if (notifications.length > 0) {
      // insert in chunks
      for (let i = 0; i < notifications.length; i += 500) {
        await supabase.from("notifications").insert(notifications.slice(i, i + 500));
      }
    }

    // ---- Collect emails from every partner directory ----
    const partnerTables = ["shelters", "alabama_partners", "rural_partners", "volunteers", "sponsors"];
    for (const t of partnerTables) {
      const { data } = await supabase.from(t).select("email").not("email", "is", null);
      for (const row of data || []) {
        const e = (row as any).email?.trim().toLowerCase();
        if (e && e.includes("@")) emailSet.add(e);
      }
    }

    // ---- Enqueue emails via the transactional pipeline ----
    let emailed = 0;
    let failed = 0;
    const subjectPrefix =
      labelType === "lost"   ? `🚨 Lost Pet Alert` :
      labelType === "found"  ? `✅ Found Pet Alert` :
                               `👁️ Pet Sighting`;

    for (const email of emailSet) {
      try {
        const { error: mailErr } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "lost-pet-alert",
            recipientEmail: email,
            idempotencyKey: `${labelType}-alert-${pet_id || crypto.randomUUID()}-${email}`,
            templateData: {
              pet_name: displayName,
              species: species || "pet",
              breed: breed || "",
              color: color || "",
              description: description || (labelType === "sighting" ? "A pet was spotted in your area." : ""),
              last_seen_address: last_seen_address || "",
              contact_name: contact_name || "",
              contact_phone: contact_phone || "",
              contact_email: contact_email || "",
              photo_url: photo_url || "",
              alert_type: labelType,
              subject_prefix: subjectPrefix,
            },
          },
        });
        if (mailErr) { failed++; console.error("mail err", email, mailErr); }
        else emailed++;
      } catch (err) {
        failed++;
        console.error("enqueue fail", email, err);
      }
    }

    return new Response(JSON.stringify({
      sent: notifications.length,
      emailed,
      failed,
      recipients: emailSet.size,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
