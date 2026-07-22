-- Admin authorization foundation (Phase: admin foundation + password auth).
--
-- Establishes exactly ONE authorized administrator — luke.mccutcheon78@gmail.com —
-- enforced on the database/server layers, never in the browser. Introduces:
--   * approved_admin_email()      — single source of truth for the permitted email
--   * admin_memberships           — server-controlled membership, one active admin max
--   * is_admin()                  — rewritten: authenticated + active + email match + verified
--   * admin_audit_log             — append-only administrative audit trail
--   * admin_notifications         — admin-only, deduplicated notifications
--   * bootstrap_admin()           — controlled activation of the sole admin
--
-- Forward-only. Nothing is dropped and no data is destroyed. The legacy
-- public.user_roles table and its policies are intentionally left in place for
-- data preservation but NO LONGER confer admin access: is_admin() below ignores
-- it entirely. Adding a moderator/support role later is a deliberate future
-- migration (extend admin_memberships.role's check + is_admin()); it must not
-- weaken the single-admin rule enforced here.

/* ----------------------- approved administrator email ---------------------- */

-- The one permitted administrator address, in exactly one place. Changing the
-- authorized administrator is a deliberate, reviewable migration — never a
-- runtime/client operation. Returns a normalized (lowercase) constant so it can
-- be compared directly against auth.users.email.
create or replace function public.approved_admin_email()
returns text
language sql
immutable
set search_path = public
as $$ select 'luke.mccutcheon78@gmail.com'::text $$;

grant execute on function public.approved_admin_email() to anon, authenticated;

/* ---------------------------- admin_memberships ---------------------------- */

-- Server-controlled admin membership keyed by the authenticated user UUID (the
-- primary administrator identity). Only ever written by bootstrap_admin() or a
-- trusted service-role context — never by browser clients (no INSERT/UPDATE/
-- DELETE policy exists, and table DML is revoked from anon/authenticated below).
create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Only 'admin' is permitted in this phase. Future roles are added by a
  -- deliberate migration that widens this check AND is_admin().
  role text not null default 'admin' check (role in ('admin')),
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one ACTIVE administrator across the whole table. Every active row has
-- is_active = true, so a unique index over that partial set permits exactly one.
create unique index if not exists admin_memberships_one_active_idx
  on public.admin_memberships (is_active) where is_active;

create trigger admin_memberships_updated_at before update on public.admin_memberships
  for each row execute function public.set_updated_at();

-- Identity guard: an active membership may belong ONLY to the approved,
-- email-verified account. This blocks activating a membership for any other
-- user even if a row were somehow inserted, and blocks activation before the
-- approved account has verified its email. SECURITY DEFINER so it can read
-- auth.users; search_path pinned and auth.users fully qualified.
create or replace function public.enforce_admin_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_confirmed timestamptz;
begin
  if new.is_active then
    select u.email, u.email_confirmed_at
      into v_email, v_confirmed
      from auth.users u
      where u.id = new.user_id;

    if v_email is distinct from public.approved_admin_email() then
      raise exception 'admin_memberships: only % may hold an active admin membership', public.approved_admin_email()
        using errcode = 'check_violation';
    end if;
    if v_confirmed is null then
      raise exception 'admin_memberships: the admin email must be verified before activation'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_admin_identity() from public;

create trigger admin_memberships_enforce_identity
  before insert or update on public.admin_memberships
  for each row execute function public.enforce_admin_identity();

/* -------------------------------- is_admin() ------------------------------- */

-- Rewritten authorization helper (same name/signature — every existing RLS
-- policy calls public.is_admin()). Returns true ONLY when the caller:
--   * is authenticated (auth.uid() is not null),
--   * has an ACTIVE admin membership keyed by that UUID,
--   * whose current auth email is exactly the approved address, and
--   * whose email is verified.
-- If the approved administrator later changes their account email, admin access
-- fails until it matches again (or the restriction is changed by migration).
--
-- SECURITY DEFINER + pinned search_path + fully-qualified auth.* objects. It
-- reads its own tables as the owner, so it BYPASSES RLS internally — the RLS
-- policy that itself calls is_admin() therefore cannot recurse.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_memberships m
    join auth.users u on u.id = m.user_id
    where m.user_id = auth.uid()
      and m.is_active
      and u.email = public.approved_admin_email()
      and u.email_confirmed_at is not null
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

/* ------------------------------- audit log --------------------------------- */

-- Append-only administrative audit trail. Intentionally NOT foreign-keyed to
-- auth.users or entity tables: an audit record must survive deletion of the
-- user or entity it describes, and must never be mutated by a cascade. Never
-- store passwords, tokens, or secrets in before_state/after_state.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  request_ref text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);

