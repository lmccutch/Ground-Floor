-- Admin communications: recorded outbound replies, a versioned email attempt /
-- retry model, and a sanitized webhook event log (Prompt 5).
--
-- Additive and forward-only. Nothing is dropped, no existing function signature
-- changes, and the existing send path (record_email_attempt + record_email_event)
-- keeps working byte-for-byte. Specifically:
--
--   * record_email_attempt() is NOT modified. Adding parameters would create an
--     overload and make the deployed Edge Function's named-argument call
--     ambiguous, which would break production email. The reply/retry paths use
--     their own dedicated functions instead.
--   * email_messages gains nullable columns only (all with defaults or NULL), so
--     historical rows and the confirmation/admin-alert flows are unaffected.
--
-- WHAT THIS ENABLES
--   1. The sole administrator can send a recorded reply to a bug reporter or a
--      support requester from the admin console. The recipient is derived
--      SERVER-SIDE from the record — it is never accepted from the browser.
--   2. Every send is one email_messages row. A retry creates a NEW, linked row so
--      the original provider evidence is preserved forever.
--   3. Delivery webhooks are recorded in a small, sanitized event log so
--      "has the webhook been seen recently?" can be answered truthfully instead
--      of assumed.
--
-- SECURITY POSTURE
--   Every function here is SECURITY DEFINER with `search_path = ''` (pinned
--   empty), fully-qualified object references, EXECUTE revoked from public/anon,
--   and an explicit grant to exactly one role. Admin-facing functions verify
--   public.is_admin() themselves; service-role functions are granted to
--   service_role only and are unreachable from a browser.

/* ========================================================================== */
/* 1. shared helpers                                                          */
/* ========================================================================== */

-- Mask an address for operational display: keep the first character of the local
-- part and the full domain (the domain is what an operator actually diagnoses
-- with). Returns NULL for NULL so callers can distinguish "no recipient".
create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then null
    else left(split_part(p_email, '@', 1), 1) || '***@' || split_part(p_email, '@', 2)
  end;
$$;

comment on function public.mask_email(text) is
  'Masks an email address for admin operational display (f***@example.com). Used by the email-history read models so full recipient lists are never returned in bulk.';

