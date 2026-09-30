# Lost Furry Friend Alerts (v2)

Fresh rebuild — Vite + React + TypeScript + Tailwind, backed by a new
Supabase project. No Lovable code, packages, or config anywhere in this
repo.

## Backend

Supabase project `lffa-v2` (`hccaosezouxjuntxoict`), seeded from the
salvage kit pulled from the old app:
- Full schema (19 tables), RLS policies, and security-definer functions
- The 221-organization Alabama directory, already loaded

## Local development

```sh
npm install
cp .env.example .env   # already pointed at the new project
npm run dev
```

## Status

This is the first working slice: the org directory page, reading live
from Supabase via `get_public_alabama_partners()`. Everything else from
the old app (lost/found pet reports, sightings, messaging, shelters,
sponsors, volunteers, Stripe donations/boosts) has its schema and RLS
already in place in the backend — the frontend pages for those haven't
been rebuilt yet.
