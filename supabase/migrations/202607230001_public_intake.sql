-- Public intake + email-delivery model (Prompt 4).
--
-- Additive, forward-only. Nothing is dropped and no data is modified. Adds:
--   * client_idempotency_key on bug_reports / support_tickets (dedupe retries)
--   * email_messages  — the durable, admin-only email-delivery model
--   * submit_bug_report / submit_support_ticket — PUBLIC submission RPCs
--
-- The submission RPCs are the ONLY intended anon-callable functions here. They are
-- SECURITY DEFINER with an empty search_path and fully-qualified references, do NOT
-- rely on is_admin(), and carry their own strict validation + rate limiting. They
-- reuse the existing insert -> admin_notification triggers (notify_bug_submitted /
-- notify_support_ticket_created) and the existing check_login_rate_limit() backstop,
-- so no second notification or rate-limit system is created. Client-controlled
-- status / severity / priority / assignment / notes / audit fields are impossible:
-- the RPCs set only the safe submission columns and let the server own the rest.

/* ------------------------- idempotency (dedupe retries) -------------------- */

alter table public.bug_reports     add column if not exists client_idempotency_key text;
alter table public.support_tickets add column if not exists client_idempotency_key text;

-- Partial-unique so historical NULL rows are unaffected and a repeated submission
-- token can never create a second record.
create unique index if not exists bug_reports_idempotency_idx
  on public.bug_reports (client_idempotency_key) where client_idempotency_key is not null;
create unique index if not exists support_tickets_idempotency_idx
  on public.support_tickets (client_idempotency_key) where client_idempotency_key is not null;

/* ------------------------------ email_messages ----------------------------- */

-- Durable record of every application email we attempt, plus its provider
-- delivery state (updated by the Resend webhook). Admin-only. Never stores email
-- bodies, tokens, or secrets — only sanitized provider errors.
create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  -- Recipient kept for operational display to the sole admin only; hash lets us
  -- correlate without exposing the address in generic logs.
  recipient_email text,
  recipient_hash text,
  entity_type text,
  entity_id uuid,
  provider text not null default 'resend',
  provider_message_id text,
  -- Stable app-side key: an email is attempted at most once per (template,entity,recipient).
  idempotency_key text not null,
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','delayed','bounced','complained','failed','suppressed')),
  error_code text,
  error_message_sanitized text,
  attempted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

-- Provider event/message ids are unique so webhook replays are idempotent.
create unique index if not exists email_messages_provider_msg_idx
  on public.email_messages (provider_message_id) where provider_message_id is not null;
create index if not exists email_messages_entity_idx on public.email_messages (entity_type, entity_id);
create index if not exists email_messages_status_idx on public.email_messages (status, created_at desc);

create trigger email_messages_updated_at before update on public.email_messages
  for each row execute function public.set_updated_at();

alter table public.email_messages enable row level security;

-- Admin-only read. Rows are written exclusively by SECURITY DEFINER functions
-- (record_email_attempt / the webhook via service role) — there is no client
-- INSERT/UPDATE policy, and DML is stripped from anon/authenticated below.
create policy "admin reads email messages" on public.email_messages
  for select using (public.is_admin());

revoke all on public.email_messages from anon, authenticated;
grant select on public.email_messages to authenticated;  -- RLS still restricts rows to the admin

/* --------------------- internal helper: record an attempt ------------------ */

