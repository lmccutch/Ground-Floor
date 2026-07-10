-- Company-universe core (Phase 1): company/security/alias model, real search,
-- and on-demand campaign creation. Extends the existing schema — nothing is
-- dropped, and no data is destroyed. See docs/company-universe.md.

create extension if not exists pg_trgm;

/* ------------------------------- companies ------------------------------- */

alter table public.companies
  add column if not exists cik text,
  add column if not exists legal_name text,
  add column if not exists display_name text,
  add column if not exists slug text,
  add column if not exists country_code text,
  add column if not exists headquarters_country text,
  add column if not exists latest_market_cap numeric,
  add column if not exists market_cap_currency text default 'USD',
  add column if not exists market_cap_as_of timestamptz,
  add column if not exists is_operating_company boolean not null default true,
  add column if not exists is_directory_eligible boolean not null default true,
  add column if not exists is_discoverable boolean not null default true,
  add column if not exists eligibility_reason text,
  add column if not exists ineligibility_reason text,
  add column if not exists primary_security_id uuid,
  add column if not exists metadata_source text not null default 'admin';

-- Backfill from existing columns so current rows behave identically after migration.
update public.companies
set
  legal_name = coalesce(legal_name, name),
  display_name = coalesce(display_name, name),
  is_discoverable = is_public
where legal_name is null or display_name is null;

