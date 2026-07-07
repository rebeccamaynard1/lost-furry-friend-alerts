import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// @ts-ignore - EdgeRuntime is provided by the Supabase edge runtime
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } | undefined;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendWithRetry(
  supabase: ReturnType<typeof createClient>,
  email: string,
  name: string | null,
  maxAttempts = 5,
) {
  let attempt = 0;
  let delay = 900;
  while (true) {
    attempt++;
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "list-inclusion-notice",
          recipientEmail: email,
          idempotencyKey: `list-notice-v1-${email}`,
          templateData: { recipient_name: name || undefined },
        },
      });
      if (!error) return { ok: true as const };
      const msg = String((error as any)?.message || error);
      const isRate = /rate ?limit/i.test(msg) || /429/.test(msg);
      if (!isRate || attempt >= maxAttempts) {
        return { ok: false as const, error: msg };
      }
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      const isRate = /rate ?limit/i.test(msg) || /429/.test(msg);
      if (!isRate || attempt >= maxAttempts) {
        return { ok: false as const, error: msg };
      }
    }
    await sleep(delay + Math.floor(Math.random() * 250));
    delay = Math.min(delay * 2, 8000);
  }
}

async function runBroadcast(
  supabase: ReturnType<typeof createClient>,
  recipients: Array<[string, string | null]>,
) {
  const CONCURRENCY = 3;
  let queued = 0;
  let failed = 0;
  let idx = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (idx < recipients.length) {
      const my = idx++;
      const [email, name] = recipients[my];
      const res = await sendWithRetry(supabase, email, name);
      if (res.ok) queued++;
      else {
        failed++;
        console.error("send failed", email, res.error);
      }
      // gentle pacing between calls per worker
      await sleep(120);
    }
  });
  await Promise.all(workers);
  console.log(`list-notice broadcast complete: queued=${queued} failed=${failed} total=${recipients.length}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdminRow } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdminRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Collect deduped emails + optional names from every list
    const map = new Map<string, string | null>();
    const add = (email?: string | null, name?: string | null) => {
      if (!email) return;
      const e = email.trim().toLowerCase();
      if (!e.includes("@")) return;
      if (!map.has(e)) map.set(e, name?.trim() || null);
    };

    const tables: { t: string; nameCol?: string }[] = [
      { t: "profiles", nameCol: "name" },
      { t: "shelters", nameCol: "name" },
      { t: "alabama_partners", nameCol: "name" },
      { t: "rural_partners", nameCol: "name" },
      { t: "volunteers", nameCol: "name" },
      { t: "sponsors", nameCol: "business_name" },
    ];
    for (const { t, nameCol } of tables) {
      const cols = nameCol ? `email, ${nameCol}` : "email";
      const { data, error } = await supabase.from(t).select(cols).not("email", "is", null);
      if (error) {
        console.error(`select failed for ${t}:`, error.message);
        continue;
      }
      for (const row of (data as any[]) || []) add(row.email, nameCol ? row[nameCol] : null);
    }

    const recipients = Array.from(map.entries());

    // Run the actual sends in the background so we return quickly and
    // don't hit the edge function wall-clock timeout on large lists.
    const work = runBroadcast(supabase, recipients);
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(work);
    } else {
      // Fallback: fire-and-forget
      work.catch((e) => console.error("broadcast error", e));
    }

    return new Response(
      JSON.stringify({
        recipients: recipients.length,
        queued: recipients.length,
        failed: 0,
        skipped: 0,
        background: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
