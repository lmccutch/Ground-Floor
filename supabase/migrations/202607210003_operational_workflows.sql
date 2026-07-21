-- Operational workflow schema (Phase: admin foundation + password auth).
--
-- Adds internal operational statuses and supporting tables for the future admin
-- action centre, plus the triggers that raise admin notifications. Forward-only
-- and production-data-safe: every existing row keeps its data and receives a
-- safe default status. Public campaign/question behaviour is unchanged — the new
-- fields are internal and are never exposed through the public_* views.
--
-- New statuses use text + CHECK (consistent with companies.status,
-- feedback.category, company_aliases.alias_type) rather than enums, so the sets
-- can be widened by a later migration without an enum rewrite. Protected admin
-- RPCs and the work-queue source live in the next migration (…0004).

/* ------------------------------ app settings ------------------------------- */

-- Central, configurable operational settings. The supporter threshold lives here
-- (not hardcoded) so it can be tuned without a code change.
create table if not exists public.app_settings (
  key text primary key,
  value_int integer,
  value_text text,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value_int, description)
values ('default_supporter_threshold', 100, 'Default supporters that mark a campaign as threshold-reached.')
on conflict (key) do nothing;

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

create or replace function public.current_default_supporter_threshold()
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select value_int from public.app_settings where key = 'default_supporter_threshold'), 100);
$$;

/* ---------------------------- company_requests ----------------------------- */

alter table public.company_requests
  add column if not exists status text not null default 'pending'
    check (status in ('pending','under_review','approved','rejected','duplicate','needs_information')),
  add column if not exists priority text not null default 'normal'
    check (priority in ('urgent','high','normal','low')),
  add column if not exists admin_notes text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists duplicate_of_request_id uuid references public.company_requests(id) on delete set null,
  add column if not exists created_company_id uuid references public.companies(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists company_requests_status_idx on public.company_requests (status, created_at);

create trigger company_requests_updated_at before update on public.company_requests
  for each row execute function public.set_updated_at();

/* -------------------------- campaigns (operational) ------------------------ */

-- Per-campaign threshold (defaults from the central setting). Existing rows are
-- backfilled with the current default (100).
alter table public.campaigns
  add column if not exists supporter_threshold integer not null default public.current_default_supporter_threshold();

alter table public.campaigns
  add column if not exists operational_status text not null default 'active'
    check (operational_status in (
      'active','near_threshold','threshold_reached','outreach_required','outreach_started',
      'management_engaged','scheduled','completed','stalled','paused','closed')),
  add column if not exists threshold_reached_at timestamptz,
  add column if not exists assigned_admin uuid references public.profiles(id) on delete set null,
  add column if not exists management_contact_status text,
  add column if not exists last_outreach_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists internal_notes text,
  add column if not exists risk_status text,
  add column if not exists closed_reason text;
-- campaigns already carries updated_at + its updated-at trigger.

create index if not exists campaigns_operational_status_idx on public.campaigns (operational_status);

/* -------------------------- questions (moderation) ------------------------- */

-- Parallel moderation status. Default 'published' preserves current visibility
-- (public_questions is unchanged and still keys off the existing question.status
-- enum). Destructive moderation actions also flip question.status via the RPC in
-- …0004 so existing public RLS actually hides the row.
alter table public.questions
  add column if not exists moderation_status text not null default 'published'
    check (moderation_status in ('pending_review','published','reported','hidden','removed','restored','archived')),
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_reason text;

/* ------------------------------ question_reports --------------------------- */

-- Dedicated question-report workflow (the legacy generic public.reports table is
-- preserved for existing data and comment reports). A submitted report never
-- auto-hides a question — moderation is a separate, deliberate admin action.
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in (
    'spam','harassment','abusive_content','personal_information','manipulation',
    'misleading_claim','off_topic','duplicate','legal_concern','other')),
  details text,
  status text not null default 'pending' check (status in ('pending','reviewing','dismissed','action_taken','escalated')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One report per user per question (prevents duplicate reports).
  unique (question_id, reported_by)
);

create index if not exists question_reports_status_idx on public.question_reports (status, created_at);
create index if not exists question_reports_question_idx on public.question_reports (question_id);

create trigger question_reports_updated_at before update on public.question_reports
  for each row execute function public.set_updated_at();

/* -------------------------------- bug_reports ------------------------------ */

