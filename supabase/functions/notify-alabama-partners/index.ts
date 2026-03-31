import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";

const SITE_NAME = "Lost Furry Friend Alerts";
const SENDER_DOMAIN = "notify.lostfurryfriendalerts.com";
const FROM_DOMAIN = "notify.lostfurryfriendalerts.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      pet_name, species, breed, color, description,
      last_seen_address, contact_name, contact_phone,
      contact_email, photo_url, pet_id,
    } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all Alabama partners with email
    const { data: partners, error } = await supabase
      .from("alabama_partners")
      .select("id, name, email")
      .not("email", "is", null);

    if (error) throw error;

    const partnersWithEmail = (partners || []).filter(
      (p: any) => p.email && p.email.includes("@")
    );

    if (partnersWithEmail.length === 0) {
      return new Response(
        JSON.stringify({ message: "No partners with email found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = TEMPLATES["lost-pet-alert"];
    if (!template) {
      throw new Error("lost-pet-alert template not found in registry");
    }

    let emailsQueued = 0;
    let emailsFailed = 0;

    for (const partner of partnersWithEmail) {
      try {
        const normalizedEmail = partner.email.trim().toLowerCase();
        const idempotencyKey = `alabama-alert-${pet_id || pet_name}-${partner.id}`;
        const messageId = crypto.randomUUID();

        // Check suppression
        const { data: suppressed } = await supabase
          .from("suppressed_emails")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (suppressed) {
          console.log(`Skipping suppressed email: ${normalizedEmail}`);
          continue;
        }

        // Ensure unsubscribe token exists
        let unsubscribeToken: string;
        const { data: existingToken } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token, used_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingToken && !existingToken.used_at) {
          unsubscribeToken = existingToken.token;
        } else if (!existingToken) {
          unsubscribeToken = generateToken();
          await supabase
            .from("email_unsubscribe_tokens")
            .upsert(
              { token: unsubscribeToken, email: normalizedEmail },
              { onConflict: "email", ignoreDuplicates: true }
            );
          // Re-read in case of race
          const { data: storedToken } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", normalizedEmail)
            .maybeSingle();
          if (storedToken) unsubscribeToken = storedToken.token;
        } else {
          // Token used = suppressed, skip
          console.log(`Skipping already-unsubscribed: ${normalizedEmail}`);
          continue;
        }

        const templateData = {
          pet_name, species, breed, color, description,
          last_seen_address, contact_name, contact_phone,
          contact_email, photo_url, partner_name: partner.name,
        };

        // Render template
        const html = await renderAsync(
          React.createElement(template.component, templateData)
        );
        const plainText = await renderAsync(
          React.createElement(template.component, templateData),
          { plainText: true }
        );

        const resolvedSubject =
          typeof template.subject === "function"
            ? template.subject(templateData)
            : template.subject;

        // Log pending
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: "lost-pet-alert",
          recipient_email: normalizedEmail,
          status: "pending",
        });

        // Enqueue directly — no edge function invocation needed
        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: normalizedEmail,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: resolvedSubject,
            html,
            text: plainText,
            purpose: "transactional",
            label: "lost-pet-alert",
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error(`Failed to enqueue for ${normalizedEmail}:`, enqueueError);
          emailsFailed++;
        } else {
          emailsQueued++;
        }
      } catch (err) {
        console.error(`Error processing ${partner.email}:`, err);
        emailsFailed++;
      }
    }

    console.log(
      `Alabama Partner Alert: ${emailsQueued} queued, ${emailsFailed} failed for pet: ${pet_name}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        partners_notified: partnersWithEmail.length,
        emails_queued: emailsQueued,
        emails_failed: emailsFailed,
        pet_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
