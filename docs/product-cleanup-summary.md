# Product cleanup summary

This is the persistent record of two pieces of work: the original product
cleanup (rename, dead-code removal, design-system rebuild) and the Phase 1
company-universe addition built on top of it. Earlier work was done and
reported directly in conversation rather than as a committed doc; this file
is the first written record and is now the source of truth going forward.

## Cleanup phase (prior work)

Renamed the product from its earlier working name to **Open Floor**,
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

## Core-experience phase (2026-07-14)

Built on the verified Phase 1 base, on branch `phase-1-company-directory`.
Full behavior rules live in `docs/core-user-experience.md`; security review in
`docs/security-notes.md`.

### Added

- **Campaign lifecycle panel** — six-stage stepper on every campaign page with
  current stage, plain-English explanation, next step, supporter target and
  progress, and the reaching-the-target-guarantees-nothing disclaimer. Stage
  completion derives strictly from the persisted campaign status.
- **Truthful campaign timeline** — launch date, supporter milestones dated by
  the Nth supporter row, and admin-recorded outreach events via the new
  `public_campaign_events` view. Nothing projected or invented.
- **Question experience** — Top/Newest sorting, Unanswered filter, edit and
  delete of your own `Open`/`Under review` questions (RLS-enforced), vote
  removal (voting is now a toggle), private reporting, duplicate-question
  guidance before submission, direct question URLs with scroll-and-highlight,
  and a full share menu per question.
- **Sharing** — one ShareMenu (company + questions): copy link, native share
  where supported, Reddit, X, LinkedIn, email — all links UTM-tagged, all copy
  restrained.
- **Feedback** — persistent "Give feedback" entry on every page, categorized,
  stored in a new RLS-protected `feedback` table (authenticated-only by
  design).
- **Search** — recent searches (local-only, clearable) under the existing
  autocomplete.
- **Discover** — real-activity highlight sections (near-target, most
  supported, most voted, newest); hidden until real data exists.
- **Dashboard** — recent-activity feed from persisted rows, notification
  read/unread with mark-one/mark-all, and profile settings (display name,
  country, investor type, public anonymity — now actually honored by
  `public_questions`).
- **In-app notifications** — generated only by real campaign/question status
  changes via locked-down triggers; milestone and email notifications
  deferred.
- **Migration** `202607140001_core_experience.sql` (forward-only) and live
  verification script `npm run verify:core-security` (34 checks, all passing
  against the scratch project).

### Cleanup principles preserved

No fake users, campaigns, questions, votes, milestones, or management
activity anywhere; every new control does something real; every new view has
loading/empty/success/error states; demo and Supabase data remain strictly
separated; no existing RLS weakened (only added).

## Trust and transparency phase (2026-07-14)

Eleven public trust/legal pages (About, How It Works, FAQ, Community
Guidelines, Voting Rules, Transparency incl. conflicts of interest,
Moderation Policy, Contact, Privacy, Terms, Investment Disclaimer), a site
footer linking all of them, per-route SEO metadata, an MNPI warning in the
question form, expanded report categories, and eight new analytics events.
Legal pages are explicitly marked as drafts requiring professional review.
No schema changes; no RLS changes. Full detail: docs/trust-and-transparency.md.

## Homepage rewrite (2026-07-14)

Rebuilt the homepage around a single positioning statement — "Where
shareholders decide what management answers next" — replacing the old
"Direct access to management, powered by shareholders" hero and its
fabricated illustrative widget (a fictional "Northstar Grid Systems" company
shown with invented numbers: "62 of 100 supporters", "38" votes). The new
hero has no fabricated numbers at all.

New eight-section structure: hero (headline, supporting copy, search, two
CTAs, trust note) → the problem → how it works (real 6-step process, linking
to `/how-it-works`) → live participation (real campaign data only, honest
empty state, never the full directory) → an explicitly-labelled illustrative
example question (no real company attached) → why collective participation
matters → trust principles (linking to Transparency/Guidelines/Disclaimer) →
final CTA. Full detail: `docs/core-user-experience.md`.

Removed the old four-step marketing summary and the dark "traditional vs.
Open Floor" comparison block (and their now-unused CSS) since the new
"how it works" and "why this matters" sections replace them with the real
lifecycle and non-activist framing the new copy requires.