-- Immutability: block any UPDATE or DELETE, for every role including the table
-- owner. Rows are inserted only through SECURITY DEFINER functions.
create or replace function public.admin_audit_log_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'admin_audit_log is append-only; % is not permitted', tg_op
    using errcode = 'restrict_violation';
end;
$$;

revoke execute on function public.admin_audit_log_immutable() from public;

create trigger admin_audit_log_no_update
  before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_immutable();

-- Internal helper used by protected admin RPCs to record an action attributed
-- to the current administrator. Guarded by is_admin() so it can never be used
-- to forge entries as another actor. Not exposed to browser clients.
create or replace function public.write_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb,
  p_reason text default null,
  p_request_ref text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'write_admin_audit: caller is not an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  insert into public.admin_audit_log (admin_user_id, action, entity_type, entity_id, before_state, after_state, reason, request_ref)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason, p_request_ref)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.write_admin_audit(text, text, uuid, jsonb, jsonb, text, text) from public, anon, authenticated;

/* ---------------------------- admin_notifications -------------------------- */

-- Admin-only operational notifications. Only the sole administrator may read
-- them (RLS). Ordinary users cannot create them: there is no INSERT policy and
-- table DML is revoked below — rows arrive only via create_admin_notification()
-- (SECURITY DEFINER), which is called by trusted triggers/RPCs. The unique
-- deduplication_key makes repeated events idempotent.
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'company_request_submitted','campaign_near_threshold','campaign_threshold_reached',
    'question_reported','bug_submitted','support_ticket_created','email_failed',
    'webhook_failed','security_alert'
  )),
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('critical','high','medium','low','info')),
  entity_type text,
  entity_id uuid,
  -- Must be an internal application path (enforced by check: begins with '/').
  action_path text check (action_path is null or action_path like '/%'),
  deduplication_key text not null unique,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_idx on public.admin_notifications (created_at desc) where read_at is null;
create index if not exists admin_notifications_type_idx on public.admin_notifications (type, created_at desc);

-- Idempotent notification creation. ON CONFLICT on the deduplication_key means a
-- repeated event (e.g. the same campaign crossing the same milestone, or a retry
-- of the same submission) never creates a duplicate. Returns the id when a row
-- was created, or null when it already existed. Notification failure must never
-- break the user submission that triggered it, so callers invoke this from
-- AFTER triggers where a raised exception would roll back — therefore this
-- function itself must not raise on the ordinary duplicate path.
create or replace function public.create_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_severity text,
  p_entity_type text,
  p_entity_id uuid,
  p_action_path text,
  p_dedup_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.admin_notifications (type, title, message, severity, entity_type, entity_id, action_path, deduplication_key)
  values (p_type, p_title, p_message, coalesce(p_severity, 'info'), p_entity_type, p_entity_id, p_action_path, p_dedup_key)
  on conflict (deduplication_key) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_admin_notification(text, text, text, text, text, uuid, text, text) from public, anon, authenticated;

/* --------------------------------- bootstrap ------------------------------- */

