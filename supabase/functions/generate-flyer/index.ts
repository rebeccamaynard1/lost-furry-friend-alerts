import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pet_name, species, breed, color, description, last_seen_address, date_lost, contact_name, contact_phone, photo_url, pet_id } = await req.json();

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://furbabieslostandfound.com/pet/${pet_id || "unknown"}`)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Quicksand:wght@500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Quicksand', sans-serif; background: white; }
  .flyer { width: 612px; min-height: 792px; padding: 30px; background: white; }
  .header { background: linear-gradient(135deg, #dc3545, #ff6b6b); color: white; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
  .header h1 { font-family: 'Nunito', sans-serif; font-size: 36px; font-weight: 800; margin-bottom: 4px; }
  .header p { font-size: 14px; opacity: 0.9; }
  .photo-section { text-align: center; margin-bottom: 20px; }
  .photo-section img { max-width: 280px; max-height: 280px; object-fit: cover; border-radius: 12px; border: 4px solid #dc3545; }
  .pet-name { font-family: 'Nunito', sans-serif; font-size: 28px; font-weight: 800; text-align: center; color: #333; margin: 12px 0; }
  .details { background: #f8f9fa; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { font-weight: 600; color: #666; }
  .detail-value { font-weight: 600; color: #333; }
  .description { background: #fff3cd; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 13px; color: #856404; }
  .contact { background: #d4edda; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 16px; }
  .contact h3 { font-family: 'Nunito', sans-serif; font-size: 18px; color: #155724; margin-bottom: 8px; }
  .contact p { font-size: 16px; font-weight: 600; color: #155724; }
  .qr-section { text-align: center; margin-top: 12px; }
  .qr-section p { font-size: 11px; color: #999; margin-top: 6px; }
  .footer { text-align: center; font-size: 11px; color: #999; margin-top: 16px; }
</style>
</head>
<body>
<div class="flyer">
  <div class="header">
    <h1>🚨 LOST PET 🚨</h1>
    <p>Please help us find our beloved family member</p>
  </div>
  ${photo_url ? `<div class="photo-section"><img src="${photo_url}" alt="${pet_name}"></div>` : ""}
  <div class="pet-name">${pet_name || "Unknown"}</div>
  <div class="details">
    <div class="detail-row"><span class="detail-label">Species</span><span class="detail-value">${species || "Unknown"}</span></div>
    ${breed ? `<div class="detail-row"><span class="detail-label">Breed</span><span class="detail-value">${breed}</span></div>` : ""}
    <div class="detail-row"><span class="detail-label">Color</span><span class="detail-value">${color || "Unknown"}</span></div>
    <div class="detail-row"><span class="detail-label">Last Seen</span><span class="detail-value">${last_seen_address || "Unknown"}</span></div>
    <div class="detail-row"><span class="detail-label">Date Lost</span><span class="detail-value">${date_lost || "Unknown"}</span></div>
  </div>
  ${description ? `<div class="description"><strong>Description:</strong> ${description}</div>` : ""}
  <div class="contact">
    <h3>📞 If Found, Please Contact</h3>
    <p>${contact_name || ""}</p>
    <p>${contact_phone || ""}</p>
  </div>
  <div class="qr-section">
    <img src="${qrUrl}" alt="QR Code" width="100" height="100">
    <p>Scan to view full report online</p>
  </div>
  <div class="footer">Lost Furry Friend Alerts — lostfurryfriend.com</div>
</div>
</body>
</html>`;

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
