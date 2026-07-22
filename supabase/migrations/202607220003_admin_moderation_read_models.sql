-- Read-only admin read models for the moderation/support domains (Prompt 2 fix).
--
-- Root cause fixed here: the admin Questions/Reports/Bugs/Support pages queried
-- their tables directly through PostgREST and embedded public.profiles for author/
-- reporter/submitter names. Each of those tables has TWO foreign keys to profiles
-- (questions: author_id + moderated_by; question_reports: reported_by + reviewed_by;
-- bug_reports: submitted_by + assigned_to; support_tickets: submitted_by +
-- assigned_to), so PostgREST cannot disambiguate the embed and returns HTTP 300
-- PGRST201 ("Could not embed because more than one relationship was found"). The
-- pages surfaced this as "We could not load this data."
--
-- The coherent fix — matching the existing admin_campaigns_list / admin_users_list
-- read models — is a narrow is_admin()-guarded read RPC per domain that resolves
-- the correct FK in SQL and returns exactly the fields the admin UI needs, with
-- server-side search, filters, stable sort, pagination and a reliable total count.
-- READ-ONLY: no writes, no status changes, no notification reads. No new tables.

/* ------------------------------ questions list ----------------------------- */

create or replace function public.admin_questions_list(
  p_moderation_status text default null,
  p_company_id uuid default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  question_text text,
  topic text,
  status text,
  moderation_status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_anonymous boolean,
  company_id uuid,
  company_name text,
  ticker text,
  author_name text,
  votes integer,
  report_count integer,
  moderated_by uuid,
  moderated_by_name text,
  moderated_at timestamptz,
  moderation_reason text,
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
      q.id,
      q.question_text::text as question_text,
      q.topic,
      q.status::text as status,
      q.moderation_status,
      q.created_at,
      q.updated_at,
      q.is_anonymous,
      q.company_id,
      coalesce(co.display_name, co.name) as company_name,
      co.ticker,
      case when q.is_anonymous then 'Anonymous' else coalesce(ap.display_name, ap.username) end as author_name,
      (select count(*)::int from public.question_votes v where v.question_id = q.id) as votes,
      (select count(*)::int from public.question_reports r where r.question_id = q.id) as report_count,
      q.moderated_by,
      coalesce(mp.display_name, mp.username) as moderated_by_name,
      q.moderated_at,
      q.moderation_reason
    from public.questions q
    left join public.companies co on co.id = q.company_id
    left join public.profiles ap on ap.id = q.author_id
    left join public.profiles mp on mp.id = q.moderated_by
  ),
  filtered as (
    select * from base
    where (p_moderation_status is null or moderation_status = p_moderation_status)
      and (p_company_id is null or company_id = p_company_id)
      and (p_search is null or question_text ilike '%' || p_search || '%')
  )
  select
    filtered.id, filtered.question_text, filtered.topic, filtered.status, filtered.moderation_status,
    filtered.created_at, filtered.updated_at, filtered.is_anonymous, filtered.company_id, filtered.company_name,
    filtered.ticker, filtered.author_name, filtered.votes, filtered.report_count, filtered.moderated_by,
    filtered.moderated_by_name, filtered.moderated_at, filtered.moderation_reason,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

/* --------------------------- question reports list ------------------------- */

create or replace function public.admin_question_reports_list(
  p_status text default null,
  p_reason text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  question_id uuid,
  question_text text,
  company_name text,
  ticker text,
  reason text,
  details text,
  status text,
  reporter_name text,
  question_author_name text,
  question_moderation_status text,
  reports_against_question integer,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_name text,
  resolution text,
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
      r.id,
      r.question_id,
      q.question_text::text as question_text,
      coalesce(co.display_name, co.name) as company_name,
      co.ticker,
      r.reason,
      r.details,
      r.status,
      coalesce(rp.display_name, rp.username) as reporter_name,
      case when q.is_anonymous then 'Anonymous' else coalesce(qa.display_name, qa.username) end as question_author_name,
      q.moderation_status as question_moderation_status,
      (select count(*)::int from public.question_reports r2 where r2.question_id = r.question_id) as reports_against_question,
      r.created_at,
      r.reviewed_at,
      coalesce(vp.display_name, vp.username) as reviewed_by_name,
      r.resolution
    from public.question_reports r
    left join public.questions q on q.id = r.question_id
    left join public.companies co on co.id = q.company_id
    left join public.profiles rp on rp.id = r.reported_by
    left join public.profiles qa on qa.id = q.author_id
    left join public.profiles vp on vp.id = r.reviewed_by
  ),
  filtered as (
    select * from base
    where (p_status is null or status = p_status)
      and (p_reason is null or reason = p_reason)
      and (p_search is null or question_text ilike '%' || p_search || '%')
  )
  select
    filtered.id, filtered.question_id, filtered.question_text, filtered.company_name, filtered.ticker,
    filtered.reason, filtered.details, filtered.status, filtered.reporter_name, filtered.question_author_name,
    filtered.question_moderation_status, filtered.reports_against_question, filtered.created_at,
    filtered.reviewed_at, filtered.reviewed_by_name, filtered.resolution,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