-- Called by the send-transactional-email Edge Function (via service role) and by
-- admin-triggered sends. Upserts on the app idempotency key so a retry of the same
-- logical email reuses one row. Not callable by browser clients.
create or replace function public.record_email_attempt(
  p_template text,
  p_recipient_email text,
  p_entity_type text,
  p_entity_id uuid,
  p_idempotency_key text,
  p_status text default 'queued',
  p_provider_message_id text default null,
  p_error_code text default null,
  p_error_message text default null
)
returns public.email_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.email_messages;
begin
  insert into public.email_messages (
    template, recipient_email, recipient_hash, entity_type, entity_id, idempotency_key,
    status, provider_message_id, error_code, error_message_sanitized,
    attempted_at, sent_at, failed_at)
  values (
    p_template,
    p_recipient_email,
    case when p_recipient_email is null then null else md5(lower(p_recipient_email)) end,
    p_entity_type, p_entity_id, p_idempotency_key,
    coalesce(p_status, 'queued'), p_provider_message_id, p_error_code, left(p_error_message, 500),
    now(),
    case when p_status = 'sent' then now() else null end,
    case when p_status = 'failed' then now() else null end)
  on conflict (idempotency_key) do update
    set status = excluded.status,
        provider_message_id = coalesce(excluded.provider_message_id, public.email_messages.provider_message_id),
        error_code = excluded.error_code,
        error_message_sanitized = excluded.error_message_sanitized,
        sent_at = coalesce(public.email_messages.sent_at, case when excluded.status = 'sent' then now() else null end),
        failed_at = coalesce(public.email_messages.failed_at, case when excluded.status = 'failed' then now() else null end),
        updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.record_email_attempt(text, text, text, uuid, text, text, text, text, text) from public, anon, authenticated;

/* ----------------------------- shared validation --------------------------- */

