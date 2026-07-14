# Company universe (Phase 1)

This document describes what actually exists today. GroundFloor's company
directory is currently a **curated launch directory of U.S.-listed public
companies** — a hand-picked, hand-verified set of roughly 225 recognizable
companies. It is **not** a comprehensive or exhaustive screen of every
U.S.-listed operating company above any market-cap threshold, and it makes
no claim of recent, provider-verified eligibility. That comprehensive
version is a documented-but-unbuilt Phase 2 (see below).

## Architecture

### Company vs. security

The operating company and its tradable securities are modeled separately,
matching the pattern used by real market-data providers:

- **`companies`** — the operating company. Extended in this phase with
  `cik`, `legal_name`, `display_name`, `slug`, `country_code`,
  `headquarters_country`, `latest_market_cap` (+ currency/as-of, unused
  until a live sync exists), `is_operating_company`,
  `is_directory_eligible`, `is_discoverable`, `eligibility_reason`,
  `ineligibility_reason`, `primary_security_id`, `metadata_source`. The
  legacy `ticker`, `exchange`, `is_public`, `market_cap_category` columns
  are kept — nothing was dropped.
- **`securities`** — one row per ticker/exchange combination. A company can
  have more than one (dual-class shares, ADRs). Exactly one is
  `is_primary` and is what routes and cards display.
- **`company_aliases`** — former company names, former tickers, brand
  names, and abbreviations, used for search and ticker redirects.

A user or campaign is always attached to `company_id`, never to a ticker
string — this is how a ticker change or a second share class never breaks
an existing campaign, question thread, or shared link.

### Provider abstraction

**Not built in Phase 1.** No SEC or FMP client code exists in this
repository. The `companies`/`securities`/`company_aliases` schema was
designed so that a future provider integration can populate it without
changing the app's data-access layer (`src/lib/api.ts`), search, routing,
or RLS — but no such integration exists yet.

### Curated directory data

`src/data/companyDirectory.ts` is the **single source of truth** for
company/security/alias facts in this phase. It is imported by:

- demo mode (`src/lib/api.ts`, when no Supabase project is configured)
- Vitest unit tests
- Playwright e2e tests
- `scripts/generate-company-bootstrap.ts` (below)

There is no second, separately maintained company list anywhere in the app.

