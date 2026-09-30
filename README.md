# Lost Furry Friend Alerts

Missing-pet alert platform with a directory of Alabama animal-welfare
organizations. Built with Vite, TypeScript, React, shadcn-ui, and Tailwind
CSS, backed by Supabase (Postgres, Auth, Edge Functions).

## Local development

Requires Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd lost-furry-friend-alerts

# Install dependencies
npm i

# Copy .env and fill in your Supabase project's URL/keys if not already set
# (see .env in the repo root)

# Start the dev server
npm run dev
```

## Backend

The Supabase project backing this app lives under `supabase/` (migrations,
edge functions, config). Deploy schema changes with the Supabase CLI or the
Supabase MCP tools:

```sh
supabase db push
supabase functions deploy <function-name>
```

Edge functions that send email (`process-email-queue`,
`handle-email-suppression`, `auth-email-hook`) use
[Resend](https://resend.com) for delivery — see the Supabase project's Edge
Function secrets for the required `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`,
`AUTH_HOOK_SECRET`, and `PREVIEW_API_KEY` values.

## Deployment

Deploy the frontend to any static host that builds a Vite app (Vercel,
Netlify, Cloudflare Pages, etc.) — `npm run build` produces a static
`dist/` folder to serve.
