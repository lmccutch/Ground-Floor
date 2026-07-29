-- Admin-only system-health read models (Prompt 5, Deliverables 6-8).
--
-- Additive and forward-only.
--
-- DESIGN RULE THAT GOVERNS EVERY FUNCTION HERE
--   A check may only report a state it can PROVE from current data. Anything the
--   database genuinely cannot observe (whether an Edge Function secret is set,
--   whether a function is deployed, whether the deployed intake code still fails
--   closed) is NOT reported here at all — it is left to the admin-system-
--   diagnostics Edge Function, and where even that cannot answer, the UI shows
--   Unknown. Nothing in this file ever converts absence of evidence into health.
--
--   Concretely: "no failures recorded" is returned as a COUNT of zero together
--   with the evidence window, never as a boolean "healthy". The caller decides,
--   using thresholds defined in one place (src/lib/systemHealth.ts).
--
-- SECURITY
--   Every function: SECURITY DEFINER, `search_path = ''` pinned empty, fully
--   qualified references, EXECUTE revoked from public/anon, granted to
--   authenticated only, and gated on public.is_admin() as the first statement.
--   No function returns a secret, a raw webhook payload, a full recipient list or
--   an unsanitized provider error. Recipients, where returned at all, are masked.
--   Each read model is independent so one failing check cannot blank the page.

/* ========================================================================== */
/* 1. system warning acknowledgements                                         */
/* ========================================================================== */

-- Lets the administrator acknowledge a known, understood warning so it stops
-- occupying attention, without ever making the underlying condition report as
-- healthy: the health payload still returns the warning, flagged as
-- acknowledged, and the acknowledgement expires after 24 hours.
create table if not exists public.system_warning_acks (
  warning_key text primary key,
  acknowledged_by uuid not null,
  acknowledged_at timestamptz not null default now(),
  note text
);

alter table public.system_warning_acks enable row level security;

create policy "admin reads system warning acks" on public.system_warning_acks
  for select using (public.is_admin());

revoke all on public.system_warning_acks from anon, authenticated;
grant select on public.system_warning_acks to authenticated;

comment on table public.system_warning_acks is
  'Administrator acknowledgements of system-health warnings. An acknowledgement never suppresses the underlying check — the warning is still returned, marked acknowledged, and the acknowledgement lapses after 24 hours.';

