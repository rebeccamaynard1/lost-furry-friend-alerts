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
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    if (!template) throw new Error("lost-pet-alert template not found");

    // Pre-render the template ONCE with a placeholder partner name.
    // The partner_name appears in the greeting only — we'll do a simple string replace per partner.
    const baseData = {
      pet_name, species, breed, color, description,
      last_seen_address, contact_name, contact_phone,
      contact_email, photo_url, partner_name: "{{PARTNER_NAME}}",
    };

    const baseHtml = await renderAsync(React.createElement(template.component, baseData));
    const basePlainText = await renderAsync(
      React.createElement(template.component, baseData),
      { plainText: true }
    );
    const resolvedSubject =
      typeof template.subject === "function"
        ? template.subject(baseData)
        : template.subject;

    // Batch: get all suppressed emails at once
    const allEmails = partnersWithEmail.map((p: any) => p.email.trim().toLowerCase());
    const { data: suppressedRows } = await supabase
      .from("suppressed_emails")
      .select("email")
      .in("email", allEmails);
    const suppressedSet = new Set((suppressedRows || []).map((r: any) => r.email));

    // Get existing unsubscribe tokens in bulk
    const { data: existingTokens } = await supabase
      .from("email_unsubscribe_tokens")
      .select("email, token, used_at")
      .in("email", allEmails);
    const tokenMap = new Map((existingTokens || []).map((t: any) => [t.email, t]));

    let emailsQueued = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;

    // Process in batches of 50 for token creation
    const BATCH = 50;
    const needsToken: { email: string; token: string }[] = [];

    for (const partner of partnersWithEmail) {
      const email = partner.email.trim().toLowerCase();
      if (suppressedSet.has(email)) { emailsSkipped++; continue; }

      const existing = tokenMap.get(email);
      if (existing?.used_at) { emailsSkipped++; continue; }

      if (!existing) {
        const token = generateToken();
        needsToken.push({ email, token });
        tokenMap.set(email, { email, token, used_at: null });
      }
    }

    // Bulk upsert tokens
    if (needsToken.length > 0) {
      for (let i = 0; i < needsToken.length; i += BATCH) {
        const batch = needsToken.slice(i, i + BATCH);
        await supabase
          .from("email_unsubscribe_tokens")
          .upsert(batch, { onConflict: "email", ignoreDuplicates: true });
      }
      // Re-read tokens we just created to handle races
      const newEmails = needsToken.map((t) => t.email);
      const { data: freshTokens } = await supabase
        .from("email_unsubscribe_tokens")
        .select("email, token")
        .in("email", newEmails);
      for (const t of freshTokens || []) {
        const existing = tokenMap.get(t.email);
        if (existing) existing.token = t.token;
      }
    }

    // Now enqueue all emails
    const pendingLogs: any[] = [];
    const enqueuePayloads: { email: string; messageId: string; partnerId: string; partnerName: string; token: string }[] = [];

    for (const partner of partnersWithEmail) {
      const email = partner.email.trim().toLowerCase();
      if (suppressedSet.has(email)) continue;

      const tokenEntry = tokenMap.get(email);
      if (!tokenEntry || tokenEntry.used_at) continue;

      const messageId = crypto.randomUUID();
      pendingLogs.push({
        message_id: messageId,
        template_name: "lost-pet-alert",
        recipient_email: email,
        status: "pending",
      });
      enqueuePayloads.push({
        email,
        messageId,
        partnerId: partner.id,
        partnerName: partner.name,
        token: tokenEntry.token,
      });
    }

    // Bulk insert pending logs
    if (pendingLogs.length > 0) {
      for (let i = 0; i < pendingLogs.length; i += BATCH) {
        await supabase.from("email_send_log").insert(pendingLogs.slice(i, i + BATCH));
      }
    }

    // Enqueue emails one by one (RPC doesn't support batch, but no rate limit)
    for (const item of enqueuePayloads) {
      try {
        const html = baseHtml.replaceAll("{{PARTNER_NAME}}", item.partnerName);
        const text = basePlainText.replaceAll("{{PARTNER_NAME}}", item.partnerName);

        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: item.messageId,
            to: item.email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: resolvedSubject,
            html,
            text,
            purpose: "transactional",
            label: "lost-pet-alert",
            idempotency_key: `alabama-alert-${pet_id || pet_name}-${item.partnerId}`,
            unsubscribe_token: item.token,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error(`Enqueue failed for ${item.email}:`, enqueueError);
          emailsFailed++;
        } else {
          emailsQueued++;
        }
      } catch (err) {
        console.error(`Error enqueuing ${item.email}:`, err);
        emailsFailed++;
      }
    }

    console.log(`Alabama Alert: ${emailsQueued} queued, ${emailsFailed} failed, ${emailsSkipped} skipped for ${pet_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        partners_total: partnersWithEmail.length,
        emails_queued: emailsQueued,
        emails_failed: emailsFailed,
        emails_skipped: emailsSkipped,
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
