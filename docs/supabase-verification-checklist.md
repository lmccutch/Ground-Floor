# Phase 1 Supabase verification checklist

Purpose: exercise the Supabase-mode code paths (which were generated but
never run against a live database) on a disposable scratch project before
anything touches production. Nothing here modifies your real project.

## 1. Create or select the scratch project

- Go to https://supabase.com/dashboard → **New project**.
- Name it something unmistakably disposable, e.g. `groundfloor-scratch`.
- Any region/tier is fine; note the database password you set.
- Do **not** reuse the existing production project — the point is a clean
  database you can throw away.

## 2. Apply the existing base migration first

In the scratch project's **SQL Editor**, paste and run the full contents of:

```text
supabase/migrations/202607100001_grround_floor_mvp.sql
```

This creates profiles, companies, campaigns, questions, votes, requests,
notifications, RLS policies, and the `is_admin()` helper. It must run
before the Phase 1 migration, which alters these tables.

## 3. Apply the new Phase 1 migration second

Same SQL Editor, paste and run:

```text
supabase/migrations/202607110001_company_universe_core.sql
```

Watch for errors — this is the first live execution of this file. It adds
`pg_trgm`, the new `companies` columns (with backfills), `securities`,
`company_aliases`, the replacement RLS policy on `companies`, and the
`search_companies` / `start_campaign` functions. If anything fails here,
stop and report the exact error before proceeding.

## 4. Generate the bootstrap SQL

Locally:

```bash
npm run bootstrap:generate
```

This (re)writes `supabase/seed/<date>_company_directory_bootstrap.sql`
from `src/data/companyDirectory.ts`. The committed file is already current
(225 companies), so this step just confirms reproducibility.

## 5. Apply the bootstrap SQL

Paste the generated file's contents into the SQL Editor and run it.
Expected result: 225 companies, ~230 securities, and a handful of aliases.
Run it a **second time** to confirm idempotency — it should succeed with
no duplicate-key errors and no row-count growth (verify in step 9).

## 6. Configure environment variables

Locally, create/overwrite `.env.local` (temporarily — keep a copy of your
real one) with the scratch project's values from **Project Settings → API**:

```env
VITE_SUPABASE_URL=https://<scratch-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<scratch anon key>
VITE_SITE_URL=http://localhost:5173
```

Leave `VITE_POSTHOG_KEY` unset so test activity doesn't hit analytics.
Also set **Authentication → URL Configuration → Site URL** in the scratch
dashboard to `http://localhost:5173` so magic links redirect locally.

## 7. Run GroundFloor in Supabase mode

```bash
npm run dev
```

Confirm the app is in Supabase mode: the "Demo data" pill and the sidebar
"Demo mode" note must **not** appear.

## 8. User journeys to test manually

1. **Directory browse**: Discover shows the 225 bootstrapped companies;
   sector/exchange/market-cap filters and "Load more" work.
2. **Search**: home search for `AAPL` (exact ticker first), `Microsoft`
   (name), `VIAC` (former ticker → Paramount Global), `BRK-B` and `BRK/B`
   (both resolve like `BRK.A`'s sibling class).
3. **Ticker redirect**: visit `/company/FB` → redirected to
   `/company/META`; `/company/GOOG` → `/company/GOOGL`.
4. **Slug route**: from a company page, note the slug format and open
   `/companies/<slug>` directly.
5. **Empty state**: `/company/DDOG` shows "No shareholder campaign has
   started for this company." with both actions (no company has a
   campaign yet in a fresh scratch DB — the bootstrap creates none).
6. **Auth**: sign in via magic link (real inbox required), complete the
   profile step.
7. **Start a campaign**, then **ask a question**, **vote** on it, and
   **support** + **follow** the campaign.
8. **First-question path**: on a *different* company, use "Ask the first
   question" and confirm one campaign + one question result.
9. **Duplicate-request match**: suggest `AAPL` via Request a company →
   "We found this company." panel, no new request row.
10. **New request**: suggest a fake ticker → request saved.
11. **Dashboard**: supported/followed companies and your questions appear.
12. **Refresh** the campaign page — all state persists.
13. Repeat search + one company page at a mobile viewport.

## 9. Database records to inspect afterward

In the SQL Editor:

```sql
select count(*) from public.companies;          -- expect 225 (+ none from re-run)
select count(*) from public.securities;         -- expect ~230; re-run must not grow it
select count(*) from public.company_aliases;    -- expect a handful; stable across re-runs
select count(*) from public.campaigns;          -- exactly the campaigns you started by hand
select company_id, count(*) from public.campaigns group by company_id having count(*) > 1;  -- must be empty
select * from public.questions;                 -- only your test questions
select * from public.question_votes;            -- only your test votes
select * from public.campaign_supporters;       -- only your test support rows
select * from public.company_requests;          -- only the fake-ticker request, not AAPL
select * from public.search_companies('VIAC', 5);   -- Paramount Global ranked first
select * from public.search_companies('AAPL', 5);   -- Apple ranked first
```

Also verify RLS from the client side: while signed **out**, the app can
still browse/search but cannot support, question, or vote.

## 10. Roll back / discard

- Restore your real `.env.local`.
- In the scratch project: **Project Settings → General → Delete project**.
  Nothing from the scratch run is referenced anywhere else — deleting the
  project removes all test data.
- If you'd rather keep the project and just reset it, re-running both
  migrations requires a fresh database; easier to delete and recreate.
