// Generates a printable flyer in a new window and triggers Save as PDF.
// Works on all browsers via the native print dialog (user picks "Save as PDF").

interface FlyerData {
  isLost: boolean;
  petName: string;
  species?: string;
  breed?: string;
  color?: string;
  age?: string;
  gender?: string;
  description?: string;
  address?: string;
  date?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  photoUrl?: string;
  pageUrl: string;
}

export function openFlyer(d: FlyerData) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(d.pageUrl)}`;
  const accent = d.isLost ? "#dc3545" : "#16a34a";
  const headline = d.isLost ? "🚨 LOST PET 🚨" : "✅ FOUND PET";
  const subhead = d.isLost
    ? "Please help us bring them home"
    : "Help us find their family";
  const dateLabel = d.isLost ? "Date Lost" : "Date Found";
  const locationLabel = d.isLost ? "Last Seen" : "Found Near";

  const rows = [
    ["Species", d.species],
    ["Breed", d.breed],
    ["Color", d.color],
    ["Age", d.age],
    ["Gender", d.gender],
    [locationLabel, d.address],
    [dateLabel, d.date],
  ]
    .filter(([, v]) => !!v)
    .map(
      ([k, v]) =>
        `<div class="row"><span class="k">${k}</span><span class="v">${escapeHtml(String(v))}</span></div>`
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(d.petName)} — Flyer</title>
<style>
  @page { size: letter; margin: 0.4in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Quicksand', system-ui, -apple-system, sans-serif; color: #222; }
  .flyer { max-width: 7.5in; margin: 0 auto; padding: 16px; }
  .header { background: ${accent}; color: white; text-align: center; padding: 18px; border-radius: 12px; margin-bottom: 16px; }
  .header h1 { font-family: 'Nunito', system-ui, sans-serif; font-size: 34px; font-weight: 800; letter-spacing: 1px; }
  .header p { font-size: 13px; opacity: .95; margin-top: 4px; }
  .photo { text-align: center; margin-bottom: 14px; }
  .photo img { max-width: 320px; max-height: 320px; object-fit: cover; border-radius: 12px; border: 4px solid ${accent}; }
  .name { font-family: 'Nunito', system-ui, sans-serif; font-size: 30px; font-weight: 800; text-align: center; margin: 8px 0 14px; }
  .details { background: #f6f7f9; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .row:last-child { border-bottom: 0; }
  .k { color: #6b7280; font-weight: 600; }
  .v { color: #111827; font-weight: 700; text-align: right; max-width: 60%; }
  .desc { background: #fff8e1; border-left: 4px solid #f5b301; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; }
  .contact { background: #e8f5e9; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 12px; }
  .contact h3 { font-family: 'Nunito', sans-serif; font-size: 16px; color: #14532d; margin-bottom: 6px; }
  .contact p { font-size: 18px; font-weight: 700; color: #14532d; margin: 2px 0; }
  .qr-wrap { display: flex; align-items: center; gap: 14px; background: white; border: 2px dashed ${accent}; border-radius: 10px; padding: 12px; }
  .qr-wrap img { width: 130px; height: 130px; }
  .qr-wrap .label { font-size: 13px; color: #374151; }
  .qr-wrap .label strong { display: block; font-family: 'Nunito', sans-serif; font-size: 16px; color: #111827; margin-bottom: 4px; }
  .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 12px; }
  .actions { text-align: center; padding: 16px; }
  .actions button { background: ${accent}; color: white; border: 0; padding: 10px 22px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
  @media print { .actions { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body>
<div class="actions"><button onclick="window.print()">Save as PDF / Print</button></div>
<div class="flyer">
  <div class="header"><h1>${headline}</h1><p>${subhead}</p></div>
  ${d.photoUrl ? `<div class="photo"><img src="${escapeAttr(d.photoUrl)}" crossorigin="anonymous" alt=""></div>` : ""}
  <div class="name">${escapeHtml(d.petName)}</div>
  ${rows ? `<div class="details">${rows}</div>` : ""}
  ${d.description ? `<div class="desc"><strong>Notes:</strong> ${escapeHtml(d.description)}</div>` : ""}
  <div class="contact">
    <h3>📞 If you have any information, please contact:</h3>
    ${d.contactName ? `<p>${escapeHtml(d.contactName)}</p>` : ""}
    ${d.contactPhone ? `<p>${escapeHtml(d.contactPhone)}</p>` : ""}
    ${d.contactEmail ? `<p style="font-size:14px">${escapeHtml(d.contactEmail)}</p>` : ""}
  </div>
  <div class="qr-wrap">
    <img src="${qrUrl}" alt="QR code">
    <div class="label"><strong>Scan for full details</strong>Photos, updates, and a way to message directly. Share this flyer widely!</div>
  </div>
  <div class="footer">Lost Furry Friend Alerts — lostfurryfriendalerts.com</div>
</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 600));</script>
</body></html>`;

  const w = window.open("", "_blank", "width=850,height=1100");
  if (!w) {
    alert("Please allow pop-ups to download the flyer.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string) {
  return escapeHtml(s);
}