create or replace function public.admin_acknowledge_system_warning(
  p_warning_key text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := left(nullif(trim(coalesce(p_warning_key, '')), ''), 120);
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_key is null then
    raise exception 'a warning key is required' using errcode = 'check_violation';
  end if;

  insert into public.system_warning_acks (warning_key, acknowledged_by, acknowledged_at, note)
  values (v_key, auth.uid(), now(), left(p_note, 500))
  on conflict (warning_key) do update
    set acknowledged_by = auth.uid(), acknowledged_at = now(), note = left(p_note, 500);

  perform public.write_admin_audit(
    'system_warning_acknowledged', 'system_warning', null, null,
    jsonb_build_object('warning_key', v_key, 'expires_at', now() + interval '24 hours'),
    left(p_note, 500), null);

  return jsonb_build_object('warning_key', v_key, 'acknowledged_at', now());
end;
$$;

revoke execute on function public.admin_acknowledge_system_warning(text, text) from public, anon;
grant execute on function public.admin_acknowledge_system_warning(text, text) to authenticated;

/* ========================================================================== */
/* 2. applied migrations (for drift detection)                                */
/* ========================================================================== */

-- Returns the migration versions Supabase has actually applied. The EXPECTED
-- list lives with the source (src/lib/expectedMigrations.ts, kept in sync by a
-- unit test that reads supabase/migrations/), and the client compares the two.
-- Drift is therefore proven from both sides rather than assumed from either.
create or replace function public.admin_applied_migrations()
returns table (version text, applied_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  -- The schema is created by the Supabase CLI. If it is absent (e.g. a database
  -- provisioned another way) return nothing; the caller reports Unknown rather
  -- than inventing a clean bill of health.
  if pg_catalog.to_regclass('supabase_migrations.schema_migrations') is null then
    return;
  end if;
  return query execute
    'select version::text, coalesce(name, version)::text
       from supabase_migrations.schema_migrations order by version';
end;
$$;

revoke execute on function public.admin_applied_migrations() from public, anon;
grant execute on function public.admin_applied_migrations() to authenticated;

/* ========================================================================== */
/* 3. email health                                                            */
/* ========================================================================== */

create or replace function public.admin_get_email_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'total_messages', count(*),
    'last_send_at', max(m.sent_at),
    'last_delivered_at', max(m.delivered_at),
    'failed_24h', count(*) filter (where m.status = 'failed' and m.failed_at > now() - interval '24 hours'),
    'failed_7d', count(*) filter (where m.status = 'failed' and m.failed_at > now() - interval '7 days'),
    'delayed_current', count(*) filter (where m.status = 'delayed'),
    'bounced_7d', count(*) filter (where m.status = 'bounced' and m.bounced_at > now() - interval '7 days'),
    'complained_7d', count(*) filter (where m.status = 'complained' and m.complained_at > now() - interval '7 days'),
    'queued_current', count(*) filter (where m.status = 'queued'),
    -- Stuck: accepted by us but never handed on / never confirmed within an hour.
    'stuck_queued', count(*) filter (where m.status = 'queued' and m.created_at < now() - interval '1 hour'),
    'oldest_unresolved_failure_at', min(m.created_at) filter (where m.status in ('failed', 'bounced')),
    -- Contradictions that indicate a writer bug rather than a delivery problem:
    -- a delivery timestamp with an earlier status, or an adverse timestamp on a
    -- row whose status disagrees.
    'status_inconsistencies', count(*) filter (
      where (m.delivered_at is not null and m.status in ('queued', 'sent', 'delayed'))
         or (m.sent_at is null and m.status in ('sent', 'delivered'))),
    'retry_attempts_total', count(*) filter (where m.retry_of_message_id is not null),
    -- Retry backlog: eligible failures nobody has retried yet.
    'retry_backlog', count(*) filter (
      where m.status in ('failed', 'bounced', 'delayed')
        and m.entity_id is not null
        and m.created_at > now() - interval '30 days'
        and not exists (select 1 from public.email_messages r where r.retry_of_message_id = m.id))
  ) into v
  from public.email_messages m;

  -- Webhook evidence. A NULL last_event_at means we have never recorded an event
  -- — reported as-is so the UI can say "no evidence" instead of "healthy".
  select v || jsonb_build_object(
    'last_webhook_event_at', max(l.received_at),
    'webhook_events_24h', count(*) filter (where l.received_at > now() - interval '24 hours'),
    'webhook_unmatched_24h', count(*) filter (
      where l.received_at > now() - interval '24 hours' and l.processing_result = 'unmatched_message')
  ) into v
  from public.email_event_log l;

  return v;
end;
$$;

revoke execute on function public.admin_get_email_health() from public, anon;
grant execute on function public.admin_get_email_health() to authenticated;

comment on function public.admin_get_email_health() is
  'Admin-only aggregate email delivery health. Counts only — no recipients, bodies, provider payloads or secrets. Reports absence of evidence as NULL/zero with the window, never as a healthy verdict; the caller applies the thresholds in src/lib/systemHealth.ts.';

/* ========================================================================== */
/* 4. public intake health                                                    */
/* ========================================================================== */

create or replace function public.admin_get_intake_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_bugs jsonb;
  v_tickets jsonb;
  v_limits jsonb;
  v_attachments jsonb := jsonb_build_object('supported', false);
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'last_24h', count(*) filter (where created_at > now() - interval '24 hours'),
    'last_7d', count(*) filter (where created_at > now() - interval '7 days'),
    'last_submission_at', max(created_at),
    'unprocessed', count(*) filter (where status = 'new'),
    'oldest_unprocessed_at', min(created_at) filter (where status = 'new')
  ) into v_bugs from public.bug_reports;

  select jsonb_build_object(
    'total', count(*),
    'last_24h', count(*) filter (where created_at > now() - interval '24 hours'),
    'last_7d', count(*) filter (where created_at > now() - interval '7 days'),
    'last_submission_at', max(created_at),
    'unprocessed', count(*) filter (where status = 'new'),
    'oldest_unprocessed_at', min(created_at) filter (where status = 'new'),
    'spam', count(*) filter (where status = 'spam')
  ) into v_tickets from public.support_tickets;

  -- Rate-limit pressure. The limiter stores one row per key with a rolling count;
  -- intake keys are prefixed, so this is a real measure of how often submitters
  -- are being throttled. Captcha rejections happen in the Edge Function BEFORE
  -- any row exists, so they are deliberately NOT inferred here — the intake
  -- section reports captcha rejection tracking as unavailable rather than zero.
  select jsonb_build_object(
    'intake_ip_keys_active', count(*) filter (where l.key like 'intake:ip:%'),
    'intake_submitter_keys_active', count(*) filter (where l.key like 'bug_submit:%' or l.key like 'support_submit:%'),
    'throttled_keys', count(*) filter (
      where (l.key like 'intake:ip:%' and l.count > 12)
         or ((l.key like 'bug_submit:%' or l.key like 'support_submit:%') and l.count > 5)),
    'window_since', min(l.window_start)
  ) into v_limits from public.login_rate_limits l
  where l.window_start > now() - interval '1 hour';

  if pg_catalog.to_regclass('public.bug_attachments') is not null then
    execute $q$
      select jsonb_build_object(
        'supported', true,
        'total', count(*),
        'last_7d', count(*) filter (where created_at > now() - interval '7 days'),
        'bytes_stored', coalesce(sum(size_bytes), 0))
      from public.bug_attachments
    $q$ into v_attachments;
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'bugs', v_bugs,
    'support_tickets', v_tickets,
    'rate_limits', v_limits,
    'attachments', v_attachments,
    -- Stated explicitly so the UI never renders "0 rejections" as a healthy fact.
    'captcha_rejections_tracked', false);
