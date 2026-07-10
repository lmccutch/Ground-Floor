create extension if not exists pgcrypto;

create type public.investor_type as enum ('Individual investor', 'Finance professional', 'Industry professional', 'Other');
create type public.shareholder_status as enum ('Current shareholder', 'Former shareholder', 'Considering investing', 'Following the company', 'Prefer not to say');
create type public.campaign_status as enum ('Gathering shareholder interest', 'Preparing management outreach', 'Management contacted', 'Management reviewing request', 'Interview discussions underway', 'Interview scheduled', 'Interview completed', 'Management declined', 'Campaign paused');
create type public.question_status as enum ('Open', 'Under review', 'Selected for outreach', 'Sent to management', 'Answered', 'Not answered', 'Archived');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null default 'Anonymous Shareholder', country text, investor_type public.investor_type, referral_source text, public_anonymous boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.companies (id uuid primary key default gen_random_uuid(), name text not null, ticker text not null, exchange text not null, country text not null default 'United States', sector text not null, description text not null default '', logo_url text, website text, investor_relations_url text, market_cap_category text, status text not null default 'Early shareholder campaign', is_public boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (ticker, exchange));
create table public.campaigns (id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id) on delete cascade, status public.campaign_status not null default 'Gathering shareholder interest', outreach_target integer not null default 100 check (outreach_target > 0), launched_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.company_requests (id uuid primary key default gen_random_uuid(), requested_by uuid not null references public.profiles(id) on delete cascade, company_name text not null, ticker text not null, exchange text not null, reason text not null, shareholder_status public.shareholder_status not null, suggested_topic text, consent boolean not null default false, created_at timestamptz not null default now());
create table public.campaign_supporters (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, shareholder_status public.shareholder_status not null, position_range text, created_at timestamptz not null default now(), unique (campaign_id, user_id));
create table public.campaign_followers (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique (campaign_id, user_id));
create table public.shareholder_statuses (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, status public.shareholder_status not null, position_range text, created_at timestamptz not null default now(), unique (company_id, user_id));
create table public.questions (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, author_id uuid not null references public.profiles(id) on delete cascade, question_text varchar(500) not null, topic text not null, context varchar(1500), shareholder_status public.shareholder_status not null, is_anonymous boolean not null default false, status public.question_status not null default 'Open', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.question_votes (id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique (question_id, user_id));
create table public.question_comments (id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade, author_id uuid not null references public.profiles(id) on delete cascade, parent_id uuid references public.question_comments(id) on delete cascade, body varchar(1000) not null, is_deleted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade, question_id uuid references public.questions(id) on delete cascade, comment_id uuid references public.question_comments(id) on delete cascade, reason text not null, details text, created_at timestamptz not null default now());
create table public.campaign_events (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, event_type text not null, label text not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());
create table public.notification_preferences (user_id uuid primary key references public.profiles(id) on delete cascade, top_question boolean not null default true, threshold boolean not null default true, management_contacted boolean not null default true, interview_scheduled boolean not null default true, interview_published boolean not null default true, question_status boolean not null default true, updated_at timestamptz not null default now());
create table public.referrals (id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.profiles(id) on delete cascade, code text not null unique, created_at timestamptz not null default now());
create table public.referral_events (id uuid primary key default gen_random_uuid(), referral_id uuid not null references public.referrals(id) on delete cascade, event_type text not null, user_id uuid references public.profiles(id) on delete set null, company_id uuid references public.companies(id) on delete set null, created_at timestamptz not null default now());
create table public.acquisition_attribution (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, session_id text, source text, medium text, campaign text, landing_page text, created_at timestamptz not null default now());
create table public.admin_notes (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, author_id uuid not null references public.profiles(id), note text not null, created_at timestamptz not null default now());
create table public.user_roles (user_id uuid primary key references public.profiles(id) on delete cascade, role text not null check (role in ('admin', 'moderator')), created_at timestamptz not null default now());

create index companies_search_idx on public.companies using gin (to_tsvector('english', name || ' ' || ticker || ' ' || sector));
create index questions_company_idx on public.questions(company_id, created_at desc);
create index question_votes_question_idx on public.question_votes(question_id);
create index campaign_events_campaign_idx on public.campaign_events(campaign_id, created_at);
create unique index company_requests_dedupe_idx on public.company_requests (lower(company_name), upper(ticker), exchange);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'moderator')); $$;
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger questions_updated_at before update on public.questions for each row execute function public.set_updated_at();

