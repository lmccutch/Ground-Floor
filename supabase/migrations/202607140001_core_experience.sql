-- Core-experience phase: question edit/delete, feedback, in-app notifications,
-- public campaign timeline events, and profile-level anonymity.
-- Forward-only; nothing existing is dropped or weakened. Verified live against
-- the scratch project by scripts/verify-core-experience-security.ts.

/* ------------------------- questions: edit + delete ------------------------ */

-- The original edit policy only allowed editing while status = 'Under review',
-- which excluded the default 'Open' status — so a just-submitted question could
-- never be edited by its author. Authors may now edit or delete their own
-- questions while they are 'Open' or 'Under review'. Once a question moves to
-- 'Selected for outreach' / 'Sent to management' / 'Answered' / 'Not answered' /
-- 'Archived' it is locked for the author (admins retain full access through the
-- existing "admins moderate questions" policy). Deleting a question cascades to
-- its votes, comments, and reports via the existing ON DELETE CASCADE FKs, so no
-- orphan rows are left behind.

drop policy if exists "users edit own questions" on public.questions;
create policy "users edit own eligible questions" on public.questions
  for update
  using (auth.uid() = author_id and status in ('Open', 'Under review'))
  with check (auth.uid() = author_id and status in ('Open', 'Under review'));

create policy "users delete own eligible questions" on public.questions
  for delete
  using (auth.uid() = author_id and status in ('Open', 'Under review'));

/* --------------------------------- feedback -------------------------------- */

-- Product feedback, kept separate from the moderation-oriented `reports` table.
-- Submissions require an authenticated user (auth.uid() = user_id) — anonymous
-- submissions were deliberately not enabled because an unauthenticated insert
-- path with no server-side rate limiting or captcha is a spam hole. Users can
-- read back only their own feedback; admins read everything via is_admin().

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (
    category in ('Something is broken', 'Confusing experience', 'Feature request', 'Company request', 'General feedback')
  ),
  message varchar(2000) not null check (char_length(message) >= 3),
  page_path varchar(300),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "users submit own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);
create policy "users read own feedback" on public.feedback
  for select using (auth.uid() = user_id);
create policy "admins manage feedback" on public.feedback
  for all using (public.is_admin()) with check (public.is_admin());

/* ------------------------------ notifications ------------------------------ */

-- Users can mark their own notifications read. Column-level grant restricts the
-- authenticated role to updating read_at only, so title/body/type are immutable
-- from the client even for a user's own rows (service_role is unaffected).

create policy "users mark own notifications read" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Truthful notification generation: only real persisted state changes create
-- notifications. Campaign status changes notify that campaign's supporters and
-- followers; question status changes notify the author. Both honor
-- notification_preferences where a matching preference column exists (users
-- without a preferences row default to receiving them, matching the table's
-- column defaults). SECURITY DEFINER is required because notifications has no
-- INSERT policy — inserts happen only through these triggers or service-role
-- tooling. Trigger functions cannot be invoked via the API (they return
-- trigger, which PostgREST/Postgres reject for direct calls); EXECUTE is
-- revoked from PUBLIC anyway as defense in depth.

create or replace function public.notify_campaign_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  select coalesce(display_name, name) into v_company_name from public.companies where id = new.company_id;
  insert into public.notifications (user_id, type, title, body)
  select
    u.user_id,
    'campaign_status',
    coalesce(v_company_name, 'A campaign you follow') || ': campaign update',
    'The campaign status changed to "' || new.status::text || '". Management participation is voluntary.'
  from (
    select user_id from public.campaign_supporters where campaign_id = new.id
    union
    select user_id from public.campaign_followers where campaign_id = new.id
  ) u
  left join public.notification_preferences p on p.user_id = u.user_id
  where case new.status
    when 'Management contacted' then coalesce(p.management_contacted, true)
    when 'Interview scheduled' then coalesce(p.interview_scheduled, true)
    when 'Interview completed' then coalesce(p.interview_published, true)
    else true
  end;
  return new;
end;
$$;

revoke execute on function public.notify_campaign_status_change() from public;

create trigger campaigns_status_notify
  after update of status on public.campaigns
  for each row execute function public.notify_campaign_status_change();

create or replace function public.notify_question_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  insert into public.notifications (user_id, type, title, body)
  select
    new.author_id,
    'question_status',
    'Your question status changed',
    'Your question "' || left(new.question_text, 100) || case when char_length(new.question_text) > 100 then '…' else '' end
      || '" is now "' || new.status::text || '".'
  where coalesce((select question_status from public.notification_preferences where user_id = new.author_id), true);
  return new;
end;
$$;

revoke execute on function public.notify_question_status_change() from public;

create trigger questions_status_notify
  after update of status on public.questions
  for each row execute function public.notify_question_status_change();

/* --------------------------- public campaign events ------------------------ */

-- campaign_events rows are written by admins only (existing policy) and record
-- real outreach steps (outreach prepared, IR contacted, response received, …).
-- Expose only the public-safe columns for the campaign timeline, following the
-- same owner-view pattern as public_campaign_metrics / public_questions.
-- created_by (an admin profile id) is deliberately not exposed.

create or replace view public.public_campaign_events as
select id, campaign_id, event_type, label, created_at
from public.campaign_events;

/* ------------------------- profile-level anonymity ------------------------- */

-- profiles.public_anonymous existed but nothing consumed it. public_questions
-- now honors it: a user who sets the flag is shown as "Anonymous Shareholder"
-- on all their questions, in addition to the existing per-question is_anonymous
-- choice. Same columns/order as the original view definition.

create or replace view public.public_questions as
select q.id, q.company_id, q.question_text as text, q.topic, q.status,
  q.created_at, q.is_anonymous,
  case
    when q.is_anonymous or coalesce(p.public_anonymous, false) then 'Anonymous Shareholder'
    else coalesce(p.display_name, 'Anonymous Shareholder')
  end as author,
  count(distinct qv.id)::int as votes,
  count(distinct qc.id) filter (where qc.is_deleted = false)::int as comment_count,
  q.shareholder_status as shares
from public.questions q
left join public.profiles p on p.id = q.author_id
left join public.question_votes qv on qv.question_id = q.id
left join public.question_comments qc on qc.question_id = q.id
group by q.id, p.display_name, p.public_anonymous;
