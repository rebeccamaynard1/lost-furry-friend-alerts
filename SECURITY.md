# Security Policy & Report — Lost Furry Friend Alerts

_Last reviewed: 2026-07-04_

Lost Furry Friend Alerts is a public pet-recovery network. Anyone can browse
lost/found listings, sightings, shelters, sponsors, and directory pages
(volunteers, rural partners, Alabama partners). Owners manage only their own
pets, sightings, messages, and profile. Admins moderate shelters and sponsors.

## Reporting a vulnerability

Please email **security@lostfurryfriendalerts.com** with:

- A description of the issue
- Reproduction steps or proof-of-concept
- Impact assessment (data exposed, accounts affected, etc.)

We aim to acknowledge within **48 hours** and issue a fix or mitigation within
**14 days** for high/critical issues. Please do not open public issues for
security reports and do not perform testing that would degrade service or
access data belonging to other users.

## Security posture

| Area                   | Control                                                      |
| ---------------------- | ------------------------------------------------------------ |
| Transport              | HTTPS enforced; HSTS with preload on published domains       |
| Auth                   | Supabase Auth (email/password + Google); HIBP check enabled  |
| Session                | JWT in `localStorage` (Supabase JS default); auto-refresh    |
| Authorization          | Row Level Security on **all** public tables; RBAC via `has_role` |
| Storage                | `pet-photos` bucket public read; user-scoped writes          |
| Secrets                | Managed by Lovable Cloud; never committed to the repo        |
| Dependencies           | `bun audit --prod --audit-level=high` in CI                  |
| Secret scanning        | gitleaks in CI                                               |
| Static headers         | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |

## Content Security Policy

Enforced via `<meta http-equiv="Content-Security-Policy">` (works on all
static hosts) and `public/_headers` (for hosts that read Netlify-style
header files). Highlights:

- `default-src 'self'`
- `script-src` allows only `'self'`, Stripe, and the Lovable badge on published deploys
- `connect-src` allows `'self'`, Supabase (`https + wss`), Stripe, and Nominatim geocoding
- `img-src` allows `'self'`, `data:`, `blob:`, Supabase storage, OpenStreetMap tiles, Lovable asset CDN
- `frame-src` restricted to Stripe checkout
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
- `upgrade-insecure-requests`

`style-src` includes `'unsafe-inline'` because Tailwind/shadcn ship inline
styles. `script-src` does **not** allow `'unsafe-inline'` or `'unsafe-eval'`.

## RLS audit — 2026-07-04

All 19 tables in `public` have RLS enabled and at least one policy. Sensitive
columns (email/phone) on directory tables are read via `SECURITY DEFINER`
functions that project only safe columns, never by anonymous `SELECT *`.

| Table                     | RLS | Public read | Auth read           | Write scope                     | Notes |
| ------------------------- | --- | ----------- | ------------------- | ------------------------------- | ----- |
| `profiles`                | ✅   | ❌           | Own row + display names via RPC | `user_id = auth.uid()` | Names/photos exposed via `get_profile_display_name(s)` |
| `user_roles`              | ✅   | ❌           | Own roles + admins  | Admin only                      | Roles stored separately from `profiles` (prevents privilege-escalation) |
| `lost_pets`               | ✅   | ✅ (active)  | ✅                   | Owner only                      | Contact fields shown only to signed-in users on the UI |
| `found_pets`              | ✅   | ✅ (active)  | ✅                   | Owner only; shelter-id write locked | Contact protected via app-layer + owner update policy |
| `lost_pet_contacts`       | ✅   | ❌           | Owner + verified helpers | Owner only                | Contact info gated behind lookup RPC |
| `sightings`               | ✅   | ✅           | ✅                   | Owner only                      | Location only, no PII |
| `messages`                | ✅   | ❌           | Sender or recipient | Sender only                     | |
| `notifications`           | ✅   | ❌           | Own                  | Own (mark-read)                 | |
| `alert_boosts`            | ✅   | ✅ (active)  | ✅                   | Server-side (Stripe webhook)    | |
| `donations`               | ✅   | ❌           | Own                  | Server-side (Stripe webhook)    | |
| `shelters`                | ✅   | ✅ approved  | ✅                   | Owner + admin approval          | `approved` protected by `prevent_self_approval` trigger |
| `sponsors`                | ✅   | ✅ approved  | ✅                   | Owner + admin approval          | Same |
| `alabama_partners`        | ✅   | via RPC only | via RPC only        | Admin only                      | `get_public_alabama_partners` returns safe columns; email/phone hidden |
| `rural_partners`          | ✅   | via RPC only | Own row              | Owner only                      | `get_public_rural_partners` returns safe columns |
| `volunteers`              | ✅   | via RPC only | Own row              | Owner only                      | `get_public_volunteers` returns safe columns |
| `email_send_log`          | ✅   | ❌           | Admin                | Service role only               | |
| `email_send_state`        | ✅   | ❌           | Service role         | Service role only               | |
| `email_unsubscribe_tokens`| ✅   | ❌           | Service role         | Service role + edge function    | |
| `suppressed_emails`       | ✅   | ❌           | Service role         | Service role only               | |

### Intentional `SECURITY DEFINER` functions

Flagged by the linter but required:

- `has_role` — RBAC check; must be DEFINER to avoid recursion on `user_roles`.
- `get_profile_display_name(s)` — exposes only `name` + `profile_photo`.
- `get_public_alabama_partners`, `get_public_rural_partners`, `get_public_volunteers` —
  return a fixed safe projection (no email/phone).
- `handle_new_user`, `prevent_self_approval`, `update_updated_at_column` — triggers.
- `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`,
  `email_queue_wake`, `email_queue_dispatch` — email queue plumbing.

All set `search_path = public` (or `''`) explicitly.

## CI

`.github/workflows/security.yml` runs on every push, pull request, and
weekly on Monday 06:00 UTC:

1. `bun audit --prod --audit-level=high` — fails on high/critical CVEs.
2. `bun run lint` + `tsc --noEmit`.
3. `gitleaks` — blocks accidentally committed secrets.

## Accepted risks

- **Public read on active `lost_pets` / `found_pets` / `sightings` /
  approved `shelters` / approved `sponsors`.** The whole point of the app is
  that strangers can help find pets from shared links, printed flyers, and
  QR codes — this is intentional.
- **Public storage bucket `pet-photos`.** URLs are unguessable and images are
  meant to be shared. Writes are restricted to the uploading user.
- **`SECURITY DEFINER` public directory functions.** See the list above.
