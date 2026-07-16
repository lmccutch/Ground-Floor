# Core user experience (campaign lifecycle phase)

What the campaign/question/dashboard experience actually does after the
core-experience phase, and the rules it follows. Built on migration
`202607140001_core_experience.sql`; security verified live by
`npm run verify:core-security` (see [security-notes.md](security-notes.md)).

## Campaign lifecycle

Every company page with a campaign shows a six-stage lifecycle
(`src/lib/campaignLifecycle.ts`, rendered by `CampaignLifecycle`):

1. Shareholders build support
2. Shareholders submit and rank questions
3. Open Floor prepares outreach
4. Open Floor contacts Investor Relations
5. Management decides whether to participate
6. Interview and transcript published

The persisted `campaigns.status` enum (unchanged from the original schema —
`Gathering shareholder interest` … `Campaign paused`) maps onto these stages.
Rules:

- A stage renders as **done only when the status proves the campaign moved
  past it**. `Gathering shareholder interest` marks stages 1–2 as concurrently
  current and nothing done.
- `Management declined` and `Campaign paused` render an explicit outcome
  callout instead of pretending progress; paused claims no stages at all.
- Every pre-decision status carries the disclaimer that reaching the support
  target does not guarantee an interview and that management participation is
  voluntary.
- The supporter target comes from `campaigns.outreach_target`
  (schema default 100); progress is real supporter counts from
  `public_campaign_metrics`.

## Campaign timeline and milestone rules

`getCampaignTimeline` builds the timeline from persisted data only:

- **Campaign started** — `campaigns.launched_at`.
- **10/25/50/100 supporters reached** — shown only once actually reached; the
  milestone date is the `created_at` of the Nth supporter row (supporter rows
  are publicly readable). Demo mode doesn't record per-supporter timestamps,
  so a reached milestone renders with “Date not recorded” instead of an
  invented date.
- **Outreach prepared / IR contacted / response received / interview
  scheduled / interview published / management declined** — rendered from
  `campaign_events` rows, which only admins can write (existing RLS). Exposed
  through the `public_campaign_events` view, which omits `created_by`.

No event is ever projected, estimated, or fabricated.

## Question permissions

- Anyone (including signed-out visitors) reads published questions.
- Authors may **edit or delete their own questions while status is `Open` or
  `Under review`** — enforced by RLS (`users edit own eligible questions`,
  `users delete own eligible questions`) and mirrored client-side by
  `isQuestionEditable`. Once a question is `Selected for outreach`,
  `Sent to management`, `Answered`, `Not answered`, or `Archived`, the author
  can no longer change or remove it (it may already be in front of
  management); admins retain full moderation access.
- Deleting a question cascades its votes, comments, and reports (existing
  `ON DELETE CASCADE` FKs) — no orphaned rows or dashboard entries.
- Ownership is resolved without exposing author ids: `public_questions` never
  includes `author_id` (it would deanonymize anonymous questions); the client
  instead asks for the signed-in user's own question ids.

## Vote removal

Voting is a toggle. `unvoteQuestion` deletes the user's own
`question_votes` row (existing `users remove own votes` policy); counts come
from the vote rows, so removal persists across reloads. Users cannot remove
anyone else's vote (verified live).

## Reporting

Any signed-in non-author can report a question (reason + optional details)
into the existing `reports` table. Reports are write-only for users: there is
no public SELECT policy, so the reporter's identity is never exposed —
verified live. Demo mode accepts the report UI flow without persisting
anywhere (there is no moderation queue to feed).

## Feedback

A persistent “Give feedback” button (bottom-right, every page) opens a modal:
category (`Something is broken` / `Confusing experience` / `Feature request` /
`Company request` / `General feedback`), message, and the current route
captured automatically. Stored in the new `feedback` table: users insert only
as themselves and read only their own; admins read all via `is_admin()`.

**Anonymous submissions are deliberately not enabled**: an unauthenticated
insert path with no server-side rate limiting or captcha is a spam hole.
Signed-out users are routed through the standard sign-in prompt (their typed
message is preserved). Analytics receive category and route only — never the
feedback text.

## Search history

