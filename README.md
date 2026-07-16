# Open Floor MVP

Open Floor is where shareholders decide what management answers next: individual shareholders combine their questions for a public company into one ranked, public request for a management interview. Management participation is voluntary and campaign metrics are shown only when backed by stored data.

## Run locally

```bash
npm install
npm run dev
```

By default in development (when `VITE_DATA_MODE` is unset), the app runs in `demo` mode using the curated local company directory and browser storage — even if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are also present in `.env.local`. Data mode is always chosen explicitly by `VITE_DATA_MODE`, never inferred from whether Supabase credentials happen to exist.

## Data modes (`VITE_DATA_MODE`)

Set in `.env.local` (see `.env.example`). Supported values:

- **`demo`** (default in development) — Uses the curated ~225-company directory in `src/data/companyDirectory.ts`. Every campaign, supporter, follower, question, vote, and notification starts at zero; nothing is fabricated. Interactions you create locally (starting a campaign, supporting it, submitting/voting on questions) persist in this browser's `localStorage` under the `open-floor-mvp` key (data stored under the pre-rebrand `groundfloor-mvp`/`grround-floor-mvp` keys is migrated forward automatically).
- **`supabase`** — Uses only the Supabase database. Requires both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the app fails with a clear configuration error at startup if either is missing. Once running, a failed Supabase query throws and is shown as a load error — it never silently falls back to demo data. In local development, that error includes a hint that a migration or the company-directory bootstrap may not be applied yet.
- **`test`** — Same demo-style local behavior as `demo` mode (no backend calls, deterministic curated directory), but stored under a separate `open-floor-mvp-test` localStorage key so automated/test runs never read or pollute a developer's real demo-mode data.

**Production builds require an explicit `VITE_DATA_MODE`.** There is no default outside of development — an unset or invalid value fails clearly at startup rather than silently choosing a mode.

## Production configuration

Copy `.env.example` to `.env.local` and provide:

- `VITE_DATA_MODE` — `demo`, `supabase`, or `test` (see above).
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for authentication and persistence (required when `VITE_DATA_MODE=supabase`).
- `VITE_POSTHOG_KEY` and optionally `VITE_POSTHOG_HOST` for product analytics.
- `VITE_SITE_URL` for magic-link redirects.

Apply the migrations in `supabase/migrations/` (in filename order) to a Supabase project before inviting real users:

1. `202607100001_grround_floor_mvp.sql` — profiles, campaigns, questions, votes, requests, notifications, attribution, referrals, and RLS policies.
2. `202607110001_company_universe_core.sql` — extends `companies` and adds `securities`/`company_aliases`, real search (`search_companies`), and on-demand campaign creation (`start_campaign`). See `docs/company-universe.md`.
3. `202607150001_retail_popularity.sql` — adds the `company_retail_popularity` table plus the public-safe `public_retail_popularity` view for the "Popular with Retail Investors" Discover beta. See `docs/popular-with-retail.md`.

(Apply the remaining `supabase/migrations/*.sql` in filename order too — the list above highlights the ones with their own docs.)

These migrations were written and reviewed carefully but have not been applied to or tested against a live Supabase project in this environment — verify them against a scratch project before using them in production.

Populate the company directory by running `npm run bootstrap:generate`, which reads `src/data/companyDirectory.ts` and writes an idempotent SQL file to `supabase/seed/`. Apply that file to your Supabase project yourself (CLI, dashboard SQL editor, or `psql`) — it is never run automatically, and it only ever creates companies/securities/aliases, never campaigns, questions, or users.

Populate the retail-popularity ranking by running `npm run retail:import`, which reads the curated CSV (`open_floor_popular_retail_stocks_fintel_2026-07-15.csv`) and writes the generated demo dataset (`src/data/retailPopularity.ts`) plus an idempotent SQL seed to `supabase/seed/`. Apply that seed as an admin/service role — the public app only ever reads featured rankings, and never the underlying panel figures. See `docs/popular-with-retail.md`.

