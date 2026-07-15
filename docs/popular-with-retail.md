# Popular with Retail Investors (Discover beta)

A curated Discover section that ranks companies by their standing in a
third-party linked-broker investor panel. It exists to make Discover
immediately interesting before GroundFloor has its own proprietary rankings.
It is a **point-in-time editorial snapshot**, not a live integration: there
is no scraper, no API credentials, no scheduled refresh, and no
ownership-calculation engine.

## Source and methodology

The ranking is curated from **Fintel's "Retail Ownership — Most Widely Held
Stocks"** table as displayed on **2026-07-15**.

Fintel's dataset is based on users who voluntarily link brokerage accounts,
so the rankings reflect popularity **within Fintel's linked-broker panel**,
not total market-wide retail ownership. The curated CSV already excludes
ETFs, funds and investment trusts, private securities, and most companies
below roughly $500M market cap.

The on-page disclosure states:

> Companies are ranked using aggregated holdings from a third-party
> linked-broker investor panel. The ranking reflects activity within that
> sample and is not a measure of total retail ownership.

We deliberately **do not** describe this as most-retail-owned, exact or
verified retail ownership, a retail-shareholder count, or a percentage owned
by all retail investors. Fintel does not endorse GroundFloor.

## CSV

- **Location:** `groundfloor_popular_retail_stocks_fintel_2026-07-15.csv`
  (repo root).
- **Columns (all required, order-independent):** `feature_rank`,
  `fintel_source_rank`, `ticker`, `company_name`, `market_cap_usd_mm`,
  `fintel_panel_market_share_pct`, `fintel_panel_avg_position_usd`,
  `fintel_panel_owner_count`, `fintel_panel_tracked_value_usd`,
  `source_name`, `source_url`, `source_as_of`, `ranking_method`,
  `is_featured`.
- `feature_rank` is the public display order. `is_featured` gates whether a
  row is shown at all.

## Import command

```
npm run retail:import [path/to.csv] [--skip-unresolved]
```

Defaults to the CSV above. The script (`scripts/import-retail-popularity.ts`)
only ever **reads a local CSV and writes files** — it never touches a
database, credentials, or the network. It generates two committed artifacts:

1. **`src/data/retailPopularity.ts`** — the public-safe featured ranking used
   by demo/test mode and the client bundle. Contains **only** `featureRank`,
   `companyKey`, `primaryTicker`, `matchedTicker`, `isFeatured`.
2. **`supabase/seed/<date>_retail_popularity.sql`** — an idempotent upsert
   (keyed on `company_id`) applied to a Supabase project **manually, as an
   admin/service role**. This file carries the full panel provenance.

Re-running is safe and deterministic: the same CSV always produces the same
output, and the SQL is upsert-only.

## How matching works

Each CSV row is matched to a canonical company using the same identity
helpers as search and the bootstrap generator (`normalizeSymbol`):

- Tickers are normalized so `BRK.B`, `BRK-B`, and `BRK/B` are equivalent.
- A row matches an active **security** (current ticker, including non-primary
  dual-class symbols like `GOOG` or `BRK.B`) or a **former-ticker alias**.
- Multiple securities of one company **collapse to a single featured entry**,
  keeping the best (lowest) `feature_rank`. Example: `GOOGL` (#13) and `GOOG`
  (#40) both resolve to Alphabet, which is featured once at #13.
- A card always links to the company's **primary** ticker / canonical page,
  even when the ranked security was non-primary (e.g. `BRK.B` → the Berkshire
  page).

## How unresolved rows are handled

- **Import time:** if a featured row cannot be resolved to a company, the
  script **fails** (non-zero exit) and lists the tickers, unless
  `--skip-unresolved` is passed. Resolve failures by adding the company to
  `src/data/companyDirectory.ts` (the approved company-bootstrap pattern) and
  rerunning — never by creating ad-hoc company records.
- **Render time:** `getFeaturedRetailCompanies()` excludes any record whose
  company can no longer be resolved, logging nothing to the user and never
  producing a broken link. A failed ranking request hides the section only —
  the rest of Discover keeps working.

Invalid rows (bad `feature_rank`, missing `ticker`/`source_name`, unparseable
`is_featured`) are reported as failures and never silently dropped.

## Data model

`supabase/migrations/202607150001_retail_popularity.sql`:

- **`company_retail_popularity`** — one row per company (`unique(company_id)`),
  storing `feature_rank`, `source_rank`, source provenance, the panel columns
  (retained for internal reference), `market_cap_usd_mm`, `ranking_method`,
  and `is_featured`. Indexed on `feature_rank` (partial, featured) and
  `company_id`.
- **RLS:** the base table is **admin-only** (no public SELECT policy), so the
  panel columns are never reachable by the anon/authenticated roles. Writes
  are admin/service-role only.
- **`public_retail_popularity`** — a public-safe view exposing only
  `feature_rank`, source provenance, and `is_featured`, and only for
  **featured rows of discoverable companies**. It deliberately omits every
  `panel_*` column and `market_cap_usd_mm`. Granted `select` to `anon` and
  `authenticated`, following the same owner-view pattern as
  `public_campaign_metrics` / `public_questions`.

## What is displayed

Publicly: rank, company name, ticker, campaign status, real supporter and
question counts, a CTA, and a section-level source date. Campaign counts and
CTAs reflect **real** campaign state — nothing is fabricated, and a featured
company never gets an auto-created campaign.

Never displayed: `fintel_panel_owner_count` (a sample count that could be
mistaken for a total shareholder count), tracked portfolio value, average
position, or panel market share. These stay in the database for provenance.

## Changing the featured rankings

Edit or replace the CSV (or point the import at a new one), rerun
`npm run retail:import`, review the generated diff, and — for Supabase — apply
the new seed file. To change display order without new data, edit
`feature_rank` in the CSV and rerun.

## Analytics

Emitted via the existing `track()` service (PostHog, only when a key is set):
`popular_retail_section_viewed`, `popular_retail_company_clicked`,
`popular_retail_view_all_clicked`, `popular_retail_campaign_cta_clicked`.
Properties include company id, ticker, feature rank, campaign status, and
authenticated state — no private user data.

## Known limitations

- The ranking is a **static snapshot**; it does not update until the CSV is
  re-imported.
- Panel figures are a **sample**, not market-wide ownership.
- Non-featured (`is_featured = FALSE`) rows are skipped, not stored, in the
  generated client data.
- The SQL seed is upsert-only: removing a company from the CSV does not
  automatically unfeature it in an already-seeded database (unfeature it
  manually).
- The feature is intentionally **removable**: delete the section component
  usage, the generated data file, the migration/seed, and the CSV — nothing
  else depends on it. The companies added to the directory for it are ordinary
  directory entries and can stay.
```
