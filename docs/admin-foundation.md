# Admin foundation

The secure backend for Open Floor's future admin interaction layer. This phase
ships authorization, operational schema, notifications, an audit log, protected
actions, and a work-queue source — **no dashboard UI** beyond a protected `/admin`
placeholder.

Migrations: `202607210001`–`202607210004`.

## Single-administrator rule

The only account permitted admin access is **`luke.mccutcheon78@gmail.com`**,
enforced on the database/server — never in React.

- `public.approved_admin_email()` — the one place the permitted email lives.
  Changing the admin is a deliberate migration.
- `public.admin_memberships` — server-controlled membership keyed by the auth user
  UUID (the primary admin identity). Written only by `bootstrap_admin()` or a
  trusted service-role context; **no INSERT/UPDATE/DELETE policy** exists, and
  client DML is revoked, so self-promotion is impossible.
- **One active admin max**: partial unique index `admin_memberships_one_active_idx`
  (`(is_active) where is_active`).
- **Identity guard**: the `enforce_admin_identity` trigger rejects any *active*
  membership whose user's `auth.users.email` ≠ `approved_admin_email()` or whose
  email is unverified — so a second/other admin cannot be created even with the
  service role.
- `public.is_admin()` (SECURITY DEFINER, pinned `search_path`, fully-qualified
  `auth.*`) returns true **only** when the caller is authenticated, has an active
  membership, the current auth email equals the approved address, **and** the email
  is verified. It bypasses RLS internally, so policies that call it don't recurse.
  If the approved admin changes their account email, admin access fails until it
  matches again.

The legacy `public.user_roles` table is left intact for data preservation but no
longer confers admin access (`is_admin()` ignores it).

### Future roles

Add a moderator/support role later by a deliberate migration that (a) widens
`admin_memberships.role`'s check, and (b) extends `is_admin()` / adds
`has_permission(...)`. The single-**admin** rule here must remain intact. Suggested
future permission keys (documentation only, not created now):
`admin.dashboard.read`, `admin.company_requests.manage`, `admin.campaigns.manage`,
`admin.questions.moderate`, `admin.reports.manage`, `admin.bugs.manage`,
`admin.support.manage`, `admin.users.manage`, `admin.email.read`,
`admin.audit.read`, `admin.settings.manage`.

## Bootstrap

`public.bootstrap_admin()` (execute revoked from anon/authenticated; granted to
service_role) looks up the approved **verified** account, activates its
membership, and writes an `admin_bootstrap` audit entry. It raises cleanly (no
fabrication) if the account is missing or unverified. Migration `…0001` attempts
it in a `DO` block that **no-ops with a NOTICE** when it can't proceed.

**To bootstrap in production** (after the account exists and has verified its
email), run in the SQL editor / via service role:

```sql
select public.bootstrap_admin();
```

**To revoke** admin access:

```sql
update public.admin_memberships set is_active = false where user_id = '<uuid>';
-- or change approved_admin_email() via migration; is_admin() then fails.
```

## Audit log — `admin_audit_log`

Append-only. RLS: admin **read-only**; no write policies (inserts happen only via
SECURITY DEFINER functions such as `write_admin_audit()` and the protected RPCs);
UPDATE/DELETE are blocked by a trigger and revoked, **even for the service role**.
Deliberately not foreign-keyed, so records survive user/entity deletion. Never
stores passwords, tokens, or secrets. Audited actions: bootstrap, company-request
update/approve, campaign ops, question moderation, report resolution, bug/support
updates.

## Notifications — `admin_notifications`

Admin-only read (+ mark read/dismissed via a column grant). No client INSERT —
rows are created only by `create_admin_notification()` (SECURITY DEFINER), which
is idempotent via a unique `deduplication_key`. `action_path` must be an internal
path. Notification failures can never roll back the user submission that triggered
them (AFTER-trigger calls are wrapped to swallow errors).

Generated for: new company request, new question report, new bug report, new
support ticket, and campaign supporter milestones at **80 % / 90 % / 100 %** of
`supporter_threshold` (emitted once each via per-campaign-per-milestone dedupe
keys). The threshold defaults to **100**, stored centrally in
`public.app_settings` (`default_supporter_threshold`) and per-campaign on
`campaigns.supporter_threshold`.

## Operational workflow fields (internal — never public)

- **company_requests**: `status` (pending/under_review/approved/rejected/duplicate/
  needs_information), `priority`, `admin_notes`, `reviewed_by/at`,
  `rejection_reason`, `duplicate_of_request_id`, `created_company_id`.
- **campaigns**: `operational_status` (active…closed), `supporter_threshold`,
  `threshold_reached_at`, `assigned_admin`, `management_contact_status`,
  `last_outreach_at`, `next_follow_up_at`, `internal_notes`, `risk_status`,
  `closed_reason`. These are **not** in any `public_*` view.
- **questions**: `moderation_status`, `moderated_by/at`, `moderation_reason`.
- New tables: `question_reports`, `bug_reports`, `support_tickets`
  (server-generated `ticket_number`).

## Protected actions (RPCs)

Narrow, validated, `is_admin()`-guarded, audit-writing SECURITY DEFINER functions
(execute granted only to `authenticated`; non-admins get a generic *not
authorized*):

`admin_update_company_request`, `admin_approve_company_request` (atomic: row lock,
concurrency guard, ticker normalization, dedupe vs securities/aliases, create or
connect company, update request, audit, resolve notification),
`admin_update_campaign_ops`, `admin_moderate_question`
(publish/hide/remove/restore/archive; reason required for hide/remove; also flips
`question.status` so public views hide it; original content preserved),
`admin_resolve_report`, `admin_update_bug`, `admin_update_support_ticket`.

## Work queue — `admin_work_queue()`

A guarded SECURITY DEFINER function (not a plain view, so it cannot leak private
rows) unioning pending company requests, near/at-threshold & outreach & stalled
campaigns, unresolved reports, open/critical bugs, and open support tickets.
Highest priority first, then oldest first. Admin-only.

## RLS access matrix

| Table | anon | verified regular user | administrator | service role |
| --- | --- | --- | --- | --- |
| admin_memberships | deny | deny | read | full (RLS-bypass) |
| admin_audit_log | deny | deny | read-only | insert only; no update/delete (trigger) |
| admin_notifications | deny | deny | read + mark read/dismissed | full |
| app_settings | deny | deny (read grant, RLS gates) | read/write | full |
| question_reports | deny | insert own; read own | manage all | full |
| bug_reports | deny | insert own; read own | manage all | full |
| support_tickets | deny | insert own; read own | manage all | full |
| profiles.username | — | set only via `claim_username` | — | full |
| company_requests review fields | — | not modifiable | via RPCs | full |
| campaigns internal fields | not exposed | not exposed | via RPC | full |

Verified live by `npm run verify:admin-security` against a **scratch** project
(needs a service-role key). Existing checks: `verify:core-security`,
`verify:rpc-security`.

## Application integration

- `useMvp().isAdmin` / `adminLoading` — server-verified via the `is_admin()` RPC
  after sign-in.
- `/admin` (`src/pages/admin/AdminPage.tsx`): loading skeleton (no protected-content
  flash) → forbidden/not-found for non-admins / unverified → placeholder for the
  admin. Unauthenticated visitors are redirected to `/login?redirect=/admin`.
- The **Admin** nav item (`AppShell`) appears only when `isAdmin`. Hiding it is a
  convenience, not the boundary.