update public.companies
set slug = lower(regexp_replace(regexp_replace(coalesce(display_name, name), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substr(id::text, 1, 6)
where slug is null;

alter table public.companies alter column slug set not null;
create unique index if not exists companies_slug_idx on public.companies (slug);

create index if not exists companies_display_name_trgm_idx on public.companies using gin (display_name gin_trgm_ops);
create index if not exists companies_legal_name_trgm_idx on public.companies using gin (legal_name gin_trgm_ops);

/* ------------------------------- securities ------------------------------- */

create table if not exists public.securities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  symbol text not null,
  normalized_symbol text not null,
  exchange text not null,
  security_name text,
  security_type text,
  share_class text,
  currency text not null default 'USD',
  is_primary boolean not null default false,
  is_active boolean not null default true,
  is_adr boolean not null default false,
  source text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists securities_active_exchange_symbol_idx
  on public.securities (exchange, normalized_symbol) where is_active;
create index if not exists securities_company_idx on public.securities (company_id);
create index if not exists securities_normalized_symbol_idx on public.securities (normalized_symbol);

create trigger securities_updated_at before update on public.securities
  for each row execute function public.set_updated_at();

-- Backfill: one primary security per existing company from its ticker/exchange.
insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, source)
select id, ticker, upper(regexp_replace(trim(ticker), '[-/]', '.', 'g')), exchange, true, true, 'legacy'
from public.companies c
where not exists (select 1 from public.securities s where s.company_id = c.id);

update public.companies c
set primary_security_id = s.id
from public.securities s
where s.company_id = c.id and s.is_primary and c.primary_security_id is null;

/* ----------------------------- company_aliases ----------------------------- */

create table if not exists public.company_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  alias_type text not null check (alias_type in ('former_company_name', 'former_ticker', 'abbreviation', 'brand_name', 'search_synonym')),
  source text,
  created_at timestamptz not null default now()
);

create unique index if not exists company_aliases_dedupe_idx
  on public.company_aliases (company_id, normalized_alias, alias_type);
create index if not exists company_aliases_normalized_idx on public.company_aliases using gin (normalized_alias gin_trgm_ops);
create index if not exists company_aliases_former_ticker_idx on public.company_aliases (normalized_alias) where alias_type = 'former_ticker';

/* ---------------------------------- RLS ---------------------------------- */

drop policy if exists "public reads public companies" on public.companies;
create policy "public reads discoverable companies" on public.companies
  for select using (is_discoverable or public.is_admin());

alter table public.securities enable row level security;
alter table public.company_aliases enable row level security;

create policy "public reads securities of discoverable companies" on public.securities
  for select using (
    public.is_admin() or exists (
      select 1 from public.companies c where c.id = securities.company_id and c.is_discoverable
    )
  );
create policy "admins manage securities" on public.securities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads aliases of discoverable companies" on public.company_aliases
  for select using (
    public.is_admin() or exists (
      select 1 from public.companies c where c.id = company_aliases.company_id and c.is_discoverable
    )
  );
create policy "admins manage aliases" on public.company_aliases
  for all using (public.is_admin()) with check (public.is_admin());

/* --------------------------------- search --------------------------------- */

-- Rank tiers (lower wins): 0 exact primary ticker, 1 exact non-primary (e.g. dual-class)
-- ticker, 2 exact former-ticker alias, 3 primary-ticker prefix, 4 exact display name,
-- 5 display-name prefix, 6 alias/brand match, 7 fuzzy trigram name match. Campaign
-- engagement (supporters) is used only to order results WITHIN a tier — it can never
-- outrank a better tier, so it can never outrank an exact ticker match.
create or replace function public.search_companies(search_query text, result_limit integer default 10)
returns table (
  company_id uuid,
  display_name text,
  ticker text,
  exchange text,
  sector text,
  has_campaign boolean,
  campaign_status text,
  supporters integer,
  questions integer,
  is_discoverable boolean,
  is_active boolean
)
language sql
stable
set search_path = public
as $$
  with q as (
    select
      upper(regexp_replace(trim(search_query), '[-/]', '.', 'g')) as ticker_query,
      lower(trim(search_query)) as text_query
  ),
  security_matches as (
    select
      s.company_id,
      case
        when s.normalized_symbol = (select ticker_query from q) and s.is_primary then 0
        when s.normalized_symbol = (select ticker_query from q) then 1
        when s.is_primary and s.normalized_symbol like (select ticker_query from q) || '%' then 3
        else null
      end as rank_tier
    from public.securities s
    where s.is_active
      and (select ticker_query from q) <> ''
      and (
        s.normalized_symbol = (select ticker_query from q)
        or s.normalized_symbol like (select ticker_query from q) || '%'
      )
  ),
  alias_matches as (
    select
      a.company_id,
      case
        when a.alias_type = 'former_ticker' and a.normalized_alias = (select ticker_query from q) then 2
        else 6
      end as rank_tier
    from public.company_aliases a
    where (select text_query from q) <> ''
      and (
        a.normalized_alias = (select ticker_query from q)
        or a.normalized_alias like (select text_query from q) || '%'
      )
  ),
  name_matches as (
    select
      c.id as company_id,
      case
        when lower(c.display_name) = (select text_query from q) then 4
        when lower(c.display_name) like (select text_query from q) || '%' then 5
        when c.display_name % (select text_query from q) then 7
        else null
      end as rank_tier
    from public.companies c
    where (select text_query from q) <> ''
      and (
        lower(c.display_name) like '%' || (select text_query from q) || '%'
        or c.display_name % (select text_query from q)
      )
  ),
  all_matches as (
    select company_id, rank_tier from security_matches where rank_tier is not null
    union all
    select company_id, rank_tier from alias_matches
    union all
    select company_id, rank_tier from name_matches where rank_tier is not null
  ),
  best_per_company as (
    select company_id, min(rank_tier) as rank_tier
    from all_matches
    group by company_id
  )
  select
    c.id as company_id,
    c.display_name,
    ps.symbol as ticker,
    ps.exchange,
    c.sector,
    (m.id is not null) as has_campaign,
    m.status as campaign_status,
    coalesce(m.supporters, 0) as supporters,
    coalesce(m.questions, 0) as questions,
    c.is_discoverable,
    ps.is_active
  from best_per_company b
  join public.companies c on c.id = b.company_id and c.is_discoverable
  join public.securities ps on ps.company_id = c.id and ps.is_primary
  left join public.public_campaign_metrics m on m.company_id = c.id
  order by b.rank_tier asc, coalesce(m.supporters, 0) desc, c.display_name asc
  limit greatest(result_limit, 1);
$$;

grant execute on function public.search_companies(text, integer) to anon, authenticated;

/* ----------------------------- start_campaign ----------------------------- */

create or replace function public.start_campaign(p_company_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.campaigns (company_id)
  values (p_company_id)
  on conflict (company_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.campaigns where company_id = p_company_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.start_campaign(uuid) to authenticated;
