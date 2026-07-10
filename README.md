# Grround Floor MVP

Grround Floor is a shareholder campaign platform: people can discover companies, support an interview campaign, submit and vote on management questions, and follow campaign updates. Management participation is voluntary and campaign metrics are shown only when backed by stored data.

## Run locally

```bash
npm install
npm run dev
```

Without Supabase variables, the app runs in a local demo mode using browser storage. This mode is useful for UI review only and is not a production data store.

## Production configuration

Copy `.env.example` to `.env.local` and provide:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for authentication and persistence.
- `VITE_POSTHOG_KEY` and optionally `VITE_POSTHOG_HOST` for product analytics.
- `VITE_SITE_URL` for magic-link redirects.

Apply `supabase/migrations/202607100001_grround_floor_mvp.sql` to a Supabase project before inviting real users. The migration creates profiles, companies, campaigns, questions, votes, requests, notifications, attribution, referrals, and RLS policies. Seed public companies and campaigns through the Supabase dashboard or a server-side seed script; never ship service-role credentials to the browser.

## Quality checks

```bash
npm run lint
npm run build
```

## Product safeguards

- Ownership is self-reported; position ranges are private.
- Auth is requested only for protected actions.
- Questions are limited to 500 characters and are public unless submitted anonymously.
- The product does not imply management participation until an admin records a real outreach event.
- Public campaign totals come from aggregate database views in production.

## Deployment

Build with `npm run build` and deploy the `dist/` directory to a static host configured to fall back to `index.html` for React Router paths. Configure Supabase email redirects for the deployed origin and keep the anon key restricted by the database RLS policies.

## Legal launch checklist

Before accepting production users, publish Terms of Use, Privacy Policy, community/content rules, and a contact address. Add an abuse-report workflow and an admin/moderator review process before enabling open comments or management outreach.

## Project structure

- `src/pages/` — top-level routed pages (Home, Discover, NotFound).
- `src/components/` — the campaign page, dashboard, request form, auth modal, and shared UI primitives.
- `src/context/` — the auth/profile context (`useMvp`).
- `src/lib/` — Supabase client, API layer (Supabase with a localStorage demo fallback), analytics, helpers.
- `src/index.css` — design tokens and base styles; `src/App.css` — component and page styles.
- `supabase/` — schema migration and fictional seed data.
