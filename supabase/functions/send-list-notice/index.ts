import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      { t: "sponsors", nameCol: "name" },
    ];
    for (const { t, nameCol } of tables) {
      const cols = nameCol ? `email, ${nameCol}` : "email";
      const { data } = await supabase.from(t).select(cols).not("email", "is", null);
      for (const row of (data as any[]) || []) add(row.email, nameCol ? row[nameCol] : null);
    }

    let queued = 0;
    let failed = 0;
    let skipped = 0;

    for (const [email, name] of map.entries()) {
      try {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "list-inclusion-notice",
            recipientEmail: email,
            idempotencyKey: `list-notice-v1-${email}`,
            templateData: { recipient_name: name || undefined },
          },
        });
        if (error) { failed++; console.error("send failed", email, error); }
        else queued++;
      } catch (err) {
        failed++;
        console.error("invoke error", email, err);
      }
    }

    return new Response(JSON.stringify({ recipients: map.size, queued, failed, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