/* ------------------------------ bug reports list --------------------------- */

create or replace function public.admin_bug_reports_list(
  p_status text default null,
  p_severity text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  description text,
  severity text,
  status text,
  submitter_name text,
  page_url text,
  browser text,
  operating_system text,
  device_type text,
  screen_size text,
  app_version text,
  screenshot_path text,
  assigned_admin_name text,
  linked_issue_url text,
  fixed_commit text,
  admin_notes text,
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  created_at timestamptz,
  resolved_at timestamptz,
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
      b.id,
      b.description,
      b.severity,
      b.status,
      coalesce(sp.display_name, sp.username) as submitter_name,
      b.page_url,
      b.browser,
      b.operating_system,
      b.device_type,
      b.screen_size,
      b.app_version,
      b.screenshot_path,
      coalesce(ap.display_name, ap.username) as assigned_admin_name,
      b.linked_issue_url,
      b.fixed_commit,
      b.admin_notes,
      b.steps_to_reproduce,
      b.expected_result,
      b.actual_result,
      b.created_at,
      b.resolved_at
    from public.bug_reports b
    left join public.profiles sp on sp.id = b.submitted_by
    left join public.profiles ap on ap.id = b.assigned_to
  ),
  filtered as (
    select * from base
    where (p_status is null or status = p_status)
      and (p_severity is null or severity = p_severity)
      and (p_search is null or description ilike '%' || p_search || '%')
  )
  select
    filtered.id, filtered.description, filtered.severity, filtered.status, filtered.submitter_name,
    filtered.page_url, filtered.browser, filtered.operating_system, filtered.device_type, filtered.screen_size,
    filtered.app_version, filtered.screenshot_path, filtered.assigned_admin_name, filtered.linked_issue_url,
    filtered.fixed_commit, filtered.admin_notes, filtered.steps_to_reproduce, filtered.expected_result,
    filtered.actual_result, filtered.created_at, filtered.resolved_at,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

/* ---------------------------- support tickets list ------------------------- */

create or replace function public.admin_support_tickets_list(
  p_status text default null,
  p_category text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  ticket_number text,
  category text,
  subject text,
  message text,
  sender_name text,
  sender_email text,
  submitter_name text,
  priority text,
  status text,
  assigned_admin_name text,
  admin_notes text,
  last_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz,
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
      t.id,
      t.ticket_number,
      t.category,
      t.subject,
      t.message,
      t.name as sender_name,
      t.email as sender_email,
      coalesce(sp.display_name, sp.username) as submitter_name,
      t.priority,
      t.status,
      coalesce(ap.display_name, ap.username) as assigned_admin_name,
      t.admin_notes,
      t.last_response_at,
      t.resolved_at,
      t.created_at
    from public.support_tickets t
    left join public.profiles sp on sp.id = t.submitted_by
    left join public.profiles ap on ap.id = t.assigned_to
  ),
  filtered as (
    select * from base
    where (p_status is null or status = p_status)
      and (p_category is null or category = p_category)
      and (p_search is null or subject ilike '%' || p_search || '%')
  )
  select
    filtered.id, filtered.ticket_number, filtered.category, filtered.subject, filtered.message,
    filtered.sender_name, filtered.sender_email, filtered.submitter_name, filtered.priority, filtered.status,
    filtered.assigned_admin_name, filtered.admin_notes, filtered.last_response_at, filtered.resolved_at,
    filtered.created_at,
    count(*) over() as total_count
  from filtered
  order by filtered.created_at desc, filtered.id
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

/* --------------------------------- grants ---------------------------------- */

do $$
declare fn text;
begin
  foreach fn in array array[
    'admin_questions_list(text, uuid, text, integer, integer)',
    'admin_question_reports_list(text, text, text, integer, integer)',
    'admin_bug_reports_list(text, text, text, integer, integer)',
    'admin_support_tickets_list(text, text, text, integer, integer)'
  ]
  loop
    execute format('revoke execute on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end;
$$;
