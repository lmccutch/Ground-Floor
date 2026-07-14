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