-- Strip characters that have no place in a mail header or body. Subjects reject
-- CR/LF outright (header injection); bodies keep newlines and tabs only.
create or replace function public.sanitize_email_header(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(trim(regexp_replace(coalesce(p_text, ''), '[\x00-\x1F\x7F]', ' ', 'g')), '');
$$;

create or replace function public.sanitize_email_body(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  -- Normalize CRLF -> LF, drop every other control character, collapse runs of
  -- more than two blank lines. Never strips ordinary punctuation or markup
  -- characters: the send path escapes for HTML, it does not rely on this.
  select nullif(trim(regexp_replace(
    regexp_replace(replace(coalesce(p_text, ''), E'\r\n', E'\n'), '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g'),
    E'\n{3,}', E'\n\n', 'g')), '');
$$;

comment on function public.sanitize_email_body(text) is
  'Normalizes an administrator-authored reply body: CRLF->LF, removes control characters, collapses excess blank lines. HTML escaping happens in the send Edge Function — administrator-supplied HTML is never rendered as markup.';

-- These three are pure string transforms with no data access, so they are not
-- SECURITY DEFINER. EXECUTE is still revoked from every client role: they are
-- internal helpers, and the SECURITY DEFINER functions that call them run as the
-- owner, so nothing legitimate needs client access to them.
revoke execute on function public.mask_email(text) from public, anon, authenticated;
revoke execute on function public.sanitize_email_header(text) from public, anon, authenticated;
revoke execute on function public.sanitize_email_body(text) from public, anon, authenticated;

/* ========================================================================== */
/* 2. email_messages: attempt versioning + attribution                        */
/* ========================================================================== */

-- attempt_number / retry_of_message_id make retries explicit and auditable:
-- attempt 1 is the original, each retry is a new row pointing back at it. The
-- original row is NEVER rewritten by a retry, so provider evidence (message id,
-- bounce reason, timestamps) survives intact.
alter table public.email_messages add column if not exists attempt_number integer not null default 1;
alter table public.email_messages add column if not exists retry_of_message_id uuid references public.email_messages(id) on delete set null;
-- The administrator who initiated the send. NULL means the system sent it
-- (submitter confirmation, admin alert) — that distinction is shown in the UI.
alter table public.email_messages add column if not exists sending_actor uuid;
-- Link to the durable reply record, when this message is an administrator reply.
alter table public.email_messages add column if not exists reply_id uuid;
-- Sanitized, human-readable failure category for the timeline (distinct from the
-- provider's raw error_code).
alter table public.email_messages add column if not exists failure_category text;

create index if not exists email_messages_retry_of_idx on public.email_messages (retry_of_message_id)
  where retry_of_message_id is not null;
create index if not exists email_messages_created_idx on public.email_messages (created_at desc);

comment on column public.email_messages.attempt_number is
  'Send attempt version. 1 = original; a retry inserts a NEW row with attempt_number = original + 1 and retry_of_message_id set. Retries never overwrite the original row.';

/* ========================================================================== */
/* 3. admin_replies — the durable outbound reply record                       */
/* ========================================================================== */

-- One row per administrator reply, created BEFORE the provider is contacted so a
-- reply is never sent without a record of it. Bodies stored here are the exact
-- sanitized text that is rendered into the email, so the archive and the message
-- can never disagree.
create table if not exists public.admin_replies (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('bug_report', 'support_ticket')),
  entity_id uuid not null,
  subject text not null,
  body_text text not null,
  -- Recipient is derived server-side from the parent record; retained for the
  -- operational archive, and masked by the read models.
  recipient_email text not null,
  recipient_hash text,
  reply_to_alias text not null,
  created_by uuid not null,
  -- Deterministic: reply:<entity_type>:<entity_id>:<client compose token>. The
  -- unique constraint is what makes a double-click or a refresh a no-op.
  idempotency_key text not null unique,
  email_message_id uuid references public.email_messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_replies_entity_idx on public.admin_replies (entity_type, entity_id, created_at desc);

alter table public.admin_replies enable row level security;

-- Admin-only read. No INSERT/UPDATE/DELETE policy exists: rows arrive solely
-- through admin_create_reply() (SECURITY DEFINER).
create policy "admin reads replies" on public.admin_replies
  for select using (public.is_admin());

revoke all on public.admin_replies from anon, authenticated;
grant select on public.admin_replies to authenticated;  -- RLS still restricts to the admin

comment on table public.admin_replies is
  'Durable record of every administrator reply sent from the admin console. Written only by admin_create_reply() (SECURITY DEFINER, is_admin()-guarded). Open Floor has NO inbound email ingestion — recipient replies go to the Workspace alias and do not appear here.';

/* ========================================================================== */
/* 4. email_event_log — sanitized provider event evidence                     */
/* ========================================================================== */

-- Justification for a separate table (Deliverable 3 asked for an explicit
-- decision): email_messages records the CURRENT state of each message, which is
-- enough for the per-message timeline. It cannot answer "has the webhook been
-- delivering at all recently?" — an old delivered_at is indistinguishable from a
-- silently broken webhook, and an event for an unknown message id currently
-- leaves no trace whatsoever. That question is a first-class system-health check,
-- so the evidence has to be recorded. This table is deliberately minimal.
--
-- It stores NO message bodies, NO recipients, NO headers and NO secrets — only
-- the provider's event id (for deduplication), which message it referenced, the
-- event type, and whether we could apply it.
create table if not exists public.email_event_log (
  id uuid primary key default gen_random_uuid(),
  -- Svix message id from the webhook request header. Unique => replayed webhook
  -- deliveries are recorded once.
  provider_event_id text not null unique,
  provider_message_id text,
  event_type text not null,
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  -- applied | ignored_unknown_event | unmatched_message | error
  processing_result text not null
    check (processing_result in ('applied', 'ignored_unknown_event', 'unmatched_message', 'error'))
);

create index if not exists email_event_log_received_idx on public.email_event_log (received_at desc);
create index if not exists email_event_log_message_idx on public.email_event_log (provider_message_id, received_at desc);

alter table public.email_event_log enable row level security;

create policy "admin reads email event log" on public.email_event_log
  for select using (public.is_admin());

revoke all on public.email_event_log from anon, authenticated;
grant select on public.email_event_log to authenticated;  -- RLS still restricts to the admin

comment on table public.email_event_log is
  'Sanitized Resend/Svix delivery-event log. Deduplicated by the provider event id. Never stores message bodies, recipients, headers or signing material — only event type, timing and processing result. Service-role writable, admin readable. Powers the truthful "webhook seen recently" health check.';

-- Service-role recorder called by the resend-webhook Edge Function AFTER the Svix
-- signature has been verified. Deduplicates on the provider event id.
create or replace function public.record_email_event_log(
  p_provider_event_id text,
  p_provider_message_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_processing_result text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if nullif(trim(coalesce(p_provider_event_id, '')), '') is null then
    return false;
  end if;
  insert into public.email_event_log (
    provider_event_id, provider_message_id, event_type, occurred_at, processing_result)
  values (
    left(p_provider_event_id, 200),
    left(p_provider_message_id, 200),
    left(coalesce(p_event_type, 'unknown'), 100),
    p_occurred_at,
    case when p_processing_result in ('applied', 'ignored_unknown_event', 'unmatched_message', 'error')
      then p_processing_result else 'error' end)
  on conflict (provider_event_id) do nothing
  returning id into v_id;
  return v_id is not null;
end;
$$;

revoke execute on function public.record_email_event_log(text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_email_event_log(text, text, text, timestamptz, text) to service_role;

-- Webhook signature-verification failures. Called by the webhook function on a
-- rejected request. Deliberately raises at most ONE notification per hour (the
-- dedup key is bucketed by hour) so an attacker replaying bad signatures cannot
-- flood the admin, and nothing unbounded is written per request.
create or replace function public.record_webhook_verification_failure()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24');
begin
  -- One counter key per hour; only alert once the count crosses the threshold,
  -- so a single stray probe is not treated as an incident.
  if not public.check_login_rate_limit('webhook_verify_fail:' || v_bucket, 5, 3600) then
    perform public.create_admin_notification(
      'webhook_failed',
      'Repeated webhook signature failures',
      'More than 5 Resend webhook deliveries failed signature verification within an hour. Either the signing secret is wrong/rotated, or something is posting to the endpoint. Delivery states will go stale until this is resolved.',
      'high', 'email_webhook', null, '/admin/system',
      'webhook_verify_fail:' || v_bucket);
  end if;
end;
$$;

revoke execute on function public.record_webhook_verification_failure() from public, anon, authenticated;
grant execute on function public.record_webhook_verification_failure() to service_role;

comment on function public.record_webhook_verification_failure() is
  'Counts rejected (unsigned/invalid) webhook deliveries and raises ONE deduplicated high-severity admin notification per hour once more than five occur. Writes no per-request row, so it cannot be used to exhaust storage.';

/* ========================================================================== */
/* 5. admin_create_reply — record then send                                   */
/* ========================================================================== */

-- Creates the durable reply record AND its queued email_messages row in a single
-- transaction, then returns everything the send Edge Function needs. The Edge
-- Function calls this with the ADMINISTRATOR'S JWT, so is_admin() and auth.uid()
-- attribute the action correctly and the audit actor is real.
--
-- Guarantees:
--   * recipient is read from the parent record — a client-supplied address is
--     impossible because there is no parameter for one;
--   * subject/body are sanitized here, and the SANITIZED values are returned, so
--     what is archived is exactly what is sent;
--   * the idempotency key is unique, so a double-click / refresh returns
--     duplicate = true and the caller sends nothing;
--   * an audit entry is written on creation;
--   * the ticket or bug status is NOT changed. Sending a reply is not a
--     resolution, and status changes remain the job of the transition-enforced
--     update RPCs.
create or replace function public.admin_create_reply(
  p_entity_type text,
  p_entity_id uuid,
  p_subject text,
  p_body text,
  p_client_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_subject text;
  v_body text;
  v_recipient text;
  v_alias text;
  v_reference text;
  v_key text;
  v_existing public.admin_replies;
  v_reply public.admin_replies;
  v_msg public.email_messages;
  v_category text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_entity_type not in ('bug_report', 'support_ticket') then
    raise exception 'unsupported reply target' using errcode = 'check_violation';
  end if;
  if nullif(trim(coalesce(p_client_token, '')), '') is null then
    raise exception 'a compose token is required' using errcode = 'check_violation';
  end if;

  v_key := 'reply:' || p_entity_type || ':' || p_entity_id::text || ':' || trim(p_client_token);

  -- Idempotency FIRST: a repeated submission of the same compose session returns
  -- the original reply and instructs the caller not to send again.
  select * into v_existing from public.admin_replies where idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'duplicate', true,
      'reply_id', v_existing.id,
      'email_message_id', v_existing.email_message_id,
      'recipient', v_existing.recipient_email,
      'subject', v_existing.subject,
      'body', v_existing.body_text,
      'reply_to_alias', v_existing.reply_to_alias,
      'idempotency_key', v_existing.idempotency_key);
  end if;

  v_subject := public.sanitize_email_header(p_subject);
  v_body := public.sanitize_email_body(p_body);
  if v_subject is null or char_length(v_subject) < 3 then
    raise exception 'A subject is required.' using errcode = 'check_violation';
  end if;
  if char_length(v_subject) > 200 then
    raise exception 'That subject is too long (200 characters maximum).' using errcode = 'check_violation';
  end if;
  if v_body is null or char_length(v_body) < 10 then
    raise exception 'Please write a reply of at least 10 characters.' using errcode = 'check_violation';
  end if;
  if char_length(v_body) > 5000 then
    raise exception 'That reply is too long (5000 characters maximum).' using errcode = 'check_violation';
  end if;

  -- Recipient + reply-to alias derived from the record. 'alias' is a logical
  -- name; the Edge Function maps it to the configured address so the actual
  -- mailbox is never stored in, or chosen by, the browser.
  if p_entity_type = 'bug_report' then
    select b.reporter_email, 'BUG-' || upper(substr(b.id::text, 1, 8))
      into v_recipient, v_reference
      from public.bug_reports b where b.id = p_entity_id;
    if not found then
      raise exception 'bug report % not found', p_entity_id using errcode = 'no_data_found';
    end if;
    v_alias := 'bugs';
  else
    select t.email, t.ticket_number, t.category
      into v_recipient, v_reference, v_category
      from public.support_tickets t where t.id = p_entity_id;
    if not found then
      raise exception 'support ticket % not found', p_entity_id using errcode = 'no_data_found';
    end if;
    v_alias := case
      when v_category = 'privacy' then 'privacy'
      when v_category in ('technical_support', 'bug', 'company_management') then 'support'
      else 'contact'
    end;
  end if;

  v_recipient := lower(nullif(trim(coalesce(v_recipient, '')), ''));
  if v_recipient is null then
    raise exception 'That record has no email address on file, so there is nobody to reply to.'
      using errcode = 'check_violation';
  end if;
  if char_length(v_recipient) > 254
     or v_recipient !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'The address on that record is not a valid email address.' using errcode = 'check_violation';
  end if;

  -- Rate limit: a burst of replies is always an accident or an abuse of a
  -- compromised session. 20 per hour is far above real operator use.
  if not public.check_login_rate_limit('admin_reply:' || v_uid::text, 20, 3600) then
    raise exception 'Too many replies sent in the last hour. Please wait before sending another.'
      using errcode = 'check_violation';
  end if;

  insert into public.admin_replies (
    entity_type, entity_id, subject, body_text, recipient_email, recipient_hash,
    reply_to_alias, created_by, idempotency_key)
  values (
    p_entity_type, p_entity_id, v_subject, v_body, v_recipient, md5(v_recipient),
    v_alias, v_uid, v_key)
  returning * into v_reply;

  -- The queued attempt. Distinct idempotency key per reply, so two replies to the
  -- same ticket never collide on record_email_attempt's unique key.
  insert into public.email_messages (
    template, recipient_email, recipient_hash, entity_type, entity_id,
    idempotency_key, status, attempt_number, sending_actor, reply_id, attempted_at)
  values (
    'admin_reply', v_recipient, md5(v_recipient), p_entity_type, p_entity_id,
    v_key, 'queued', 1, v_uid, v_reply.id, now())
  returning * into v_msg;

  update public.admin_replies set email_message_id = v_msg.id where id = v_reply.id;

  perform public.write_admin_audit(
    'admin_reply_created', p_entity_type, p_entity_id, null,
    jsonb_build_object(
      'reply_id', v_reply.id,
      'email_message_id', v_msg.id,
      'recipient', public.mask_email(v_recipient),
      'subject', v_subject,
      'body_length', char_length(v_body),
      'reply_to_alias', v_alias),
    'Administrator reply composed', v_key);

  return jsonb_build_object(
    'duplicate', false,
    'reply_id', v_reply.id,
    'email_message_id', v_msg.id,
    'recipient', v_recipient,
    'subject', v_subject,
    'body', v_body,
    'reply_to_alias', v_alias,
    'reference', v_reference,
    'idempotency_key', v_key);
end;
$$;

revoke execute on function public.admin_create_reply(text, uuid, text, text, text) from public, anon;
grant execute on function public.admin_create_reply(text, uuid, text, text, text) to authenticated;

comment on function public.admin_create_reply(text, uuid, text, text, text) is
  'Records an administrator reply and its queued email_messages row atomically, then returns the SANITIZED subject/body plus the server-derived recipient for the send Edge Function. is_admin()-guarded, search_path pinned empty. The recipient can never be supplied by the caller. Idempotent on the compose token: a repeat returns duplicate=true and nothing is sent. Never changes the bug/ticket status.';

/* ========================================================================== */
/* 6. retry eligibility + admin_request_email_retry                           */
/* ========================================================================== */

-- Single source of truth for retry eligibility, used by the retry RPC AND by the
-- read models that decide whether to offer the button, so the UI can never offer
-- something the server will refuse.
--
-- ELIGIBLE
--   failed   — the provider rejected the send or never accepted it.
--   bounced  — ONLY when the recorded error looks transient (a soft bounce:
--              mailbox full, temporarily deferred/unavailable, throttled).
--   delayed  — only after the message has been stuck for over 6 hours.
-- NOT ELIGIBLE, ever
--   delivered   — already delivered; resending is spam.
--   complained  — the recipient marked us as spam. Resending is abuse.
--   suppressed  — provider-level suppression.
--   queued/sent — still in flight.
--   hard bounces (invalid/unknown/no such recipient/blocked/rejected).
--   messages with no connected operational record (entity_id is null).
--   messages older than 30 days (stale operational context).
--   a message that already has a newer attempt (retry the newest, not an old one).
create or replace function public.email_retry_ineligible_reason(p_message_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  m public.email_messages;
  v_reason text;
  v_newer int;
begin
  select * into m from public.email_messages where id = p_message_id;
  if not found then
    return 'This message no longer exists.';
  end if;

  if m.entity_id is null or m.entity_type is null then
    return 'This message is not linked to a bug report or support ticket, so it cannot be retried.';
  end if;
  if m.status = 'delivered' then
    return 'This message was delivered. Sending it again would duplicate it.';
  end if;
  if m.status = 'complained' then
    return 'The recipient reported this message as spam. It must not be sent again.';
  end if;
  if m.status = 'suppressed' then
    return 'The provider has suppressed this recipient.';
  end if;
  if m.status in ('queued', 'sent') then
    return 'This message is still in flight. Wait for a delivery result before retrying.';
  end if;
  if m.status = 'delayed' and m.created_at > now() - interval '6 hours' then
    return 'Delivery is delayed but still within the 6-hour provider window.';
  end if;
  if m.status = 'bounced' then
    v_reason := lower(coalesce(m.error_message_sanitized, '') || ' ' || coalesce(m.error_code, ''));
    -- Only plausibly-temporary bounces may be retried. Anything that reads as a
    -- permanent/invalid-recipient failure is refused.
    if v_reason ~ '(invalid|unknown|no such|does not exist|not exist|blocked|rejected|suppress|spam|abuse|unsubscrib)' then
      return 'This was a permanent bounce (the address is invalid or blocking us). Retrying cannot succeed.';
    end if;
    if v_reason !~ '(mailbox full|over quota|quota|temporar|defer|throttl|rate|try again|busy|greylist|timeout|unavailable)' then
      return 'This bounce is not recorded as temporary, so it is not retryable. Confirm the address with the sender instead.';
    end if;
  end if;
  if m.status not in ('failed', 'bounced', 'delayed') then
    return 'Only failed, temporarily-bounced or long-delayed messages can be retried.';
  end if;
  if m.created_at < now() - interval '30 days' then
    return 'This message is more than 30 days old. Reply fresh instead of retrying it.';
  end if;

  select count(*) into v_newer from public.email_messages where retry_of_message_id = m.id;
  if v_newer > 0 then
    return 'This attempt has already been retried. Use the most recent attempt.';
  end if;

  return null;  -- eligible
end;
$$;

revoke execute on function public.email_retry_ineligible_reason(uuid) from public, anon, authenticated;

comment on function public.email_retry_ineligible_reason(uuid) is
  'Single source of truth for email retry eligibility. Returns NULL when a message may be retried, otherwise the operator-facing reason it may not. Used by both admin_request_email_retry (enforcement) and the email-history read model (so the UI never offers an action the server will refuse).';

-- Creates the retry ATTEMPT. The original row is never touched.
create or replace function public.admin_request_email_retry(
  p_message_id uuid,
  p_client_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  m public.email_messages;
  v_reason text;
  v_key text;
  v_existing public.email_messages;
  v_new public.email_messages;
  v_reply public.admin_replies;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_client_token, '')), '') is null then
    raise exception 'a retry token is required' using errcode = 'check_violation';
  end if;

  v_key := 'retry:' || p_message_id::text || ':' || trim(p_client_token);

  -- Idempotency: the same confirmed retry click never produces two attempts.
  select * into v_existing from public.email_messages where idempotency_key = v_key;
  if found then
    return jsonb_build_object('duplicate', true, 'email_message_id', v_existing.id,
      'recipient', v_existing.recipient_email, 'template', v_existing.template);
  end if;

  -- Lock the original so two concurrent retries cannot both pass the checks.
  select * into m from public.email_messages where id = p_message_id for update;
  if not found then
    raise exception 'message % not found', p_message_id using errcode = 'no_data_found';
  end if;

  v_reason := public.email_retry_ineligible_reason(p_message_id);
  if v_reason is not null then
    raise exception '%', v_reason using errcode = 'check_violation';
  end if;

  -- Rate limit retries independently of replies.
  if not public.check_login_rate_limit('email_retry:' || v_uid::text, 10, 3600) then
    raise exception 'Too many retries in the last hour. Please wait before retrying another message.'
      using errcode = 'check_violation';
  end if;

  insert into public.email_messages (
    template, recipient_email, recipient_hash, entity_type, entity_id,
    idempotency_key, status, attempt_number, retry_of_message_id, sending_actor,
    reply_id, attempted_at)
  values (
    m.template, m.recipient_email, m.recipient_hash, m.entity_type, m.entity_id,
    v_key, 'queued', m.attempt_number + 1, m.id, v_uid, m.reply_id, now())
  returning * into v_new;

  perform public.write_admin_audit(
    'email_retry_requested', 'email_message', m.id,
    jsonb_build_object('status', m.status, 'attempt_number', m.attempt_number,
      'error_code', m.error_code),
    jsonb_build_object('retry_message_id', v_new.id, 'attempt_number', v_new.attempt_number,
      'template', v_new.template, 'recipient', public.mask_email(v_new.recipient_email)),
    'Retry requested for a failed transactional email', v_key);

  -- An administrator reply retry needs the archived body to re-render.
  if v_new.reply_id is not null then
    select * into v_reply from public.admin_replies where id = v_new.reply_id;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'email_message_id', v_new.id,
    'original_message_id', m.id,
    'attempt_number', v_new.attempt_number,
    'template', v_new.template,
    'recipient', v_new.recipient_email,
    'entity_type', v_new.entity_type,
    'entity_id', v_new.entity_id,
    'subject', v_reply.subject,
    'body', v_reply.body_text,
    'reply_to_alias', v_reply.reply_to_alias,
    'idempotency_key', v_key);
end;
$$;

revoke execute on function public.admin_request_email_retry(uuid, text) from public, anon;
grant execute on function public.admin_request_email_retry(uuid, text) to authenticated;

comment on function public.admin_request_email_retry(uuid, text) is
  'Creates a NEW, linked email_messages attempt for an eligible failed/soft-bounced/long-delayed message. The original row is never modified, so provider evidence is preserved. is_admin()-guarded, rate-limited, idempotent on the retry token, audited. Eligibility is decided by email_retry_ineligible_reason().';

/* ========================================================================== */
/* 7. record_email_dispatch_result — the service-role send outcome writer      */
/* ========================================================================== */

-- Applies the provider outcome to ONE specific email_messages row by id (unlike
-- record_email_attempt, which upserts by key and is used by the pre-existing
-- confirmation/alert flow — that function is deliberately left untouched).
-- Writes the audit entry for the reply/retry outcome, attributed to the actor the
-- verified Edge Function passes in.
create or replace function public.record_email_dispatch_result(
  p_message_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_error_message text default null,
  p_failure_category text default null,
  p_actor uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.email_messages;
  v_target text;
  v_action text;
begin
  if p_status not in ('sent', 'failed') then
    return false;  -- only a dispatch outcome; delivery states come from the webhook
  end if;

  select * into m from public.email_messages where id = p_message_id for update;
  if not found then
    return false;
  end if;

  -- Route through the same monotonic transition graph the webhook uses, so a
  -- late dispatch result can never regress a state the webhook already advanced.
  v_target := public.email_next_status(m.status, p_status);

  update public.email_messages
    set status = v_target,
        provider_message_id = coalesce(p_provider_message_id, provider_message_id),
        error_code = case when p_status = 'failed' then coalesce(p_error_code, 'send_failed') else error_code end,
        error_message_sanitized = case when p_status = 'failed' then left(p_error_message, 500) else error_message_sanitized end,
        failure_category = case when p_status = 'failed' then p_failure_category else failure_category end,
        sent_at = coalesce(sent_at, case when v_target = 'sent' then now() end),
        failed_at = coalesce(failed_at, case when v_target = 'failed' then now() end),
        updated_at = now()
    where id = p_message_id;

  -- Audit the outcome under the right action name so the audit log distinguishes
  -- a first send from a retry, and success from failure.
  v_action := case
    when m.retry_of_message_id is not null and p_status = 'sent' then 'email_retry_sent'
    when m.retry_of_message_id is not null then 'email_retry_failed'
    when m.reply_id is not null and p_status = 'sent' then 'admin_reply_sent'
    when m.reply_id is not null then 'admin_reply_failed'
    when p_status = 'sent' then 'email_sent'
    else 'email_send_failed'
  end;

  if p_actor is not null then
    insert into public.admin_audit_log (admin_user_id, action, entity_type, entity_id, before_state, after_state, reason)
    values (p_actor, v_action, 'email_message', p_message_id,
      jsonb_build_object('status', m.status),
      jsonb_build_object('status', v_target, 'template', m.template,
        'recipient', public.mask_email(m.recipient_email),
        'attempt_number', m.attempt_number,
        'error_code', case when p_status = 'failed' then coalesce(p_error_code, 'send_failed') end),
      null);
  end if;

  -- A permanently failed administrator reply is an operational incident: the
  -- person is waiting on an answer that never arrived.
  if p_status = 'failed' then
    perform public.create_admin_notification(
      'email_failed',
      'Email send failed — ' || coalesce(m.template, 'unknown template'),
      'An outgoing message could not be handed to the email provider. Open the related record to review and retry.',
      'high', m.entity_type, m.entity_id,
      case when m.entity_type = 'bug_report' then '/admin/bugs'
           when m.entity_type = 'support_ticket' then '/admin/support'
           else '/admin/system' end,
      'email_dispatch_failed:' || p_message_id::text);
  end if;

  return true;
end;
$$;

revoke execute on function public.record_email_dispatch_result(uuid, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_email_dispatch_result(uuid, text, text, text, text, text, uuid) to service_role;

comment on function public.record_email_dispatch_result(uuid, text, text, text, text, text, uuid) is
  'Applies a provider dispatch outcome (sent/failed) to one email_messages row by id, through the monotonic email_next_status graph, and writes the matching audit entry. service_role only; called by send-transactional-email after the admin JWT has been verified. Does not accept delivery states — those arrive only via the signed webhook.';

/* ========================================================================== */
/* 8. read models: email history + replies for a record                        */
/* ========================================================================== */

create or replace function public.admin_email_history(
  p_entity_type text,
  p_entity_id uuid
)
returns table (
  id uuid,
  template text,
  recipient_masked text,
  status text,
  attempt_number integer,
  retry_of_message_id uuid,
  reply_id uuid,
  sending_actor_name text,
  is_system_send boolean,
  provider_message_id text,
  error_code text,
  failure_category text,
  error_message_sanitized text,
  retry_ineligible_reason text,
  created_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  failed_at timestamptz,
  last_event_at timestamptz,
  event_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  select
    m.id,
    m.template,
    public.mask_email(m.recipient_email),
    m.status,
    m.attempt_number,
    m.retry_of_message_id,
    m.reply_id,
    coalesce(p.display_name, p.username),
    m.sending_actor is null,
    m.provider_message_id,
    m.error_code,
    m.failure_category,
    m.error_message_sanitized,
    public.email_retry_ineligible_reason(m.id),
    m.created_at,
    m.sent_at,
    m.delivered_at,
    m.bounced_at,
    m.complained_at,
    m.failed_at,
    e.last_event_at,
    coalesce(e.event_count, 0)
  from public.email_messages m
  left join public.profiles p on p.id = m.sending_actor
  left join lateral (
    select max(l.received_at) as last_event_at, count(*) as event_count
    from public.email_event_log l
    where l.provider_message_id = m.provider_message_id
      and m.provider_message_id is not null
  ) e on true
  where m.entity_type = p_entity_type and m.entity_id = p_entity_id
  order by m.created_at asc, m.attempt_number asc
  limit 100;
end;
$$;

revoke execute on function public.admin_email_history(text, uuid) from public, anon;
grant execute on function public.admin_email_history(text, uuid) to authenticated;

comment on function public.admin_email_history(text, uuid) is
  'Admin-only email delivery timeline for one bug report or support ticket. Recipients are MASKED (never a full address list). Returns the retry-eligibility decision alongside each attempt so the UI and the server always agree.';

-- Full detail for one record: replies, notifications, audit history and queue
-- state, resolved in SQL. Deliberately an explicit RPC rather than a PostgREST
-- embed — bug_reports/support_tickets each have two FKs to profiles, which makes
-- an embed ambiguous (the PGRST201 failure this codebase already fixed once).
create or replace function public.admin_entity_detail(
  p_entity_type text,
  p_entity_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_replies jsonb;
  v_notifications jsonb;
  v_audit jsonb;
  v_reporter text;
  v_queue jsonb;
  v_attachments jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_entity_type not in ('bug_report', 'support_ticket') then
    raise exception 'unsupported record type' using errcode = 'check_violation';
  end if;

  if p_entity_type = 'bug_report' then
    select public.mask_email(b.reporter_email) into v_reporter
      from public.bug_reports b where b.id = p_entity_id;
  else
    select public.mask_email(t.email) into v_reporter
      from public.support_tickets t where t.id = p_entity_id;
  end if;

  select coalesce(jsonb_agg(src.item order by src.at desc), '[]'::jsonb) into v_replies
  from (
    select jsonb_build_object(
      'id', ar.id,
      'subject', ar.subject,
      'body', ar.body_text,
      'recipient_masked', public.mask_email(ar.recipient_email),
      'reply_to_alias', ar.reply_to_alias,
      'author_name', coalesce(p.display_name, p.username),
      'email_message_id', ar.email_message_id,
      'status', m.status,
      'created_at', ar.created_at) as item,
      ar.created_at as at
    from public.admin_replies ar
    left join public.profiles p on p.id = ar.created_by
    left join public.email_messages m on m.id = ar.email_message_id
    where ar.entity_type = p_entity_type and ar.entity_id = p_entity_id
    order by ar.created_at desc
    limit 50
  ) src;

  select coalesce(jsonb_agg(src.item order by src.at desc), '[]'::jsonb) into v_notifications
  from (
    select jsonb_build_object(
      'id', an.id, 'type', an.type, 'title', an.title, 'severity', an.severity,
      'read_at', an.read_at, 'dismissed_at', an.dismissed_at,
      'created_at', an.created_at) as item,
      an.created_at as at
    from public.admin_notifications an
    where an.entity_type = p_entity_type and an.entity_id = p_entity_id
    order by an.created_at desc
    limit 25
  ) src;

  select coalesce(jsonb_agg(src.item order by src.at desc), '[]'::jsonb) into v_audit
  from (
    select jsonb_build_object(
      'id', al.id, 'action', al.action, 'reason', al.reason,
      'actor_name', coalesce(p.display_name, p.username),
      'created_at', al.created_at) as item,
      al.created_at as at
    from public.admin_audit_log al
    left join public.profiles p on p.id = al.admin_user_id
    where al.entity_type = p_entity_type and al.entity_id = p_entity_id
    order by al.created_at desc
    limit 50
  ) src;

  -- Work-queue state: the shared queue is derived, so report whether this record
  -- currently appears in it rather than inventing a stored state.
  select coalesce(jsonb_agg(src.item), '[]'::jsonb) into v_queue
  from (
    select jsonb_build_object('priority', w.priority, 'reason', w.reason_for_attention,
      'status', w.status, 'updated_at', w.updated_at) as item
    from public.admin_work_queue() w
    where w.item_id = p_entity_id
    limit 1
  ) src;

  -- Attachments exist only for bug reports; the table is created in the
  -- attachments migration, so resolve it dynamically-safe via to_regclass.
  v_attachments := '[]'::jsonb;
  if p_entity_type = 'bug_report' and pg_catalog.to_regclass('public.bug_attachments') is not null then
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'filename', a.original_filename, 'mime_type', a.mime_type,
        'size_bytes', a.size_bytes, 'created_at', a.created_at) order by a.created_at), '[]'::jsonb)
      from public.bug_attachments a where a.bug_report_id = $1
    $q$ into v_attachments using p_entity_id;
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'recipient_masked', v_reporter,
    'replies', v_replies,
    'notifications', v_notifications,
    'audit', v_audit,
    'queue', v_queue,
    'attachments', coalesce(v_attachments, '[]'::jsonb));
end;
$$;

revoke execute on function public.admin_entity_detail(text, uuid) from public, anon;
grant execute on function public.admin_entity_detail(text, uuid) to authenticated;

comment on function public.admin_entity_detail(text, uuid) is
  'Admin-only detail bundle for one bug report or support ticket: recorded replies, related notifications, audit history, work-queue state and attachments. Explicit RPC (not a PostgREST embed) because these tables have two foreign keys to profiles. Reporter addresses are masked.';
