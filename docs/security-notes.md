# Security notes

## 2026-07-13 — `start_campaign` was callable anonymously (fixed)

**Found during** the Phase 1 scratch-project verification
([checklist](supabase-verification-checklist.md)), on the disposable project
`openvoice-scratch` — never on production.

**Behaviour observed:** `POST /rest/v1/rpc/start_campaign` with only the anon
API key (no signed-in user) returned HTTP 200 and created campaign row
`31ee1c6f-97fc-4f3d-82fc-46809522792d` for Apple
(`adbdae99-20a6-4a03-a007-650f7b124c1d`). Direct table inserts were correctly
denied by RLS in the same run; only the RPC was exposed. Anyone holding the
public anon key could have created campaigns for every company by calling the
REST endpoint directly — the frontend hiding the button is not a control.

**Root cause (two compounding defects in `202607110001_company_universe_core.sql`):**

1. PostgreSQL grants `EXECUTE` on new functions to `PUBLIC` by default. The
   migration added `grant execute ... to authenticated` but never revoked the
   default `PUBLIC` grant, so `anon` retained execute.
2. The function is `SECURITY DEFINER` (required — `campaigns` deliberately has
   no INSERT policy) but had no `auth.uid()` guard, so once reachable it
   inserted unconditionally, bypassing campaigns RLS.

**Fix:** forward-only migration
`supabase/migrations/202607130001_fix_start_campaign_security.sql` — revokes
`EXECUTE` from `PUBLIC` and `anon`, grants only to `authenticated`, and
recreates the function with an explicit `auth.uid() is null` guard raising
`42501`. Campaign-creation semantics (one campaign per company, race-safe
upsert, returns the campaign UUID) are unchanged. Campaign RLS was not
weakened and no insert policy was added.

**Regression coverage:** `npm run verify:rpc-security`
(`scripts/verify-start-campaign-security.ts`) runs against a live project and
asserts, with service-role row counts taken before and after each call:
anon call denied with no row created; authenticated call succeeds and is
idempotent (same UUID, exactly one row); invalid company id fails cleanly with
no row. Run it against any scratch/staging project after schema changes.

**Rule for future migrations:** every `create function` that mutates data or
is `SECURITY DEFINER` must be followed by
`revoke execute on function ... from public;` plus explicit grants, and
definer functions must validate `auth.uid()` themselves.

## 2026-07-14 — core-experience migration security review

Migration `202607140001_core_experience.sql` added question edit/delete
policies, the `feedback` table, notification read/update + generation
triggers, the `public_campaign_events` view, and profile-level anonymity in
`public_questions`. Security posture:

- **New RLS**: question edit/delete are author-only and restricted to
  `Open`/`Under review`; feedback is insert-as-self / read-own / admin-all;
  notifications add a users-update-own policy with a **column-level grant**
  so the authenticated role can update `read_at` only.
- **New SECURITY DEFINER functions**: `notify_campaign_status_change()` and
  `notify_question_status_change()` — both `set search_path = public`, both
  trigger functions (not callable via the API), and EXECUTE is revoked from
  PUBLIC as defense in depth. They exist because `notifications` deliberately
  has **no INSERT policy**: rows can only come from real status changes.
- **New view** `public_campaign_events` follows the existing owner-view
  pattern and omits `created_by`.
- **Live verification**: `npm run verify:core-security`
  (`scripts/verify-core-experience-security.ts`) runs 34 checks against the
  scratch project with real anon/authenticated/service requests: edit/delete
  ownership + status locking, vote-removal ownership, reporter privacy,
  feedback isolation and anti-forgery, notification isolation, title-tamper
  rejection, direct-insert rejection, trigger generation (delta-checked),
  event-view exposure, and profile-level anonymity. All passed on
  2026-07-14; the script cleans up everything it creates.

## 2026-07-22 — Prompt 3 transition enforcement + SECURITY DEFINER hardening

Migrations `202607220005_transition_enforcement.sql` and
`202607220006_transition_write_paths.sql` (branch
`audit/prompt3-transition-enforcement`). Forward-only, privilege/DDL-only, no
data changed. Signatures unchanged so grants/RLS bindings are preserved.

**Defect fixed:** the ten admin mutation RPCs wrote `status = coalesce(p_status,
status)` with **no** transition validation — any status could jump to any other
via a direct RPC call. CHECK constraints only bound the *set* of legal values,
and the UI only *hid* buttons; neither is transition enforcement.

**SECURITY DEFINER hardening — the standing conventions (apply to every future
definer function):**

- `SET search_path = ''` (empty), never `= public`. Empty removes reliance on
  `public` resolution and blocks `pg_temp`/`public` object shadowing regardless
  of who can CREATE in `public`.