end;
$$;

revoke execute on function public.admin_get_intake_health() from public, anon;
grant execute on function public.admin_get_intake_health() to authenticated;

comment on function public.admin_get_intake_health() is
  'Admin-only public-intake health: submission volumes, unprocessed backlog and rate-limit pressure. Turnstile rejections are rejected in the Edge Function before any row exists, so they are reported as NOT TRACKED rather than as zero.';

/* ========================================================================== */
/* 5. recent operational failures                                             */
/* ========================================================================== */

create or replace function public.admin_get_recent_operational_failures(p_limit integer default 20)
returns table (
  source text,
  occurred_at timestamptz,
  severity text,
  summary text,
  entity_type text,
  entity_id uuid,
  action_path text,
  acknowledged boolean
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
  -- Operational failure notifications, which are already deduplicated at source.
  select
    'notification'::text,
    n.created_at,
    n.severity,
    n.title,
    n.entity_type,
    n.entity_id,
    n.action_path,
    n.dismissed_at is not null
  from public.admin_notifications n
  where n.type in ('email_failed', 'webhook_failed', 'security_alert', 'attachment_failed', 'queue_stale', 'system_warning')
  union all
  -- Failed sends, sanitized. Never the raw provider body.
  select
    'email'::text,
    coalesce(m.failed_at, m.bounced_at, m.updated_at),
    case when m.status = 'complained' then 'high' else 'medium' end,
    'Email ' || m.status || ' — ' || coalesce(m.template, 'unknown')
      || case when m.failure_category is null then '' else ' (' || m.failure_category || ')' end,
    m.entity_type,
    m.entity_id,
    '/admin/system'::text,
    false
  from public.email_messages m
  where m.status in ('failed', 'bounced', 'complained')
    and coalesce(m.failed_at, m.bounced_at, m.updated_at) > now() - interval '7 days'
  order by 2 desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

revoke execute on function public.admin_get_recent_operational_failures(integer) from public, anon;
grant execute on function public.admin_get_recent_operational_failures(integer) to authenticated;

/* ========================================================================== */
/* 6. overall system health                                                   */
/* ========================================================================== */

create or replace function public.admin_get_system_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_db jsonb;
  v_queue jsonb;
  v_ops jsonb;
  v_storage jsonb;
  v_acks jsonb;
  v_rpcs jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Database: reaching this line at all proves the admin read path works, so
  -- 'reachable' is evidence, not an assumption.
  v_db := jsonb_build_object(
    'reachable', true,
    'server_time', now(),
    'default_supporter_threshold',
      (select s.value_int from public.app_settings s where s.key = 'default_supporter_threshold'));

  -- Work-queue backlog straight from the shared queue view used by /admin/queue,
  -- so the numbers here and there can never disagree.
  select jsonb_build_object(
    'open_items', count(*),
    'critical_high', count(*) filter (where w.priority in ('critical', 'urgent', 'high')),
    'oldest_created_at', min(w.created_at),
    'stale_over_7d', count(*) filter (where w.created_at < now() - interval '7 days')
  ) into v_queue from public.admin_work_queue() w;

  select jsonb_build_object(
    'unresolved_bugs', (select count(*) from public.bug_reports
      where status in ('new', 'triaged', 'confirmed', 'in_progress')),
    'open_support_tickets', (select count(*) from public.support_tickets
      where status in ('new', 'open', 'waiting_on_user', 'in_progress')),
    'unhandled_notifications', (select count(*) from public.admin_notifications
      where read_at is null and dismissed_at is null),
    'critical_notifications', (select count(*) from public.admin_notifications
      where dismissed_at is null and severity in ('critical', 'high')),
    'audit_events_24h', (select count(*) from public.admin_audit_log
      where created_at > now() - interval '24 hours'),
    'last_audit_at', (select max(created_at) from public.admin_audit_log)
  ) into v_ops;

  -- Private-bucket invariant. A bucket that is missing is Unknown, not healthy;
  -- a bucket that is public is a CRITICAL finding. If the storage catalogue is
  -- unreadable for any reason we report 'readable: false' — again Unknown, never
  -- a pass.
  begin
    select coalesce(
      (select jsonb_build_object('readable', true, 'exists', true, 'is_public', b.public)
         from storage.buckets b where b.id = 'bug-attachments'),
      jsonb_build_object('readable', true, 'exists', false, 'is_public', null))
    into v_storage;
  exception when others then
    v_storage := jsonb_build_object('readable', false, 'exists', null, 'is_public', null);
  end;

  select coalesce(jsonb_object_agg(a.warning_key,
    jsonb_build_object('acknowledged_at', a.acknowledged_at, 'note', a.note)), '{}'::jsonb)
  into v_acks
  from public.system_warning_acks a
  where a.acknowledged_at > now() - interval '24 hours';

  -- Admin RPC availability, proven by looking the functions up in the catalogue
  -- rather than by assuming a migration ran.
  select coalesce(jsonb_object_agg(x.name, x.present), '{}'::jsonb) into v_rpcs
  from (
    select n.name, pg_catalog.to_regprocedure('public.' || n.name) is not null as present
    from (values
      ('admin_update_bug(uuid,text,text,uuid,text,text,text,text)'),
      ('admin_update_support_ticket(uuid,text,text,uuid,text,text)'),
      ('admin_record_support_response(uuid,text,text)'),
      ('admin_create_reply(text,uuid,text,text,text)'),
      ('admin_request_email_retry(uuid,text)'),
      ('admin_email_history(text,uuid)'),
      ('admin_entity_detail(text,uuid)'),
      ('admin_resolve_attachment(uuid,text)'),
      ('admin_get_email_health()'),
      ('admin_get_intake_health()')
    ) as n(name)
  ) x;

  return jsonb_build_object(
    'generated_at', now(),
    'database', v_db,
    'queue', v_queue,
    'operations', v_ops,
    'storage', v_storage,
    'admin_rpcs', v_rpcs,
    'acknowledged_warnings', v_acks);
end;
$$;

revoke execute on function public.admin_get_system_health() from public, anon;
grant execute on function public.admin_get_system_health() to authenticated;

comment on function public.admin_get_system_health() is
  'Admin-only overall system health: database reachability, work-queue backlog, admin operational counts, the private-attachment-bucket invariant, admin RPC availability (proven from the catalogue) and live warning acknowledgements. Returns evidence and counts; verdicts are computed by src/lib/systemHealth.ts. Contains no secrets.';

/* ========================================================================== */
/* 7. stale queue alerting                                                    */
/* ========================================================================== */

-- Raises ONE deduplicated notification per day when the oldest open work item has
-- been waiting beyond the threshold. Called by the admin console when the system
-- page loads (there is no scheduler in this project), so the alert is created
-- from observed data rather than a guess, and never more than once a day.
create or replace function public.admin_check_queue_staleness(p_threshold_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oldest timestamptz;
  v_count integer;
  v_days integer := greatest(coalesce(p_threshold_days, 7), 1);
  v_created uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select min(w.created_at), count(*) filter (where w.created_at < now() - make_interval(days => v_days))
    into v_oldest, v_count
  from public.admin_work_queue() w;

  if v_count > 0 then
    v_created := public.create_admin_notification(
      'queue_stale',
      v_count || ' work item' || case when v_count = 1 then '' else 's' end || ' waiting over ' || v_days || ' days',
      'The oldest open item in the work queue has been waiting since '
        || to_char(v_oldest at time zone 'utc', 'YYYY-MM-DD') || '. Review the queue.',
      'medium', null, null, '/admin/queue',
      'queue_stale:' || to_char(now() at time zone 'utc', 'YYYY-MM-DD'));
  end if;

  return jsonb_build_object(
    'checked_at', now(),
    'threshold_days', v_days,
    'stale_count', coalesce(v_count, 0),
    'oldest_created_at', v_oldest,
    'notification_created', v_created is not null);
end;
$$;

revoke execute on function public.admin_check_queue_staleness(integer) from public, anon;
grant execute on function public.admin_check_queue_staleness(integer) to authenticated;

comment on function public.admin_check_queue_staleness(integer) is
  'Evaluates work-queue staleness and raises at most ONE notification per calendar day (deduplication key includes the date), so opening the system page repeatedly cannot spam the administrator.';