Never ship service-role or provider API credentials to the browser.

## Analytics

Two independent layers, kept deliberately separate:

- **Vercel Web Analytics** — aggregate website traffic only (page views, visitors, routes, referrers, devices/browsers). Mounted once at the app root via `<Analytics />` from `@vercel/analytics/react`; it needs **no** application secret or env var. Enable it manually in the Vercel dashboard (Project → Analytics → Web Analytics); data appears after a deployment and real visits. A `beforeSend` handler (`src/lib/analyticsUrl.ts`) strips query strings and URL fragments and suppresses auth/recovery URLs, so tokens are never sent. **No custom product events are sent to Vercel.**
- **PostHog** — explicit product-interaction events only (campaign support/start, questions, voting, search, company clicks, popular-retail interactions, auth-state context), sent through `track()` in `src/lib/analytics.ts`. It loads lazily and only when `VITE_POSTHOG_KEY` (the public `phc_…` project key) is set — otherwise every event safely no-ops. Autocapture, automatic page views/leaves, and session recording are all disabled. `identify()` uses the **pseudonymous** Supabase user ID as the distinct id and sends no person properties (never email/name); `resetAnalytics()` clears the identity on logout.

Product events go to PostHog only; page/traffic analytics go to Vercel only — the two pipelines never duplicate each other.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test        # Vitest — always runs in demo mode, no credentials needed
npm run test:e2e    # Playwright — always runs in demo mode, no credentials needed
npm run build
```

Live security verification against a scratch/staging Supabase project
(requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`):

```bash
npm run verify:rpc-security    # start_campaign privilege regression
npm run verify:core-security   # question edit/delete, feedback, notifications, reporting RLS
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
- `src/components/` — the campaign page, dashboard, request form, auth modal, search, and shared UI primitives.
- `src/context/` — the auth/profile context (`useMvp`).
- `src/lib/` — Supabase client, API layer (Supabase with a localStorage demo fallback), `dataMode.ts` (the single place `VITE_DATA_MODE` is resolved and validated), analytics, helpers.
- `src/data/companyDirectory.ts` — the curated Phase 1 company/security/alias directory (see `docs/company-universe.md`); the single source of truth for demo mode, tests, and the bootstrap generator.
- `scripts/generate-company-bootstrap.ts` — generates the Supabase bootstrap SQL from `companyDirectory.ts` (`npm run bootstrap:generate`).
- `scripts/import-retail-popularity.ts` — imports the curated retail CSV into `src/data/retailPopularity.ts` + a SQL seed (`npm run retail:import`); matching logic lives in `src/lib/retailPopularityImport.ts`. See `docs/popular-with-retail.md`.
- `src/index.css` — design tokens and base styles; `src/App.css` — component and page styles.
- `supabase/` — schema migrations and seed data (fictional community-activity seed for local dev, plus the generated company-directory bootstrap).
- `e2e/` — Playwright end-to-end tests (always demo mode).
- `docs/company-universe.md` — architecture, scope, and what is/isn't built for the company directory.
- `docs/core-user-experience.md` — campaign lifecycle, timeline/milestone rules, question permissions, feedback, notifications, Discover ranking, and the analytics event list.
- `docs/trust-and-transparency.md` — the public trust/legal pages (About, FAQ, Transparency, Privacy, Terms, …), reporting categories, MNPI protections, contact method, and the legal-review gap list. The Privacy Policy, Terms, and Investment Disclaimer are drafts requiring professional legal review before commercial launch.
- Homepage structure, positioning, real-data/empty-state rules, and analytics events are documented in `docs/core-user-experience.md`.

## Company directory (Phase 1)

Open Floor ships with a curated launch directory of ~225 recognizable U.S.-listed companies — not a comprehensive, provider-verified screen of every eligible company. See `docs/company-universe.md` for the full architecture, what's built, and what's explicitly deferred to a future phase.