The dataset deliberately includes: large- and mid-cap companies across
technology, financial services, energy, mining, industrials, consumer,
healthcare, telecommunications, and real estate; several Canadian and other
non-U.S. issuers listed on U.S. exchanges; several dual-class companies
(e.g. Alphabet GOOGL/GOOG, Berkshire Hathaway BRK.A/BRK.B); several ADRs;
several former-ticker aliases (e.g. Meta Platforms' former ticker `FB`,
Paramount Global's former ticker `VIAC`). No company ships with a campaign:
every campaign, supporter, follower, question, and vote starts at zero in
every mode, so the empty-campaign state is the default and nothing is
fabricated.

No exact market-capitalization figures are stored or displayed. The
existing `market_cap_category` column uses broad, static bands
(`$300M-$1B` … `Over $100B`) — never a precise number, and never presented
as recently verified.

### Supabase bootstrap

`npm run bootstrap:generate` runs `scripts/generate-company-bootstrap.ts`,
which reads `companyDirectory.ts` and writes
`supabase/seed/<date>_company_directory_bootstrap.sql` — plain SQL that
upserts `companies`, `securities`, and `company_aliases` and nothing else
(no campaigns, questions, votes, or users are ever created by this script).
It is:

- **idempotent** — safe to re-run; every statement is `insert ... on
  conflict ... do update`
- **never run automatically** — not in `build`, not in any migration, not
  on app startup
- **manually applied** — you run the generator, then apply the resulting
  `.sql` file to your own Supabase project yourself (CLI, dashboard SQL
  editor, or `psql`), whenever you choose to connect one

This was generated and its SQL output inspected for well-formedness in this
environment, but **not applied against a live Supabase project** — there is
none connected here. See the verification report in
`docs/product-cleanup-summary.md` for what was and wasn't actually tested.

### Matching (missing-company suggestions)

Before accepting a "suggest a missing company" submission, `requestCompany`
in `src/lib/api.ts` checks for an existing match:

1. Exact ticker match (via `securities`/aliases in Supabase mode, or the
   directory dataset in demo mode).
2. Case-insensitive company-name match.

If a match is found, the user is shown a link to the existing company page
instead of a duplicate request being created. This is a simple two-step
check, not the multi-tier CIK/provider-ID/fuzzy-name matching hierarchy
described for a live-sync Phase 2 — there is no sync to reconcile against
yet.

### Search

`search_companies(search_query, result_limit)` is a Postgres function
(`stable`, invoker-rights — RLS still applies) using `pg_trgm`. Ranking,
low tier wins:

0. Exact primary ticker
1. Exact non-primary ticker (e.g. a dual-class company's second symbol)
2. Exact former-ticker alias
3. Primary-ticker prefix
4. Exact display name
5. Display-name prefix
6. Alias/brand match
7. Fuzzy trigram name match

Campaign engagement (supporter count) is used **only** to order results
*within* a tier — it can never outrank a better-tier match, so it can never
outrank an exact ticker match.

Demo mode implements the same tier ordering in TypeScript
(`searchCompanies` in `src/lib/api.ts`) against `companyDirectory.ts`, so
behavior is consistent between modes and both are covered by the same unit
tests.

### Data-mode selection

Which data source the app uses is selected **explicitly** via
`VITE_DATA_MODE` (`demo` | `supabase` | `test`), resolved in one place
(`src/lib/dataMode.ts`) — never inferred from whether Supabase credentials
happen to be present. Demo/test mode reads `companyDirectory.ts` +
localStorage exclusively (under separate storage keys, so test runs never
touch a developer's demo data); Supabase mode reads the database
exclusively and surfaces query failures as errors rather than silently
falling back. The two sources are never merged. Full mode semantics,
defaults, and failure behavior are documented in `README.md`.

### Routes

- `/company/:ticker` — resolves the ticker against active securities, then
  former-ticker aliases. If the resolved primary ticker differs from the
  URL (a former ticker, or a non-primary class), the page issues a client
  redirect to the canonical `/company/:primaryTicker` and fires a
  `ticker_route_redirected` analytics event.
- `/companies/:slug` — canonical, stable route (`display-name-<id
  fragment>`), independent of ticker changes.

Both render the same `CampaignPage` component — there is one page
implementation, not one file per company.

### On-demand campaign creation

Importing a company into the directory does **not** create a campaign.
Every eligible company gets a directory page; a campaign is created only
when an authenticated user performs the first campaign-triggering action
("Start this campaign" or "Ask the first question"). This is enforced by a
`security definer` Postgres function, `start_campaign(company_id)`, which
does an idempotent `insert ... on conflict (company_id) do nothing` against
the **pre-existing** unique constraint on `campaigns.company_id` — so
concurrent "first" actions can never create two campaigns for the same
company; the loser of the race simply reads back the winner's row.

### RLS

- Public reads: `companies` where `is_discoverable`, `securities` and
  `company_aliases` belonging to a discoverable company. (`is_discoverable`
  replaces the old `is_public` flag as the single source of truth for both
  the RLS policy and the client-side query filter — they previously could
  have drifted independently.)
- Public cannot write `securities`/`company_aliases` — admin-only
  (`public.is_admin()`, reused from the existing cleanup-era schema).
- `start_campaign` is the only way to create a `campaigns` row from the
  client — there is still no direct public INSERT policy on `campaigns`.

### Market-cap eligibility and hysteresis

**Not built in Phase 1.** There is no live market-cap feed, so there is
nothing to apply a $300M threshold or a hysteresis band against yet. Every
curated entry is treated as eligible by hand-curation. The
`is_directory_eligible`/`ineligibility_reason` columns exist so a future
sync can express this without another migration.

## Not yet built (Phase 2)

The following were explicitly scoped out of this phase — no code for them
exists in this repository, and nothing here should be read as claiming
otherwise:

- SEC company-directory provider integration
- Financial Modeling Prep (FMP) screening/enrichment provider integration
- The `CompanyUniverseProvider` abstraction interface and its
  implementations (`SecCompanyDirectoryProvider`, `FmpCompanyUniverseProvider`,
  `MockCompanyUniverseProvider`)
- The `sync-company-universe` Supabase Edge Function, dry-run/commit-run
  modes, and concurrency locking
- Supabase Cron scheduling
- `company_sync_runs`, `company_sync_errors`, `company_provider_records`,
  `security_symbol_history` tables
- The admin company-universe dashboard (sync review, manual eligibility
  approval, primary-security selection, duplicate-merge workflow, exports)
- Demand-concentration analytics (top-5 concentration rate, etc.)
- Automatic market-cap-threshold eligibility and hysteresis
- `docs/company-universe-operations.md` runbooks (would document
  infrastructure that doesn't exist yet)

## Known Phase 1 simplifications

- **Discover's `campaignState` filter** is applied after a page is fetched
  from the database, not as part of the SQL query (there's no indexed
  campaign-state column on `companies` yet, and adding one for a single
  Phase-1 filter would violate the "proportionate schema" constraint for
  this phase). A page may contain fewer than the page size when this
  filter is active. Revisit if the directory grows enough for this to
  matter.
- **`getDashboardData`** relies on RLS to filter out non-discoverable
  companies from a user's supported/followed lists. Nothing in Phase 1 ever
  sets `is_discoverable = false`, so this is unreachable today — but a
  future admin tool that can disable a company should also decide how (or
  whether) it disappears from a user's history, rather than silently
  vanishing.
- **`former_ticker_searched`** (from the original event list) isn't tracked
  as a separate event; the equivalent signal is captured by
  `ticker_route_redirected`, which fires whenever a resolved company's
  canonical ticker differs from the one in the URL.
- **Inactive/delisted company pages** are not specially handled — nothing
  in Phase 1 can ever mark a security inactive (no live sync exists), so
  there's no reachable inactive state to design for yet.

## Discover highlights (core-experience phase)

Discover now shows real-activity highlight sections (near outreach target,
most supported, most voted, newest) derived from `public_campaign_metrics`.
Sections with no real entries are hidden — the directory below remains the
primary browse surface. Ranking rules and the deliberate exclusion of a
"recently requested companies" section (requests are private by RLS) are
documented in `docs/core-user-experience.md`.
