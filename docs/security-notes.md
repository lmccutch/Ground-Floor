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
---

## Prompt 5 — admin communications, attachments, system health (202607280002/0003/0004)

Full detail in [docs/admin-communications.md](admin-communications.md). Security
summary only here.

**Recipients are never client-supplied.** `admin_create_reply` has no recipient
parameter at all; the address is read from `bug_reports.reporter_email` /
`support_tickets.email` inside the SECURITY DEFINER function. The send Edge
Function passes the RPC's returned recipient to Resend, never anything from the
request body. `send-transactional-email` also refuses the `admin_reply` template
on the ordinary caller-supplied-recipient path, so the free-form template cannot
be reached with an arbitrary `to`.

**Reply/retry require an administrator JWT.** The `x-intake-secret` internal path
is explicitly *not* accepted for either mode — the internal secret can send system
templates to a derived address, but it can never send an operator-authored message.

**Sanitisation.** Subjects have all control characters (including CR/LF) replaced
— header injection is impossible. Bodies are control-character-stripped and
length-capped. The email is a fixed template with every value HTML-escaped;
administrator-supplied HTML is never rendered as markup. Internal notes are never
read by the reply path.

**Retries preserve evidence.** A retry INSERTs a new `email_messages` row linked
by `retry_of_message_id`; the original row is never updated. Eligibility is
decided by one function (`email_retry_ineligible_reason`) used by both the
enforcement path and the read model, so the UI cannot offer what the server will
refuse. Delivered, complained, suppressed, in-flight, permanently-bounced,
orphaned and >30-day-old messages are all refused. A retry request is never
treated as proof of delivery.

**Attachments.** Private bucket `bug-attachments`, no storage policy for `anon` or
`authenticated` (deny by default) — all access goes through service-role Edge
Functions. Object keys are server-generated `<bug_id>/<uuid>.<ext>`; the uploader's
filename is sanitized and stored separately for display only.
`record_bug_attachment` refuses any path outside the report's own prefix, which is
what blocks cross-record access. Types are verified from **magic bytes**, not the
browser's `Content-Type`; SVG and HTML are refused as script-bearing. Admin
viewing needs two independent `is_admin()` checks and yields a 60-second signed
URL; every access is audited. PDFs are never embedded in the admin origin.
**No malware scanning is integrated and none is claimed.**

**Webhook.** Signature verification still runs against the raw body before parsing.
Rejected deliveries increment an hourly counter and raise at most one deduplicated
`webhook_failed` notification per hour — no per-request row, so the endpoint
cannot be used to exhaust storage. `email_event_log` stores no bodies, recipients,
headers or signing material and deduplicates on the Svix id.

**No secret is ever exposed.** `admin-system-diagnostics` returns only
`configured` / `missing` / `invalid_format` per secret — it reads the value, tests
its shape and discards it. No value, prefix, length or hash is returned or logged.
Health RPCs return aggregate counts and **masked** recipients only
(`public.mask_email`), never a recipient list, raw provider payload or
unsanitized error.

**Function hygiene.** Every new function is SECURITY DEFINER with
`search_path = ''` pinned empty, fully-qualified references, EXECUTE revoked from
`public`/`anon`, and an explicit grant to exactly one role — `authenticated` for
admin-facing RPCs (each gated on `is_admin()` as its first statement),
`service_role` for internal recorders. Asserted statically by
`src/pages/admin/adminCommunications.test.tsx` and live by
`npm run verify:admin-communications`.

**No existing function signature changed.** `record_email_attempt` was
deliberately left untouched — adding parameters would have created an overload and
made the deployed Edge Function's named-argument call ambiguous, breaking
production email. The reply/retry paths use dedicated new functions instead.

**Nothing may report Healthy without evidence.** `/admin/system` computes every
verdict in `src/lib/systemHealth.ts`, where `worst()` ranks `unknown` above
`healthy` so an unverifiable check can never be absorbed into a green section.
`src/lib/systemHealth.test.ts` asserts each absence-of-evidence case resolves to
Unknown.

**Deferred / owner-run (no scratch or production credentials in the authoring
environment):** applying the three migrations to scratch and then production;
deploying the five Edge Functions; setting `EMAIL_REPLY_CONTACT` and
`VITE_APP_COMMIT`; confirming the `bug-attachments` bucket is private in the
dashboard; running `npm run verify:admin-communications` against scratch; the
authenticated-admin browser acceptance tests.