Recent searches are stored **locally in the browser** (localStorage,
namespaced per data mode so tests never touch real history), capped at 8,
deduped by ticker. They appear when the search field is focused and empty,
with a one-click “Clear”. Nothing is sent to the server, and there are no
fake “trending searches”.

## Discover ranking

Discover shows highlight sections above the directory, each derived from
`public_campaign_metrics` and **hidden entirely when it has no real
entries**:

- **Close to the outreach target** — supporters ≥ 50% of `outreach_target`
  and below it, ordered by supporters descending.
- **Most supported** — supporters > 0, descending.
- **Most voted questions** — total question votes > 0, descending.
- **Newest campaigns** — `launched_at` descending.

“Recently requested companies” was considered and rejected: `company_requests`
is intentionally private (own rows + admins only), so there is no public-safe
data to render. A time-windowed “Trending” section is deferred until there is
enough activity for a window to mean something.

## In-app notifications

Notifications are generated **only by real persisted state changes**, via two
`SECURITY DEFINER` triggers (locked search_path, EXECUTE revoked from PUBLIC,
not callable through the API):

- `campaigns.status` change → notifies that campaign's supporters and
  followers.
- `questions.status` change → notifies the question's author.

Both honor `notification_preferences` where a matching column exists
(`management_contacted`, `interview_scheduled`, `interview_published`,
`question_status`); users without a preferences row get the defaults (all
on). Users read only their own notifications, can mark one or all read
(column-level grant restricts client updates to `read_at` only), and cannot
insert notifications directly. There is no notification-generation path from
seed or demo data.

**Deferred** (documented, not built): supporter-milestone notifications
(10/25/50/100), “your question received meaningful new support”, a
notification-preferences UI, and all email notifications.

## Analytics events added in this phase

Tracked through the existing `track()` service (PostHog, only when a key is
configured). No email addresses, feedback text, position sizes, or private
profile values are ever sent.

| Event | Properties |
|---|---|
| `campaign_stage_viewed` | ticker, status |
| `campaign_timeline_viewed` | campaign_id, event_count |
| `question_sorted` | ticker, sort (`top`/`newest`) |
| `question_filtered` | ticker, filter (`all`/`unanswered`) |
| `question_edited` | ticker, question_id |
| `question_deleted` | ticker, question_id |
| `question_vote_removed` | ticker, question_id |
| `question_reported` | ticker, question_id, reason |
| `question_shared` | ticker, question_id, method |
| `company_shared` | ticker, method (now includes `linkedin`, `native`) |
| `feedback_started` | path |
| `feedback_submitted` | category, path (never the message text) |
| `recent_search_selected` | ticker |
| `recent_search_cleared` | — |
| `notification_opened` | count, unread |
| `notification_marked_read` | scope (`one`/`all`), count |
| `profile_updated` | has_country (boolean), public_anonymous (boolean) |

Share links carry `utm_source=<channel>&utm_medium=share` so inbound
attribution works with the existing `getAttribution()` capture.

## Profile

Users can update display name, country (optional), investor type, and a
**public anonymity** preference from the dashboard. `public_anonymous` is now
actually consumed: the `public_questions` view renders all of an anonymous
user's questions as “Anonymous Shareholder”. Email addresses are never shown
publicly anywhere.

## Known limitations

- Question sorting/filtering is client-side over the already-loaded list —
  fine at current volumes, revisit with pagination.
- The report flow's UI is exercised end-to-end in demo mode only up to the
  point of persistence (demo has no moderation queue); the Supabase insert +
  privacy guarantees are covered by the live verification script instead.
- The dashboard activity feed in demo mode lists only dated events (questions
  submitted) because demo mode doesn't record support/follow/vote timestamps
  — no dates are invented.
- “Edited” indicators on questions are not shown (`public_questions` doesn't
  expose `updated_at`).
- Campaign statuses are advanced by admins via SQL/dashboard; there is no
  in-app admin tooling yet (unchanged from before this phase).

## Trust-layer additions (2026-07-14)

- Report categories expanded and centralized in `src/lib/reporting.ts`
  (spam, abuse, manipulation, duplicate, misinformation, personal
  information, MNPI, other) — free-text column, no migration needed.
