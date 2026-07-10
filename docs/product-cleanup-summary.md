# Product cleanup summary

This is the persistent record of two pieces of work: the original product
cleanup (rename, dead-code removal, design-system rebuild) and the Phase 1
company-universe addition built on top of it. Earlier work was done and
reported directly in conversation rather than as a committed doc; this file
is the first written record and is now the source of truth going forward.

## Cleanup phase (prior work)

Renamed the product from its earlier working name to **GroundFloor**,
removed decorative/non-functional UI (dead routes, inert buttons, fake
"live" metrics), rebuilt the design system (tokens, buttons, cards, modals,
empty/loading/error states) for consistency, and fixed a set of functional
bugs in the campaign/question/voting flows. No dedicated test suite existed
at the end of that phase.

## Company-universe Phase 1 (this work)

### What was added

- A company/security/alias data model (`companies` extended,
  `securities`, `company_aliases`) so a campaign attaches to a durable
  `company_id`, not a ticker string.
- Real database-backed search (`search_companies`) with a documented
  ranking order, and an equivalent demo-mode implementation.
- Dynamic company routes with former-ticker redirect support:
  `/company/:ticker` and `/companies/:slug`, sharing one page component.
- On-demand campaign creation (`start_campaign`) — a company having a
  directory page no longer implies a campaign exists.
- A curated, ~225-company launch directory
  (`src/data/companyDirectory.ts`) used by demo mode, tests, and a new
  Supabase bootstrap generator (`npm run bootstrap:generate`).
- A missing-company suggestion flow that checks for an existing match
  before creating a duplicate request.
- Discover page real filters (sector, exchange, market-cap band, campaign
  state) and pagination against the directory.
- A global search entry point (`SearchAutocomplete`) on the homepage,
  reusing the existing search-field styling.
- Vitest + Playwright test tooling (neither existed before), configured to
  run deterministically in demo mode with no external credentials.
- New analytics events for search and directory engagement (see
  `docs/company-universe.md`).

Full architecture, ranking rules, RLS design, and — importantly — what was
**not** built (SEC/FMP providers, sync infrastructure, admin dashboard,
demand-concentration analytics) are documented in
`docs/company-universe.md`, not repeated here.

### Cleanup principles preserved

- Every visible interactive element added in this phase either does
  something real (search, filters, campaign start, matched-company link)
  or isn't shown.
- No fake campaigns, questions, votes, or company participation were
  introduced. The curated directory contains only real, publicly known
  company facts (name, ticker, exchange, sector) — no fabricated financial
  figures, no fabricated shareholder-authored question text under any real
  company's name.
- Demo data (the curated directory + localStorage state) and any future
  Supabase-backed production data are never merged — each mode reads from
  exactly one source, documented in `docs/company-universe.md`.
- Loading, empty, and error states were added for every new data-dependent
  view (search panel, Discover results, the no-campaign-yet company state).

### Routes changed

- `/company/:ticker` — same path, now resolves through the
  company/security/alias model instead of an exact string match, and can
  redirect to a canonical ticker.
- `/companies/:slug` — new canonical route (existing `/companies` dashboard
  route is unaffected; the two do not conflict).

### New interactions introduced

- "Start this campaign" / "Ask the first question" on a company with no
  existing campaign.
- Homepage and Discover search-as-you-type with keyboard navigation.
- Discover sector/exchange/market-cap/campaign-state filtering with
  pagination ("Load more").
- Missing-company suggestion now short-circuits to "we found this company"
  when a match already exists.

### Whether prior functionality was altered

Existing campaign support, question submission, voting, following,
sharing, dashboard, authentication, and mobile navigation flows were
**reused, not rewritten** — they were updated only where necessary to key
off `company_id` consistently and to handle a campaign that doesn't exist
yet. See the verification section of the implementation report for the
regression check performed after this change.