-- Bug-report intake. Anonymous submission is intentionally NOT enabled (an
-- unauthenticated insert path with no rate limiting is a spam hole, matching the
-- existing feedback-table decision). The public submission UI is not built yet.
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete set null,
  reporter_email text,
  description text not null check (char_length(description) >= 3),
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  page_url text,
  browser text,
  operating_system text,
  device_type text,
  screen_size text,
  app_version text,
  screenshot_path text,
  status text not null default 'new'
    check (status in ('new','triaged','confirmed','in_progress','fixed','deployed','cannot_reproduce','duplicate','closed')),
  severity text check (severity in ('critical','high','medium','low')),
  assigned_to uuid references public.profiles(id) on delete set null,
  admin_notes text,
  linked_issue_url text,
  fixed_commit text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bug_reports_status_idx on public.bug_reports (status, severity, created_at);

create trigger bug_reports_updated_at before update on public.bug_reports
  for each row execute function public.set_updated_at();

/* ------------------------------ support_tickets ---------------------------- */

create sequence if not exists public.support_ticket_seq;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  category text not null check (category in (
    'general','company_request','technical_support','bug','privacy','partnership',
    'company_management','media','legal','other')),
  name text,
  email text,
  subject text,
  message text not null check (char_length(message) >= 1),
  submitted_by uuid references public.profiles(id) on delete set null,
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  status text not null default 'new'
    check (status in ('new','open','waiting_on_user','in_progress','resolved','closed','spam')),
  assigned_to uuid references public.profiles(id) on delete set null,
  admin_notes text,
  last_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at);

-- Ticket numbers are always generated server-side (a client-supplied value is
-- ignored) so they cannot be forged or collide.
create or replace function public.set_support_ticket_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.ticket_number := 'OF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.support_ticket_seq')::text, 5, '0');
  return new;
end;
$$;

create trigger support_tickets_number before insert on public.support_tickets
  for each row execute function public.set_support_ticket_number();

create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

/* ------------------- admin-notification generation triggers ---------------- */

-- All of the triggers below run SECURITY DEFINER so they may call
-- create_admin_notification() (whose EXECUTE is revoked from client roles), and
-- every call is wrapped so a notification failure can NEVER roll back the user's
-- submission (the whole point of raising the notification is a side effect).