- The question form now shows a visible MNPI warning before submission,
  linking to the Community Guidelines.
- New analytics events: trust_page_viewed, faq_item_opened,
  contact_link_clicked, disclaimer_viewed, community_guidelines_viewed,
  transparency_viewed, report_reason_selected, account_deletion_requested.
- Public policies documenting this experience live at /guidelines,
  /voting-rules, /transparency, and /moderation.

## Homepage (2026-07-14)

`src/pages/HomePage.tsx` — positioning: "Where shareholders decide what
management answers next." Supporting copy: "Open Floor brings individual
shareholders together around public companies so they can submit, rank, and
support the questions they want management to answer." Banned phrases
(guaranteed access, official company campaign, verified shareholders, company
partnership, institutional-grade, exclusive information, beat the market,
democratize finance) do not appear anywhere on the page — enforced by an e2e
assertion that greps the full rendered page text.

### Structure

1. **Hero** — headline, one supporting sentence, the existing
   `SearchAutocomplete` (unchanged component, given two optional new
   callback props — see Search below), two CTAs ("Find a company" →
   `/discover`, "See how it works" → `/how-it-works`), and a trust note
   ("Management participation is voluntary and never guaranteed."). No
   metrics, cards, or charts in the hero itself.
2. **The problem** — three short sentences on the institutional/individual
   information gap. No activist language.
3. **How it works** — the real 6-step process (find → support/start →
   submit & rank → Open Floor prepares outreach → management may
   participate → interview/transcript published if they do), linking to the
   full `/how-it-works` page.
4. **Live participation** — real data only, reusing `getDiscoverHighlights()`
   (near-threshold → most-supported → newest, deduped, capped at 3). Shows an
   `EmptyState` inviting the visitor to be first when nothing real exists yet
   — never a random slice of the 225-company directory, and never a
   fabricated example.
5. **Illustrative example** — one example shareholder question, explicitly
   tagged "Illustrative example — not a real question or company", with no
   company identity (no ticker, no monogram) attached, so it can never be
   mistaken for a real campaign.
6. **Why collective participation matters** — three sentences, no activist
   framing.
7. **Trust principles** — six short principles (no investment advice, no
   guaranteed interviews, no issuer control over ranking, self-reported
   status, public broadly-distributed answers, disclosed conflicts), linking
   to Transparency, Community Guidelines, and the Investment Disclaimer.
8. **Final CTA** — "Find a company you own or follow." with a direct button
   to Discover.

### Real-data and empty-state rules

`getDiscoverHighlights()` (built in the core-experience phase) is reused
as-is — no second data path was created. The homepage never falls back to
showing companies with no campaign (the old behavior); when there is no real
campaign activity anywhere, the honest empty state renders instead.

### Search

The homepage uses the same `SearchAutocomplete` component as Discover and
the app-wide search — not a second implementation. It gained two optional
props, `onSearchStarted` and `onResultSelected`, so a page can layer its own
analytics on top of the component's existing tracking without duplicating
search logic; both are stored in refs so they don't need to appear in the
debounce effect's dependency array. Exact ticker priority, name search,
former-ticker resolution, keyboard navigation, and recent searches are all
inherited unchanged and covered by both `e2e/company-universe.spec.ts` and
the new `e2e/homepage.spec.ts`.

### Analytics events added

`homepage_viewed`, `homepage_primary_cta_clicked` {source},
`homepage_secondary_cta_clicked`, `homepage_how_it_works_clicked`,
`homepage_search_started`, `homepage_search_result_clicked` {ticker},
`homepage_trust_link_clicked` {target}, `homepage_final_cta_clicked`. Search
events never carry raw query text — only `query_length` (existing policy,
inherited from `SearchAutocomplete`'s own events) — verified by a Vitest test
that inspects every mocked `track()` call for the searched string.

### SEO

`index.html`'s baked-in title/description/OG/Twitter tags now match the new
positioning (the effective homepage metadata, since other routes override
and then restore them via `usePageMeta` on navigation). `HomePage` also
calls `usePageMeta` directly for consistency and testability. Canonical path
is `/`; already listed in `sitemap.xml`.