- **Fully schema-qualify every application object** — tables, functions,
  sequences, custom types, and `auth.*` objects (e.g. `public.campaigns`,
  `public.question_status`, `auth.uid()`, `auth.users`). Built-ins resolve via
  the implicit `pg_catalog`.
- `SECURITY DEFINER` only where it must bypass RLS or write privileged rows.
  `public.admin_is_valid_transition` is deliberately **not** definer — it is
  pure logic with no data access.
- Execute **revoked from `PUBLIC` and `anon`**; granted only to `authenticated`
  for callable RPCs. Internal-only helpers (`write_admin_audit`,
  `create_admin_notification`) are revoked from `authenticated` too.
  `is_admin()` stays granted to anon+authenticated because RLS depends on it
  returning `false` (not erroring) for non-admins.
- Every mutation RPC calls `public.is_admin()` first and raises `42501`
  otherwise.

**Approved mutation architecture:** all admin writes go through a narrow,
`is_admin()`-guarded, audited `SECURITY DEFINER` RPC — never a generic mutator,
never a direct client table write. `adminApi.ts` contains zero direct table
writes (enforced by `adminActions.test.tsx`).

**Transition matrices:** the full permitted from→to graph for company requests,
campaigns, questions, question reports, bugs, support tickets, and notifications
is documented in the header of `202607220005_transition_enforcement.sql` and
encoded in `public.admin_is_valid_transition` plus per-RPC metadata gates. In
brief, these invalid direct-RPC moves are now rejected server-side: approved
request→under_review; generic updater→approved; active campaign→completed and
completing/closing without a reason; new bug→deployed and fixed/deployed without
fix metadata; support resolve/close without a resolution reason; publishing a
hidden/removed/archived question (restore first); confirming a report as
action_taken without a coordinated resolution; and re-resolving a terminal
report.

**Direct-write bypass closure (`202607220006`):** the `... for all using
is_admin()` policies plus Supabase's default UPDATE grant to `authenticated` let
the sole admin bypass the RPC gates with a raw PostgREST PATCH. UPDATE is now
revoked from `authenticated`/`anon` on `company_requests`, `bug_reports`,
`support_tickets`, `question_reports` (all insert-only for clients). `questions`
keeps a **column-scoped** `UPDATE (question_text, topic)` so users still edit
their own text/topic while all moderation columns are RPC-only. `campaigns` were
already immune (no admin UPDATE policy). Confirmed no frontend write targets a
revoked column.

**UI alignment (matches, does not replace, server enforcement):** Questions no
longer offers Publish on hidden/removed/archived rows; Campaigns routes Complete
through a reason-collecting action (removed from the generic status dropdown);
Reports requires a resolution note to confirm.

**Verification:**

- `npm run verify:transition-security`
  (`scripts/verify-transition-enforcement.ts`) — the authoritative live
  direct-RPC proof. Creates throwaway fixtures, asserts each invalid transition
  and each direct-PATCH bypass is rejected and each valid transition succeeds,
  then deletes everything (cleanup runs in `finally`).
- `src/pages/admin/transitionEnforcement.test.ts` — CI static audit that the
  guards and empty `search_path` remain present in every RPC (no database
  needed).

**Why the live verifier must never run against production:** it calls
`bootstrap_admin()` and creates a user with the approved admin email, plus
throwaway operational rows. Run it **only** against a disposable
scratch/staging project or a Supabase database branch, using process-scoped or
git-ignored env vars — never with production service-role credentials, never in
`VITE_` vars or the browser bundle.

**Deployment order (must be):** apply `202607220005` then `202607220006` to the
database *before* merging/deploying the frontend. The DB hardening is
backward-compatible (the pre-change UI still functions), but the new UI assumes
the new server rules.

**Migration-repair rule:** `supabase migration repair` is permitted **only**
when the migration SQL was actually executed by another approved mechanism *and*
remote migration history demonstrably does not reflect reality — document the
evidence first. Never run `supabase db reset --linked` against production and
never repair merely because it is offered.

**Emergency containment:** if the frontend regresses post-deploy, roll back /
re-promote the previous known-good Vercel deployment — the DB hardening is
backward-compatible and stays in place. Do **not** restore the removed direct
UPDATE privileges (that reopens the bypass) without a documented emergency
reason.

**Deferred / owner-run (not executed in the authoring environment — no local
Postgres, no scratch/prod credentials):** running the live verifier against a
scratch project; applying both migrations to `openfloor-production`; the
post-deploy production-safe DB checks, Supabase Security Advisor review, and the
authenticated-admin browser smoke test.