create or replace function public.notify_company_request_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.create_admin_notification(
      'company_request_submitted',
      'New company request: ' || coalesce(new.company_name, 'Unknown') || ' (' || coalesce(new.ticker, '?') || ')',
      'A shareholder requested coverage for ' || coalesce(new.company_name, 'a company') || '.',
      'medium', 'company_request', new.id,
      '/admin/company-requests/' || new.id,
      'company_request:' || new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
revoke execute on function public.notify_company_request_submitted() from public;
create trigger company_requests_notify_admin after insert on public.company_requests
  for each row execute function public.notify_company_request_submitted();

create or replace function public.notify_question_reported()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.create_admin_notification(
      'question_reported',
      'Question reported (' || new.reason || ')',
      'A question was reported and is awaiting review.',
      'high', 'question_report', new.id,
      '/admin/reports/' || new.id,
      'question_report:' || new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
revoke execute on function public.notify_question_reported() from public;
create trigger question_reports_notify_admin after insert on public.question_reports
  for each row execute function public.notify_question_reported();

create or replace function public.notify_bug_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.create_admin_notification(
      'bug_submitted',
      'New bug report',
      left(new.description, 140),
      case when new.severity = 'critical' then 'critical' else 'medium' end,
      'bug_report', new.id,
      '/admin/bugs/' || new.id,
      'bug_report:' || new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
revoke execute on function public.notify_bug_submitted() from public;
create trigger bug_reports_notify_admin after insert on public.bug_reports
  for each row execute function public.notify_bug_submitted();

create or replace function public.notify_support_ticket_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.create_admin_notification(
      'support_ticket_created',
      'New support ticket ' || new.ticket_number || ' (' || new.category || ')',
      coalesce(new.subject, left(new.message, 140)),
      'medium', 'support_ticket', new.id,
      '/admin/support/' || new.id,
      'support_ticket:' || new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
revoke execute on function public.notify_support_ticket_created() from public;
create trigger support_tickets_notify_admin after insert on public.support_tickets
  for each row execute function public.notify_support_ticket_created();

-- Campaign supporter milestones: emit an admin notification once at 80 %, 90 %
-- and 100 % of the campaign's supporter_threshold. Supporters are added one at a
-- time, so each insert re-evaluates and the highest newly-crossed milestone
-- fires; the per-campaign-per-milestone deduplication_key guarantees each is
-- emitted at most once. Also advances operational_status / threshold_reached_at
-- without overwriting a status an admin has already set.
create or replace function public.notify_campaign_milestones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_threshold integer;
  v_company_name text;
  v_path text := '/admin/campaigns/' || new.campaign_id;
begin
  select c.supporter_threshold, coalesce(co.display_name, co.name)
    into v_threshold, v_company_name
    from public.campaigns c
    join public.companies co on co.id = c.company_id
    where c.id = new.campaign_id;

  if v_threshold is null or v_threshold <= 0 then
    return new;
  end if;

  select count(*) into v_count from public.campaign_supporters where campaign_id = new.campaign_id;

  begin
    if v_count >= v_threshold then
      perform public.create_admin_notification(
        'campaign_threshold_reached',
        coalesce(v_company_name, 'A campaign') || ': supporter threshold reached',
        'Reached ' || v_count || ' of ' || v_threshold || ' supporters.',
        'high', 'campaign', new.campaign_id, v_path,
        'campaign_milestone:' || new.campaign_id || ':100');
      update public.campaigns
        set threshold_reached_at = now(),
            operational_status = case when operational_status = 'active' then 'threshold_reached' else operational_status end
        where id = new.campaign_id and threshold_reached_at is null;
    elsif v_count >= ceil(v_threshold * 0.9) then
      perform public.create_admin_notification(
        'campaign_near_threshold',
        coalesce(v_company_name, 'A campaign') || ': nearing threshold (90%)',
        'Reached ' || v_count || ' of ' || v_threshold || ' supporters (90%).',
        'medium', 'campaign', new.campaign_id, v_path,
        'campaign_milestone:' || new.campaign_id || ':90');
      update public.campaigns set operational_status = 'near_threshold'
        where id = new.campaign_id and operational_status = 'active';
    elsif v_count >= ceil(v_threshold * 0.8) then
      perform public.create_admin_notification(
        'campaign_near_threshold',
        coalesce(v_company_name, 'A campaign') || ': nearing threshold (80%)',
        'Reached ' || v_count || ' of ' || v_threshold || ' supporters (80%).',
        'medium', 'campaign', new.campaign_id, v_path,
        'campaign_milestone:' || new.campaign_id || ':80');
      update public.campaigns set operational_status = 'near_threshold'
        where id = new.campaign_id and operational_status = 'active';
    end if;
  exception when others then null;
  end;

  return new;
end;
$$;
revoke execute on function public.notify_campaign_milestones() from public;
create trigger campaign_supporters_milestones after insert on public.campaign_supporters
  for each row execute function public.notify_campaign_milestones();

/* ----------------------------------- RLS ----------------------------------- */

alter table public.app_settings enable row level security;
alter table public.question_reports enable row level security;
alter table public.bug_reports enable row level security;
alter table public.support_tickets enable row level security;

-- app_settings: administrator only. Definer helpers read it as owner, so no
-- client read grant is required for the threshold to work.
create policy "admin manages app settings" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;

-- question_reports: a user may file a report as themselves and read back only
-- their own; the administrator reads/manages all. Report details stay private.
create policy "users file question reports" on public.question_reports
  for insert with check (auth.uid() = reported_by);
create policy "users read own question reports" on public.question_reports
  for select using (auth.uid() = reported_by or public.is_admin());
create policy "admin manages question reports" on public.question_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- bug_reports: authenticated submitters only; read your own; admin manages all.
create policy "users submit bug reports" on public.bug_reports
  for insert with check (auth.uid() = submitted_by);
create policy "users read own bug reports" on public.bug_reports
  for select using (auth.uid() = submitted_by or public.is_admin());
create policy "admin manages bug reports" on public.bug_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- support_tickets: authenticated submitters only; read your own; admin manages.
create policy "users create support tickets" on public.support_tickets
  for insert with check (auth.uid() = submitted_by);
create policy "users read own support tickets" on public.support_tickets
  for select using (auth.uid() = submitted_by or public.is_admin());
create policy "admin manages support tickets" on public.support_tickets
  for all using (public.is_admin()) with check (public.is_admin());