-- A restrictive control-character check reused by both submission RPCs. Rejects
-- C0 control chars except tab/newline/carriage-return.
create or replace function public.intake_has_control_chars(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$ select p ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'; $$;

/* ---------------------------- submit_bug_report ---------------------------- */

create or replace function public.submit_bug_report(
  p_description text,
  p_steps_to_reproduce text default null,
  p_expected_result text default null,
  p_actual_result text default null,
  p_reporter_email text default null,
  p_page_url text default null,
  p_browser text default null,
  p_operating_system text default null,
  p_device_type text default null,
  p_screen_size text default null,
  p_app_version text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(nullif(trim(p_reporter_email), ''));
  v_desc text := trim(p_description);
  v_rate_key text;
  v_id uuid;
  v_existing public.bug_reports;
begin
  -- Idempotency first: a repeated token returns the original record and creates
  -- no new row and no new notification.
  if nullif(trim(p_idempotency_key), '') is not null then
    select * into v_existing from public.bug_reports where client_idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('id', v_existing.id, 'reference', 'BUG-' || upper(substr(v_existing.id::text, 1, 8)), 'duplicate', true);
    end if;
  end if;

  -- Validation (generic, user-safe messages).
  if v_desc is null or char_length(v_desc) < 10 then
    raise exception 'Please describe the problem in a little more detail (at least 10 characters).' using errcode = 'check_violation';
  end if;
  if char_length(v_desc) > 5000 then
    raise exception 'That description is too long.' using errcode = 'check_violation';
  end if;
  if public.intake_has_control_chars(v_desc) then
    raise exception 'The description contains characters we can''t accept.' using errcode = 'check_violation';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'That email address does not look valid.' using errcode = 'check_violation';
  end if;

  -- Rate limit: per-user when signed in, else per-email, else a coarse anonymous
  -- backstop (the Edge Function additionally rate-limits by IP). 5 per hour.
  v_rate_key := 'bug_submit:' || coalesce(v_uid::text, case when v_email is null then 'anon' else 'email:' || v_email end);
  if not public.check_login_rate_limit(v_rate_key, 5, 3600) then
    raise exception 'You have submitted several reports recently. Please wait a while before submitting another.' using errcode = 'check_violation';
  end if;

  -- Server owns every non-submission column (status/severity/assignment/notes are
  -- never accepted from the client). The insert trigger raises the admin notification.
  insert into public.bug_reports (
    submitted_by, reporter_email, description, steps_to_reproduce, expected_result,
    actual_result, page_url, browser, operating_system, device_type, screen_size,
    app_version, client_idempotency_key)
  values (
    v_uid, v_email, v_desc,
    left(nullif(trim(p_steps_to_reproduce), ''), 5000),
    left(nullif(trim(p_expected_result), ''), 2000),
    left(nullif(trim(p_actual_result), ''), 2000),
    left(nullif(trim(p_page_url), ''), 2000),
    left(nullif(trim(p_browser), ''), 200),
    left(nullif(trim(p_operating_system), ''), 200),
    left(nullif(trim(p_device_type), ''), 100),
    left(nullif(trim(p_screen_size), ''), 50),
    left(nullif(trim(p_app_version), ''), 100),
    nullif(trim(p_idempotency_key), ''))
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'reference', 'BUG-' || upper(substr(v_id::text, 1, 8)), 'duplicate', false);
end;
$$;

revoke execute on function public.submit_bug_report(text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_bug_report(text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

/* -------------------------- submit_support_ticket -------------------------- */

create or replace function public.submit_support_ticket(
  p_category text,
  p_message text,
  p_subject text default null,
  p_name text default null,
  p_email text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(nullif(trim(p_email), ''));
  v_msg text := trim(p_message);
  v_rate_key text;
  v_row public.support_tickets;
  v_existing public.support_tickets;
begin
  if nullif(trim(p_idempotency_key), '') is not null then
    select * into v_existing from public.support_tickets where client_idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('id', v_existing.id, 'ticket_number', v_existing.ticket_number, 'duplicate', true);
    end if;
  end if;

  -- Category must be one of the production values (mirror the table CHECK for a
  -- friendly error rather than a raw constraint violation).
  if p_category is null or p_category not in (
    'general','company_request','technical_support','bug','privacy','partnership',
    'company_management','media','legal','other') then
    raise exception 'Please choose a valid category.' using errcode = 'check_violation';
  end if;
  if v_msg is null or char_length(v_msg) < 10 then
    raise exception 'Please add a little more detail to your message (at least 10 characters).' using errcode = 'check_violation';
  end if;
  if char_length(v_msg) > 5000 then
    raise exception 'That message is too long.' using errcode = 'check_violation';
  end if;
  if public.intake_has_control_chars(v_msg) then
    raise exception 'The message contains characters we can''t accept.' using errcode = 'check_violation';
  end if;
  -- An email is required for anonymous submissions so we can respond.
  if v_uid is null and v_email is null then
    raise exception 'Please provide an email address so we can reply.' using errcode = 'check_violation';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'That email address does not look valid.' using errcode = 'check_violation';
  end if;

  v_rate_key := 'support_submit:' || coalesce(v_uid::text, case when v_email is null then 'anon' else 'email:' || v_email end);
  if not public.check_login_rate_limit(v_rate_key, 5, 3600) then
    raise exception 'You have submitted several requests recently. Please wait a while before submitting another.' using errcode = 'check_violation';
  end if;

  -- ticket_number is generated server-side by the existing trigger; priority /
  -- status / assignment / notes are server-owned. Insert trigger notifies the admin.
  insert into public.support_tickets (
    category, message, subject, name, email, submitted_by, client_idempotency_key, ticket_number)
  values (
    p_category, v_msg,
    left(nullif(trim(p_subject), ''), 200),
    left(nullif(trim(p_name), ''), 200),
    v_email, v_uid, nullif(trim(p_idempotency_key), ''),
    'PENDING')  -- overwritten by set_support_ticket_number before insert
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'ticket_number', v_row.ticket_number, 'duplicate', false);
end;
$$;

revoke execute on function public.submit_support_ticket(text, text, text, text, text, text) from public;
grant execute on function public.submit_support_ticket(text, text, text, text, text, text) to anon, authenticated;

comment on function public.submit_bug_report(text, text, text, text, text, text, text, text, text, text, text, text) is
  'Public bug intake. SECURITY DEFINER, search_path=empty, anon+authenticated. Server owns status/severity/assignment; validates + rate-limits + dedupes; the insert trigger raises the admin notification. Never trusts a client-supplied user id (uses auth.uid()).';
comment on function public.submit_support_ticket(text, text, text, text, text, text) is
  'Public support/contact intake. SECURITY DEFINER, search_path=empty, anon+authenticated. Generates the ticket number server-side; validates category/message/email; rate-limits + dedupes; the insert trigger raises the admin notification.';
comment on table public.email_messages is
  'Durable, admin-only application-email delivery model. Written only by SECURITY DEFINER functions / the Resend webhook (service role). Stores sanitized provider errors only — never bodies, tokens, or secrets.';