-- Controlled activation of the sole administrator. Looks up the approved,
-- email-verified account and activates its membership; records an audit entry.
-- Rejects any account that is not the approved address (via the identity
-- trigger) and any attempt while the account is missing or unverified. Not
-- callable by browser clients — execute is revoked from anon/authenticated and
-- granted only to service_role (for the documented controlled operation).
create or replace function public.bootstrap_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_confirmed timestamptz;
begin
  select u.id, u.email_confirmed_at
    into v_uid, v_confirmed
    from auth.users u
    where u.email = public.approved_admin_email()
    order by u.created_at asc
    limit 1;

  if v_uid is null then
    raise exception 'bootstrap_admin: approved admin account (%) does not exist yet', public.approved_admin_email()
      using errcode = 'no_data_found';
  end if;
  if v_confirmed is null then
    raise exception 'bootstrap_admin: approved admin account (%) exists but its email is not verified', public.approved_admin_email()
      using errcode = 'raise_exception';
  end if;

  insert into public.admin_memberships (user_id, role, is_active, created_by)
  values (v_uid, 'admin', true, v_uid)
  on conflict (user_id) do update set is_active = true, updated_at = now();

  insert into public.admin_audit_log (admin_user_id, action, entity_type, entity_id, after_state, reason)
  values (v_uid, 'admin_bootstrap', 'admin_membership', v_uid,
          jsonb_build_object('role', 'admin', 'is_active', true),
          'Activated the sole administrator membership');

  return v_uid;
end;
$$;

revoke execute on function public.bootstrap_admin() from public, anon, authenticated;
grant execute on function public.bootstrap_admin() to service_role;

-- Attempt the bootstrap now, but NEVER fail the migration if the approved
-- account does not yet exist or is not verified — that is expected in fresh
-- environments. When it can't proceed it logs a NOTICE and defers; re-run
-- select public.bootstrap_admin(); (or scripts/bootstrap-admin) after the
-- account exists and has confirmed its email.
do $$
begin
  perform public.bootstrap_admin();
  raise notice 'Admin bootstrap succeeded for %.', public.approved_admin_email();
exception when others then
  raise notice 'Admin bootstrap deferred: %', sqlerrm;
end;
$$;

/* ----------------------------------- RLS ----------------------------------- */

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_notifications enable row level security;

-- admin_memberships: only the administrator may read; nobody may write via the
-- API (no INSERT/UPDATE/DELETE policy). Self-promotion is therefore impossible.
create policy "admin reads memberships" on public.admin_memberships
  for select using (public.is_admin());

-- admin_audit_log: administrator read-only. No write policies (append-only via
-- SECURITY DEFINER functions; update/delete additionally blocked by trigger).
create policy "admin reads audit log" on public.admin_audit_log
  for select using (public.is_admin());

-- admin_notifications: administrator may read, and mark read/dismissed. No
-- INSERT/DELETE policy — rows arrive only via create_admin_notification().
create policy "admin reads notifications" on public.admin_notifications
  for select using (public.is_admin());
create policy "admin updates notification state" on public.admin_notifications
  for update using (public.is_admin()) with check (public.is_admin());

-- Defense in depth on top of RLS: strip the broad default table grants Supabase
-- gives anon/authenticated, then re-grant only what the policies above need.
revoke all on public.admin_memberships from anon, authenticated;
revoke all on public.admin_audit_log from anon, authenticated;
revoke all on public.admin_notifications from anon, authenticated;

grant select on public.admin_memberships to authenticated;
grant select on public.admin_audit_log to authenticated;
grant select on public.admin_notifications to authenticated;
-- Only read_at / dismissed_at are client-updatable; title/message/type stay
-- immutable from the client even for the admin's own rows.
grant update (read_at, dismissed_at) on public.admin_notifications to authenticated;

comment on function public.is_admin() is
  'True only for the authenticated, verified, active sole administrator whose auth email equals approved_admin_email(). SECURITY DEFINER with pinned search_path; bypasses RLS internally so policies calling it do not recurse.';
comment on table public.admin_memberships is
  'Server-controlled admin membership. At most one active row (partial unique index) and it must belong to approved_admin_email() (enforce_admin_identity trigger). Never written by browser clients.';
comment on table public.admin_audit_log is
  'Append-only administrative audit trail. Not FK-linked so records survive user/entity deletion. Never store passwords, tokens, or secrets.';
