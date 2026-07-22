-- Read-only admin action-centre read models (Prompt 2).
--
-- Adds ONLY what the read-only admin UI cannot already query safely:
--   1. An admin-only SELECT policy on profiles, so the admin can resolve author /
--      requester / reporter / submitter display names (regular users still read
--      only their own profile). No secret columns live in profiles.
--   2. A small, coherent set of is_admin()-guarded SECURITY DEFINER read RPCs for
--      data that column grants (202607210006) or auth.users hide from the admin's
--      own role: campaign internal fields, company-request admin notes, user
--      Auth metadata + activity aggregates, overview counts, and a recent-activity
--      feed. These READ existing data only — no new tables, no duplication, no
--      persistence, no mutation.
--
-- Everything else the UI needs (questions, question_reports, bug_reports,
-- support_tickets, admin_notifications, admin_audit_log, app_settings,
-- admin_work_queue()) is already readable by the admin through existing RLS/RPCs.

/* ----------------------- admin reads all public profiles ------------------- */

drop policy if exists "admin reads all profiles" on public.profiles;
create policy "admin reads all profiles" on public.profiles
  for select using (public.is_admin());

/* ------------------------------ overview counts ---------------------------- */

create or replace function public.admin_overview_counts()
returns table (
  open_work_items integer,
  critical_high integer,
  pending_company_requests integer,
  campaigns_near_threshold integer,
  campaigns_at_threshold integer,
  campaigns_outreach_required integer,
  questions_pending_review integer,
  open_question_reports integer,
  open_bug_reports integer,
  new_support_tickets integer,
  unread_notifications integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with camp as (
    select c.operational_status, c.supporter_threshold, coalesce(m.supporters, 0) as supporters
    from public.campaigns c
    left join public.public_campaign_metrics m on m.id = c.id
  )
  select
    (select count(*)::int from public.admin_work_queue()),
    (select count(*)::int from public.admin_work_queue() where priority in ('urgent', 'critical', 'high')),
    (select count(*)::int from public.company_requests where status in ('pending', 'under_review', 'needs_information')),
    (select count(*)::int from camp where supporters >= ceil(0.8 * supporter_threshold) and supporters < supporter_threshold),
    (select count(*)::int from camp where supporter_threshold > 0 and supporters >= supporter_threshold),
    (select count(*)::int from camp where operational_status = 'outreach_required'),
    (select count(*)::int from public.questions where moderation_status = 'pending_review'),
    (select count(*)::int from public.question_reports where status in ('pending', 'reviewing', 'escalated')),
    (select count(*)::int from public.bug_reports where status in ('new', 'triaged', 'confirmed', 'in_progress')),
    (select count(*)::int from public.support_tickets where status in ('new', 'open', 'waiting_on_user', 'in_progress')),
    (select count(*)::int from public.admin_notifications where read_at is null and dismissed_at is null);
end;
$$;

/* ------------------------------- campaigns list ---------------------------- */

create or replace function public.admin_campaigns_list(
  p_band text default null,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  campaign_id uuid,
  company_id uuid,
  company_name text,
  ticker text,
  exchange text,
  public_status text,
  operational_status text,
  supporters integer,
  supporter_threshold integer,
  progress_pct integer,
  band text,
  questions integer,
  reported_questions integer,
  threshold_reached_at timestamptz,
  assigned_admin uuid,
  assigned_admin_name text,
  management_contact_status text,
  last_outreach_at timestamptz,
  next_follow_up_at timestamptz,
  risk_status text,
  internal_notes text,
  closed_reason text,
  launched_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with base as (
    select
      c.id as campaign_id,
      c.company_id,
      coalesce(co.display_name, co.name) as company_name,
      co.ticker,
      co.exchange,
      c.status::text as public_status,
      c.operational_status,
      coalesce(m.supporters, 0) as supporters,
      c.supporter_threshold,
      case when c.supporter_threshold > 0 then floor(100.0 * coalesce(m.supporters, 0) / c.supporter_threshold)::int else 0 end as progress_pct,
      case
        when c.supporter_threshold > 0 and coalesce(m.supporters, 0) >= c.supporter_threshold then 'at'
        when c.supporter_threshold > 0 and coalesce(m.supporters, 0) >= ceil(0.8 * c.supporter_threshold) then 'near'
        when c.operational_status = 'outreach_required' then 'outreach'
        else 'other'
      end as band,
      coalesce(m.questions, 0) as questions,
      (select count(*)::int from public.question_reports qr join public.questions q on q.id = qr.question_id where q.company_id = c.company_id) as reported_questions,
      c.threshold_reached_at,
      c.assigned_admin,
      coalesce(ap.display_name, ap.username) as assigned_admin_name,
      c.management_contact_status,
      c.last_outreach_at,
      c.next_follow_up_at,
      c.risk_status,
      c.internal_notes,
      c.closed_reason,
      c.launched_at,
      c.updated_at
    from public.campaigns c
    join public.companies co on co.id = c.company_id
    left join public.public_campaign_metrics m on m.id = c.id
    left join public.profiles ap on ap.id = c.assigned_admin
  ),
  filtered as (
    select * from base
    where (p_band is null or band = p_band)
      and (p_search is null or company_name ilike '%' || p_search || '%' or ticker ilike '%' || p_search || '%')
  )
  select
    filtered.campaign_id, filtered.company_id, filtered.company_name, filtered.ticker, filtered.exchange,
    filtered.public_status, filtered.operational_status, filtered.supporters, filtered.supporter_threshold,
    filtered.progress_pct, filtered.band, filtered.questions, filtered.reported_questions, filtered.threshold_reached_at,
    filtered.assigned_admin, filtered.assigned_admin_name, filtered.management_contact_status, filtered.last_outreach_at,
    filtered.next_follow_up_at, filtered.risk_status, filtered.internal_notes, filtered.closed_reason, filtered.launched_at,
    filtered.updated_at, count(*) over() as total_count
  from filtered
  order by filtered.progress_pct desc, filtered.updated_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

/* --------------------------- company requests list ------------------------- */

create or replace function public.admin_company_requests_list(
  p_status text default null,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  company_name text,
  ticker text,
  status text,
  priority text,
  requested_by uuid,
  requester_name text,
  created_at timestamptz,
  updated_at timestamptz,
  reviewed_by uuid,
  reviewer_name text,
  reviewed_at timestamptz,
  rejection_reason text,
  admin_notes text,
  duplicate_of_request_id uuid,
  created_company_id uuid,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with base as (
    select
      cr.id, cr.company_name, cr.ticker, cr.status, cr.priority,
      cr.requested_by, coalesce(rp.display_name, rp.username) as requester_name,
      cr.created_at, cr.updated_at,
      cr.reviewed_by, coalesce(vp.display_name, vp.username) as reviewer_name, cr.reviewed_at,
      cr.rejection_reason, cr.admin_notes, cr.duplicate_of_request_id, cr.created_company_id
    from public.company_requests cr
    left join public.profiles rp on rp.id = cr.requested_by
    left join public.profiles vp on vp.id = cr.reviewed_by
  ),
  filtered as (
    select * from base
    where (p_status is null or status = p_status)
      and (p_search is null or company_name ilike '%' || p_search || '%' or ticker ilike '%' || p_search || '%')
  )
  select
    filtered.id, filtered.company_name, filtered.ticker, filtered.status, filtered.priority,
    filtered.requested_by, filtered.requester_name, filtered.created_at, filtered.updated_at,
    filtered.reviewed_by, filtered.reviewer_name, filtered.reviewed_at, filtered.rejection_reason,
    filtered.admin_notes, filtered.duplicate_of_request_id, filtered.created_company_id,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

/* -------------------------------- users list ------------------------------- */

-- Returns operational user info + Auth verification + activity aggregates.
-- Email is never returned (privacy) but may be matched server-side via p_search.
create or replace function public.admin_users_list(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  username text,
  display_name text,
  investor_type text,
  created_at timestamptz,
  email_confirmed boolean,
  last_sign_in_at timestamptz,
  questions_count integer,
  votes_count integer,
  supported_count integer,
  requests_count integer,
  reports_submitted integer,
  bug_reports_count integer,
  support_tickets_count integer,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with base as (
    select
      p.id, p.username, p.display_name, p.investor_type::text as investor_type, p.created_at,
      (u.email_confirmed_at is not null) as email_confirmed, u.last_sign_in_at, u.email as _email,
      (select count(*)::int from public.questions q where q.author_id = p.id) as questions_count,
      (select count(*)::int from public.question_votes v where v.user_id = p.id) as votes_count,
      (select count(*)::int from public.campaign_supporters s where s.user_id = p.id) as supported_count,
      (select count(*)::int from public.company_requests r where r.requested_by = p.id) as requests_count,
      (select count(*)::int from public.question_reports qr where qr.reported_by = p.id) as reports_submitted,
      (select count(*)::int from public.bug_reports b where b.submitted_by = p.id) as bug_reports_count,
      (select count(*)::int from public.support_tickets t where t.submitted_by = p.id) as support_tickets_count
    from public.profiles p
    join auth.users u on u.id = p.id
  ),
  filtered as (
    select * from base
    where p_search is null
      or username ilike '%' || p_search || '%'
      or display_name ilike '%' || p_search || '%'
      or _email ilike '%' || p_search || '%'
  )
  select
    filtered.id, filtered.username, filtered.display_name, filtered.investor_type, filtered.created_at,
    filtered.email_confirmed, filtered.last_sign_in_at, filtered.questions_count, filtered.votes_count,
    filtered.supported_count, filtered.requests_count, filtered.reports_submitted, filtered.bug_reports_count,
    filtered.support_tickets_count, count(*) over() as total_count
  from filtered
  order by filtered.created_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

/* ----------------------------- recent activity ----------------------------- */

-- Honest, typed feed. `source` distinguishes administrator actions, system
-- notifications, and user-generated events — they are never merged into a single
-- misleading claim.
create or replace function public.admin_recent_activity(p_limit integer default 25)
returns table (
  source text,
  at timestamptz,
  title text,
  detail text,
  entity_type text,
  entity_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with items as (
    select 'admin_action'::text as source, a.created_at as at, a.action as title,
           coalesce(a.reason, '') as detail, a.entity_type, a.entity_id
    from public.admin_audit_log a
    union all
    select 'system', n.created_at, n.title, n.message, n.entity_type, n.entity_id
    from public.admin_notifications n
    union all
    select 'user_event', cr.created_at, 'Company request: ' || coalesce(cr.company_name, ''),
           coalesce(cr.ticker, ''), 'company_request', cr.id
    from public.company_requests cr
    union all
    select 'user_event', qr.created_at, 'Question reported', qr.reason, 'question_report', qr.id
    from public.question_reports qr
  )
  select items.source, items.at, items.title, items.detail, items.entity_type, items.entity_id
  from items
  order by items.at desc
  limit greatest(p_limit, 1);
end;
$$;

/* --------------------------------- grants ---------------------------------- */

do $$
declare fn text;
begin
  foreach fn in array array[
    'admin_overview_counts()',
    'admin_campaigns_list(text, text, integer, integer)',
    'admin_company_requests_list(text, text, integer, integer)',
    'admin_users_list(text, integer, integer)',
    'admin_recent_activity(integer)'
  ]
  loop
    execute format('revoke execute on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end;
$$;
