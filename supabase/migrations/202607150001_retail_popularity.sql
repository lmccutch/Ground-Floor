-- "Popular with Retail Investors" (Discover beta): a single editorial-ranking
-- table plus a public-safe view. Forward-only; nothing existing is dropped or
-- weakened. See docs/popular-with-retail.md.
--
-- The ranking is a curated snapshot imported from a CSV (a third-party
-- linked-broker investor panel), NOT a live integration: there is no scraper, no
-- credentials, no scheduled refresh. Rows are written only by an admin/service
-- role — the public app has read-only access, and only to the non-sensitive
-- columns exposed through public_retail_popularity.

/* ---------------------- company_retail_popularity ------------------------- */

create table if not exists public.company_retail_popularity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  -- The specific security the source ranked (e.g. GOOGL vs GOOG, BRK.B). Kept for
  -- provenance; the card always links to the company's canonical page, not this.
  security_id uuid references public.securities(id) on delete set null,
  feature_rank integer not null check (feature_rank > 0),
  source_rank integer,
  source_name text not null,
  source_url text,
  source_as_of date,
  -- Panel provenance. Retained for internal reference only. These are a SAMPLE
  -- from a linked-broker panel, never total retail ownership, so they are NEVER
  -- exposed through the public view below (panel_owner_count in particular would
  -- be mistaken for a company's total retail shareholder count).
  panel_market_share_pct numeric,
  panel_avg_position_usd numeric,
  panel_owner_count integer,
  panel_tracked_value_usd numeric,
  market_cap_usd_mm numeric,
  ranking_method text,
  is_featured boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One featured row per company: dual-class / multi-security companies (e.g.
  -- Alphabet's GOOGL + GOOG) collapse to a single entry so a company is never
  -- featured twice.
  unique (company_id)
);

create index if not exists company_retail_popularity_feature_rank_idx
  on public.company_retail_popularity (feature_rank) where is_featured;
create index if not exists company_retail_popularity_company_idx
  on public.company_retail_popularity (company_id);

create trigger company_retail_popularity_updated_at before update on public.company_retail_popularity
  for each row execute function public.set_updated_at();

/* --------------------------------- RLS ------------------------------------ */

alter table public.company_retail_popularity enable row level security;

-- No public SELECT policy on the base table: the anon/authenticated roles must
-- never read the panel_* provenance columns. Public read access is granted only
-- to the non-sensitive view below. Writes are admin-only (import runs as an
-- admin or the service role, which bypasses RLS).
create policy "admins manage retail popularity" on public.company_retail_popularity
  for all using (public.is_admin()) with check (public.is_admin());

/* ---------------------- public_retail_popularity -------------------------- */

-- Public-safe projection for the Discover section. Exposes only ranking + source
-- provenance, and only featured rows for discoverable companies. Deliberately
-- omits every panel_* column and market_cap_usd_mm. Follows the same owner-view
-- pattern as public_campaign_metrics / public_questions (the view bypasses the
-- base table's RLS, and access is controlled by the grants below).
create or replace view public.public_retail_popularity as
select
  rp.id,
  rp.company_id,
  rp.security_id,
  rp.feature_rank,
  rp.source_name,
  rp.source_url,
  rp.source_as_of,
  rp.ranking_method,
  rp.is_featured
from public.company_retail_popularity rp
join public.companies c on c.id = rp.company_id
where rp.is_featured and c.is_discoverable;

grant select on public.public_retail_popularity to anon, authenticated;