create or replace view public.public_campaign_metrics as
select c.id as company_id, ca.id, ca.status, ca.outreach_target, ca.launched_at,
  count(distinct cs.id)::int as supporters,
  count(distinct cs.id) filter (where cs.shareholder_status = 'Current shareholder')::int as current_shareholders,
  count(distinct q.id)::int as questions,
  count(distinct qv.id)::int as votes,
  count(distinct cf.id)::int as followers
from public.companies c join public.campaigns ca on ca.company_id = c.id
left join public.campaign_supporters cs on cs.campaign_id = ca.id
left join public.questions q on q.company_id = c.id and q.status <> 'Archived'
left join public.question_votes qv on qv.question_id = q.id
left join public.campaign_followers cf on cf.campaign_id = ca.id
group by c.id, ca.id;

create or replace view public.public_questions as
select q.id, q.company_id, q.question_text as text, q.topic, q.status,
  q.created_at, q.is_anonymous,
  case when q.is_anonymous then 'Anonymous Shareholder' else coalesce(p.display_name, 'Anonymous Shareholder') end as author,
  count(distinct qv.id)::int as votes,
  count(distinct qc.id) filter (where qc.is_deleted = false)::int as comment_count,
  q.shareholder_status as shares
from public.questions q
left join public.profiles p on p.id = q.author_id
left join public.question_votes qv on qv.question_id = q.id
left join public.question_comments qc on qc.question_id = q.id
group by q.id, p.display_name;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.campaigns enable row level security;
alter table public.company_requests enable row level security;
alter table public.campaign_supporters enable row level security;
alter table public.campaign_followers enable row level security;
alter table public.shareholder_statuses enable row level security;
alter table public.questions enable row level security;
alter table public.question_votes enable row level security;
alter table public.question_comments enable row level security;
alter table public.reports enable row level security;
alter table public.campaign_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_roles enable row level security;
alter table public.campaign_events enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;
alter table public.acquisition_attribution enable row level security;
alter table public.admin_notes enable row level security;

create policy "public reads public companies" on public.companies for select using (is_public = true or public.is_admin());
create policy "public reads campaigns" on public.campaigns for select using (true);
create policy "public reads campaign metrics" on public.campaigns for select using (true);
create policy "users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "users create requests" on public.company_requests for insert with check (auth.uid() = requested_by);
create policy "admins manage requests" on public.company_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "users support campaigns" on public.campaign_supporters for insert with check (auth.uid() = user_id);
create policy "users read supports" on public.campaign_supporters for select using (true);
create policy "users update own support" on public.campaign_supporters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users follow campaigns" on public.campaign_followers for insert with check (auth.uid() = user_id);
create policy "users read follows" on public.campaign_followers for select using (auth.uid() = user_id);
create policy "users remove own follow" on public.campaign_followers for delete using (auth.uid() = user_id);
create policy "users manage own status" on public.shareholder_statuses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public reads published questions" on public.questions for select using (status not in ('Under review', 'Archived') or auth.uid() = author_id or public.is_admin());
create policy "users create own questions" on public.questions for insert with check (auth.uid() = author_id);
create policy "users edit own questions" on public.questions for update using (auth.uid() = author_id and status = 'Under review') with check (auth.uid() = author_id);
create policy "admins moderate questions" on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy "public reads votes" on public.question_votes for select using (true);
create policy "users vote as themselves" on public.question_votes for insert with check (auth.uid() = user_id);
create policy "users remove own votes" on public.question_votes for delete using (auth.uid() = user_id);
create policy "public reads comments" on public.question_comments for select using (not is_deleted or auth.uid() = author_id or public.is_admin());
create policy "users create comments" on public.question_comments for insert with check (auth.uid() = author_id);
create policy "users edit comments" on public.question_comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "users report content" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "admins manage events" on public.campaign_events for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users manage preferences" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins manage roles" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());
create policy "users manage own referrals" on public.referrals for all using (auth.uid() = referrer_id) with check (auth.uid() = referrer_id);
create policy "users create referral events" on public.referral_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "users create attribution" on public.acquisition_attribution for insert with check (auth.uid() = user_id or user_id is null);
create policy "admins manage attribution" on public.acquisition_attribution for select using (public.is_admin());
create policy "admins manage notes" on public.admin_notes for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
