-- Protected administrative actions + work-queue source (Phase: admin foundation).
--
-- Narrow, validated, is_admin()-guarded SECURITY DEFINER RPCs — never broad
-- arbitrary-column updaters. Every mutation writes an admin_audit_log entry via
-- write_admin_audit(). Company approval is atomic (row lock + concurrency guard).
-- The admin work queue is exposed as a guarded SECURITY DEFINER function (NOT a
-- plain view) so it cannot leak private rows to non-admins.

/* --------------------------- company requests ------------------------------ */

create or replace function public.admin_update_company_request(
  p_request_id uuid,
  p_status text default null,
  p_priority text default null,
  p_admin_notes text default null,
  p_rejection_reason text default null,
  p_reason text default null
)
returns public.company_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.company_requests;
  v_after public.company_requests;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.company_requests where id = p_request_id for update;
  if not found then
    raise exception 'company request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  update public.company_requests
    set status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        rejection_reason = coalesce(p_rejection_reason, rejection_reason),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_request_id
    returning * into v_after;

  perform public.write_admin_audit('company_request_update', 'company_request', p_request_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

-- Atomic approval: re-checks eligibility under a row lock, normalizes the ticker,
-- dedupes against existing securities and former-ticker aliases, creates or
-- connects the company, updates the request, audits, and resolves the request's
-- admin notification. Concurrency-safe: a second concurrent approval sees the
-- already-approved state and returns it instead of creating a duplicate company.
create or replace function public.admin_approve_company_request(
  p_request_id uuid,
  p_exchange text default 'NASDAQ',
  p_sector text default 'Unknown',
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.company_requests;
  v_norm text;
  v_company_id uuid;
  v_security_id uuid;
  v_created boolean := false;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_req from public.company_requests where id = p_request_id for update;
  if not found then
    raise exception 'company request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  -- Idempotent / concurrency guard.
  if v_req.status = 'approved' and v_req.created_company_id is not null then
    return jsonb_build_object('request_id', p_request_id, 'company_id', v_req.created_company_id, 'created', false, 'already_approved', true);
  end if;
  if v_req.status not in ('pending', 'under_review', 'needs_information') then
    raise exception 'company request % is not approvable (status=%).', p_request_id, v_req.status using errcode = 'check_violation';
  end if;

  v_norm := upper(regexp_replace(trim(v_req.ticker), '[-/]', '.', 'g'));

  -- Match an existing company by active security symbol, then by former-ticker alias.
  select s.company_id into v_company_id
    from public.securities s where s.is_active and s.normalized_symbol = v_norm limit 1;
  if v_company_id is null then
    select a.company_id into v_company_id
      from public.company_aliases a
      where a.alias_type = 'former_ticker' and a.normalized_alias = v_norm limit 1;
  end if;

  if v_company_id is null then
    v_company_id := gen_random_uuid();
    insert into public.companies (id, name, ticker, exchange, sector, legal_name, display_name, slug, metadata_source)
    values (
      v_company_id, v_req.company_name, v_req.ticker, p_exchange, p_sector,
      v_req.company_name, v_req.company_name,
      lower(regexp_replace(regexp_replace(v_req.company_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substr(v_company_id::text, 1, 6),
      'admin_request'
    );
    insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, source)
    values (v_company_id, v_req.ticker, v_norm, p_exchange, true, true, 'admin_request')
    returning id into v_security_id;
    update public.companies set primary_security_id = v_security_id where id = v_company_id;
    v_created := true;
  end if;

  update public.company_requests
    set status = 'approved', created_company_id = v_company_id, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_request_id;

  perform public.write_admin_audit('company_request_approve', 'company_request', p_request_id,
    to_jsonb(v_req), jsonb_build_object('company_id', v_company_id, 'created', v_created), p_reason, null);

  update public.admin_notifications set dismissed_at = coalesce(dismissed_at, now())
    where deduplication_key = 'company_request:' || p_request_id;

  return jsonb_build_object('request_id', p_request_id, 'company_id', v_company_id, 'created', v_created);
end;
$$;

/* ---------------------------- campaign operations -------------------------- */

create or replace function public.admin_update_campaign_ops(
  p_campaign_id uuid,
  p_operational_status text default null,
  p_assigned_admin uuid default null,
  p_management_contact_status text default null,
  p_internal_notes text default null,
  p_risk_status text default null,
  p_next_follow_up_at timestamptz default null,
  p_supporter_threshold integer default null,
  p_closed_reason text default null,
  p_reason text default null
)
returns public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.campaigns;
  v_after public.campaigns;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign % not found', p_campaign_id using errcode = 'no_data_found';
  end if;

  update public.campaigns
    set operational_status = coalesce(p_operational_status, operational_status),
        assigned_admin = coalesce(p_assigned_admin, assigned_admin),
        management_contact_status = coalesce(p_management_contact_status, management_contact_status),
        internal_notes = coalesce(p_internal_notes, internal_notes),
        risk_status = coalesce(p_risk_status, risk_status),
        next_follow_up_at = coalesce(p_next_follow_up_at, next_follow_up_at),
        supporter_threshold = coalesce(p_supporter_threshold, supporter_threshold),
        closed_reason = coalesce(p_closed_reason, closed_reason),
        last_outreach_at = case when p_operational_status = 'outreach_started' then now() else last_outreach_at end
    where id = p_campaign_id
    returning * into v_after;

  perform public.write_admin_audit('campaign_ops_update', 'campaign', p_campaign_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ---------------------------- question moderation -------------------------- */

create or replace function public.admin_moderate_question(
  p_question_id uuid,
  p_action text,
  p_reason text default null
)
returns public.questions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.questions;
  v_after public.questions;
  v_new_mod text;
  v_new_status public.question_status;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action not in ('publish', 'hide', 'remove', 'restore', 'archive') then
    raise exception 'unknown moderation action: %', p_action using errcode = 'check_violation';
  end if;
  -- Destructive actions require a reason.
  if p_action in ('hide', 'remove') and coalesce(trim(p_reason), '') = '' then
    raise exception 'a reason is required to % a question', p_action using errcode = 'check_violation';
  end if;

  select * into v_before from public.questions where id = p_question_id for update;
  if not found then
    raise exception 'question % not found', p_question_id using errcode = 'no_data_found';
  end if;

  -- Map the moderation action to the new moderation_status and the existing
  -- question.status enum (which the public views/RLS actually key off, so a
  -- hidden/removed question really disappears from public reads). Original
  -- content is never deleted — only the status changes.
  case p_action
    when 'publish' then v_new_mod := 'published'; v_new_status := 'Open';
    when 'hide'    then v_new_mod := 'hidden';    v_new_status := 'Archived';
    when 'remove'  then v_new_mod := 'removed';   v_new_status := 'Archived';
    when 'restore' then v_new_mod := 'restored';  v_new_status := 'Open';
    when 'archive' then v_new_mod := 'archived';  v_new_status := 'Archived';
  end case;

  update public.questions
    set moderation_status = v_new_mod,
        status = v_new_status,
        moderated_by = auth.uid(),
        moderated_at = now(),
        moderation_reason = p_reason
    where id = p_question_id
    returning * into v_after;

  perform public.write_admin_audit('question_moderate', 'question', p_question_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ---------------------------- report resolution ---------------------------- */

create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_action text,
  p_resolution text default null,
  p_reason text default null
)
returns public.question_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.question_reports;
  v_after public.question_reports;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action not in ('dismiss', 'confirm', 'hide_question', 'remove_question', 'escalate') then
    raise exception 'unknown report action: %', p_action using errcode = 'check_violation';
  end if;

  select * into v_before from public.question_reports where id = p_report_id for update;
  if not found then
    raise exception 'report % not found', p_report_id using errcode = 'no_data_found';
  end if;

  -- Keep report and question state consistent.
  if p_action = 'hide_question' then
    perform public.admin_moderate_question(v_before.question_id, 'hide', coalesce(p_reason, 'Report resolved: hidden'));
  elsif p_action = 'remove_question' then
    perform public.admin_moderate_question(v_before.question_id, 'remove', coalesce(p_reason, 'Report resolved: removed'));
  end if;

  v_status := case p_action
    when 'dismiss' then 'dismissed'
    when 'escalate' then 'escalated'
    else 'action_taken'
  end;

  update public.question_reports
    set status = v_status,
        resolution = coalesce(p_resolution, resolution),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_report_id
    returning * into v_after;

  perform public.write_admin_audit('report_resolve', 'question_report', p_report_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);

  update public.admin_notifications set dismissed_at = coalesce(dismissed_at, now())
    where deduplication_key = 'question_report:' || p_report_id;
  return v_after;
end;
$$;

/* ---------------------------- bug + support triage ------------------------- */

create or replace function public.admin_update_bug(
  p_bug_id uuid,
  p_status text default null,
  p_severity text default null,
  p_assigned_to uuid default null,
  p_admin_notes text default null,
  p_linked_issue_url text default null,
  p_fixed_commit text default null,
  p_reason text default null
)
returns public.bug_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.bug_reports;
  v_after public.bug_reports;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_before from public.bug_reports where id = p_bug_id for update;
  if not found then
    raise exception 'bug report % not found', p_bug_id using errcode = 'no_data_found';
  end if;

  update public.bug_reports
    set status = coalesce(p_status, status),
        severity = coalesce(p_severity, severity),
        assigned_to = coalesce(p_assigned_to, assigned_to),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        linked_issue_url = coalesce(p_linked_issue_url, linked_issue_url),
        fixed_commit = coalesce(p_fixed_commit, fixed_commit),
        resolved_at = case when coalesce(p_status, status) in ('fixed', 'deployed', 'closed') then coalesce(resolved_at, now()) else resolved_at end
    where id = p_bug_id
    returning * into v_after;

  perform public.write_admin_audit('bug_update', 'bug_report', p_bug_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status text default null,
  p_priority text default null,
  p_assigned_to uuid default null,
  p_admin_notes text default null,
  p_reason text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.support_tickets;
  v_after public.support_tickets;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_before from public.support_tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'support ticket % not found', p_ticket_id using errcode = 'no_data_found';
  end if;

  update public.support_tickets
    set status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        assigned_to = coalesce(p_assigned_to, assigned_to),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        resolved_at = case when coalesce(p_status, status) in ('resolved', 'closed') then coalesce(resolved_at, now()) else resolved_at end
    where id = p_ticket_id
    returning * into v_after;

  perform public.write_admin_audit('support_ticket_update', 'support_ticket', p_ticket_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ------------------------------- work queue -------------------------------- */

-- Normalized source for the future /admin action centre. A guarded SECURITY
-- DEFINER function (not a view) so private rows can never leak to non-admins.
-- Highest priority first, then oldest first. No browser-side merging of tables.
create or replace function public.admin_work_queue()
returns table (
  item_type text,
  item_id uuid,
  title text,
  summary text,
  priority text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  entity_path text,
  reason_for_attention text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  with items as (
    select
      'company_request'::text as item_type,
      cr.id as item_id,
      (coalesce(cr.company_name, 'Unknown') || ' (' || coalesce(cr.ticker, '?') || ')')::text as title,
      'Pending company request'::text as summary,
      cr.priority::text as priority,
      cr.status::text as status,
      cr.created_at,
      cr.updated_at,
      ('/admin/company-requests/' || cr.id)::text as entity_path,
      'Company request awaiting review'::text as reason_for_attention
    from public.company_requests cr
    where cr.status in ('pending', 'under_review', 'needs_information')

    union all
    select
      'campaign', ca.id, coalesce(co.display_name, co.name),
      'Campaign operational status: ' || ca.operational_status,
      case ca.operational_status when 'threshold_reached' then 'high' when 'stalled' then 'high' else 'normal' end,
      ca.operational_status, ca.created_at, ca.updated_at,
      '/admin/campaigns/' || ca.id, 'Campaign needs operational attention'
    from public.campaigns ca
    join public.companies co on co.id = ca.company_id
    where ca.operational_status in ('near_threshold', 'threshold_reached', 'outreach_required', 'stalled')

    union all
    select
      'question_report', qr.id, 'Reported question', 'Report reason: ' || qr.reason,
      'high', qr.status, qr.created_at, qr.updated_at,
      '/admin/reports/' || qr.id, 'Unresolved question report'
    from public.question_reports qr
    where qr.status in ('pending', 'reviewing', 'escalated')

    union all
    select
      'bug_report', b.id, left(b.description, 80), 'Severity: ' || coalesce(b.severity, 'unspecified'),
      coalesce(b.severity, 'normal'), b.status, b.created_at, b.updated_at,
      '/admin/bugs/' || b.id, 'Open bug report'
    from public.bug_reports b
    where b.status in ('new', 'triaged', 'confirmed', 'in_progress')

    union all
    select
      'support_ticket', t.id, coalesce(t.subject, t.category), 'Category: ' || t.category,
      t.priority, t.status, t.created_at, t.updated_at,
      '/admin/support/' || t.id, 'Open support ticket'
    from public.support_tickets t
    where t.status in ('new', 'open', 'waiting_on_user', 'in_progress')
  )
  -- Columns are qualified with the CTE alias so they resolve to query columns and
  -- never to the identically-named RETURNS TABLE output parameters.
  select
    items.item_type, items.item_id, items.title, items.summary, items.priority,
    items.status, items.created_at, items.updated_at, items.entity_path, items.reason_for_attention
  from items
  order by
    case items.priority
      when 'urgent' then 0 when 'critical' then 0
      when 'high' then 1
      when 'normal' then 2 when 'medium' then 2
      when 'low' then 3
      else 2
    end asc,
    items.created_at asc;
end;
$$;

/* --------------------------------- grants ---------------------------------- */

-- Every protected action is guarded by is_admin() internally; a non-admin caller
-- receives a generic 'not authorized'. Execute is granted only to authenticated
-- (never anon/public).
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'admin_update_company_request(uuid, text, text, text, text, text)',
    'admin_approve_company_request(uuid, text, text, text)',
    'admin_update_campaign_ops(uuid, text, uuid, text, text, text, timestamptz, integer, text, text)',
    'admin_moderate_question(uuid, text, text)',
    'admin_resolve_report(uuid, text, text, text)',
    'admin_update_bug(uuid, text, text, uuid, text, text, text, text)',
    'admin_update_support_ticket(uuid, text, text, uuid, text, text)',
    'admin_work_queue()'
  ]
  loop
    execute format('revoke execute on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end;
$$;
