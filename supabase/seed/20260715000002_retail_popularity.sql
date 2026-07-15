-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/import-retail-popularity.ts from the curated retail CSV.
-- Re-run `npm run retail:import` to regenerate.
--
-- Upserts featured retail-popularity rows. Safe to re-run: every statement is an
-- upsert keyed on company_id. A row inserts nothing if its company has not been
-- bootstrapped yet (apply the company-directory bootstrap first). Apply this file
-- to a Supabase project manually as an admin/service role — it is never run
-- automatically. Requires migration 202607150001_retail_popularity.sql.
--
-- Featured companies: 72
-- Generated: 2026-07-15

begin;

-- #1 Tesla (TSLA)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 1, 1, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  1.11, 113523.23, 19, 2156941.42,
  1281246.12, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'TSLA' and s.is_active
where c.ticker = 'TSLA' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #2 Microsoft Corporation (MSFT)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 2, 2, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.63, 45259.16, 27, 1221997.34,
  2859644.97, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'MSFT' and s.is_active
where c.ticker = 'MSFT' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #3 Nektar Therapeutics (NKTR)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 3, 5, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.45, 289608.03, 3, 868824.08,
  2269.41, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'NKTR' and s.is_active
where c.ticker = 'NKTR' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #4 Transocean Ltd. (RIG)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 4, 6, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.44, 211888.74, 4, 847554.98,
  5878.17, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'RIG' and s.is_active
where c.ticker = 'RIG' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #5 Palantir Technologies Inc. (PLTR)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 5, 7, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.41, 53812.31, 15, 807184.7,
  320108.16, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'PLTR' and s.is_active
where c.ticker = 'PLTR' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #6 Nebius Group (NBIS)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 6, 9, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.34, 167289.65, 4, 669158.61,
  49707.42, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'NBIS' and s.is_active
where c.ticker = 'NBIS' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #7 Amazon.com, Inc. (AMZN)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 7, 10, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.31, 26623.16, 23, 612332.69,
  2661507.46, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'AMZN' and s.is_active
where c.ticker = 'AMZN' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #8 Apple Inc. (AAPL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 8, 11, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.27, 26099.34, 20, 521986.78,
  4618268.24, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'AAPL' and s.is_active
where c.ticker = 'AAPL' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #9 NVIDIA Corporation (NVDA)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 9, 12, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.26, 15981.46, 32, 511406.86,
  5130007.8, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'NVDA' and s.is_active
where c.ticker = 'NVDA' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #10 IREN Limited (IREN)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 10, 14, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.24, 52087.96, 9, 468791.65,
  13161.83, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'IREN' and s.is_active
where c.ticker = 'IREN' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #11 ServiceNow, Inc. (NOW)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 11, 15, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.21, 45429.73, 9, 408867.55,
  108132.64, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'NOW' and s.is_active
where c.ticker = 'NOW' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #12 Oracle Corporation (ORCL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 12, 16, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.19, 37675.36, 10, 376753.58,
  368467.2, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'ORCL' and s.is_active
where c.ticker = 'ORCL' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #13 Alphabet (GOOGL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 13, 17, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.19, 17696.11, 21, 371618.4,
  4074607.19, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'GOOGL' and s.is_active
where c.ticker = 'GOOGL' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #14 Micron Technology (MU)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 14, 19, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.17, 27713.48, 12, 332561.8,
  1108959.36, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'MU' and s.is_active
where c.ticker = 'MU' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #15 Salesforce, Inc. (CRM)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 15, 21, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.16, 51190.85, 6, 307145.11,
  137231.64, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'CRM' and s.is_active
where c.ticker = 'CRM' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #16 SoFi Technologies (SOFI)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 16, 22, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.15, 49563.7, 6, 297382.19,
  23770.15, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'SOFI' and s.is_active
where c.ticker = 'SOFI' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #17 Alibaba Group (BABA)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 17, 23, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.15, 28422.49, 10, 284224.91,
  null, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'BABA' and s.is_active
where c.ticker = 'BABA' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #18 TMC the metals company (TMC)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 18, 24, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.14, 53577.63, 5, 267888.13,
  1728.42, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'TMC' and s.is_active
where c.ticker = 'TMC' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #19 Coinbase (COIN)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 19, 25, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.13, 50356.18, 5, 251780.88,
  42540.88, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'COIN' and s.is_active
where c.ticker = 'COIN' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #20 Applied Digital (APLD)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 20, 26, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.13, 82589.37, 3, 247768.12,
  8124.89, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'APLD' and s.is_active
where c.ticker = 'APLD' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #21 GE Vernova (GEV)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 21, 27, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.12, 60324.94, 4, 241299.75,
  286458.2, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'GEV' and s.is_active
where c.ticker = 'GEV' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #22 Viking Therapeutics (VKTX)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 22, 28, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.12, 79464.02, 3, 238392.07,
  4400.49, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'VKTX' and s.is_active
where c.ticker = 'VKTX' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #23 Strategy (MSTR)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 23, 29, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.12, 29378.98, 8, 235031.85,
  33755.46, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'MSTR' and s.is_active
where c.ticker = 'MSTR' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #24 Applied Optoelectronics (AAOI)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 24, 30, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.12, 74779.22, 3, 224337.66,
  9906.91, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'AAOI' and s.is_active
where c.ticker = 'AAOI' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #25 Meta Platforms (META)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 25, 31, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.11, 15147.14, 14, 212059.96,
  1677719.52, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'META' and s.is_active
where c.ticker = 'META' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #26 Rocket Lab (RKLB)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 26, 33, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.1, 31430.82, 6, 188584.93,
  45376.24, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'RKLB' and s.is_active
where c.ticker = 'RKLB' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #27 Netflix, Inc. (NFLX)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 27, 34, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.09, 11966.45, 15, 179496.74,
  309766.76, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'NFLX' and s.is_active
where c.ticker = 'NFLX' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #28 Sea Limited (SE)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 28, 35, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.09, 43919.2, 4, 175676.79,
  66840.01, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'SE' and s.is_active
where c.ticker = 'SE' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #29 Fiserv (FISV)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 29, 37, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.09, 56252.66, 3, 168757.98,
  26404.82, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'FISV' and s.is_active
where c.ticker = 'FISV' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #30 Arm Holdings (ARM)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 30, 39, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.08, 32542.57, 5, 162712.84,
  299180.42, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ARM' and s.is_active
where c.ticker = 'ARM' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #31 Robinhood (HOOD)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 31, 40, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.08, 19255.41, 8, 154043.29,
  102243.25, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'HOOD' and s.is_active
where c.ticker = 'HOOD' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #32 Credo Technology (CRDO)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 32, 41, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.08, 21901.31, 7, 153309.2,
  43799.68, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'CRDO' and s.is_active
where c.ticker = 'CRDO' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #33 AppLovin (APP)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 33, 42, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.08, 49322.67, 3, 147968.02,
  150989.73, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'APP' and s.is_active
where c.ticker = 'APP' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #34 Taiwan Semiconductor (TSM)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 34, 43, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.08, 21070.19, 7, 147491.32,
  null, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'TSM' and s.is_active
where c.ticker = 'TSM' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #35 AST SpaceMobile (ASTS)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 35, 44, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.07, 23841.66, 6, 143049.98,
  20539.61, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ASTS' and s.is_active
where c.ticker = 'ASTS' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #36 AMD (AMD)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 36, 45, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.07, 10182.9, 14, 142560.56,
  893451.9, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'AMD' and s.is_active
where c.ticker = 'AMD' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #37 IBM (IBM)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 37, 46, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.07, 19202.94, 7, 134420.61,
  203720.2, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'IBM' and s.is_active
where c.ticker = 'IBM' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #38 CoreWeave (CRWV)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 38, 47, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.07, 22230.44, 6, 133382.63,
  42528.08, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'CRWV' and s.is_active
where c.ticker = 'CRWV' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #39 Intel Corporation (INTC)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 39, 48, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.07, 11004.29, 12, 132051.54,
  541278.48, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'INTC' and s.is_active
where c.ticker = 'INTC' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #41 Broadcom Inc. (AVGO)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 41, 52, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.06, 8439.51, 15, 126592.71,
  1851385.38, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'AVGO' and s.is_active
where c.ticker = 'AVGO' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #42 Cipher Mining (CIFR)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 42, 55, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 26326.62, 4, 105306.47,
  8052.64, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'CIFR' and s.is_active
where c.ticker = 'CIFR' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #43 SELLAS Life Sciences (SLS)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 43, 56, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 13142.04, 8, 105136.34,
  2424.42, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'SLS' and s.is_active
where c.ticker = 'SLS' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #44 U.S. Antimony (UAMY)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 44, 58, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 20273.64, 5, 101368.21,
  922.6, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE_AMERICAN' and s.normalized_symbol = 'UAMY' and s.is_active
where c.ticker = 'UAMY' and c.exchange = 'NYSE_AMERICAN'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #45 Archer Aviation (ACHR)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 45, 59, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 14197.24, 7, 99380.71,
  3675.87, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'ACHR' and s.is_active
where c.ticker = 'ACHR' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #46 Corning (GLW)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 46, 60, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 16476.31, 6, 98857.88,
  170189.48, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'GLW' and s.is_active
where c.ticker = 'GLW' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #47 QXO, Inc. (QXO)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 47, 61, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 24430.39, 4, 97721.56,
  10278.17, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'QXO' and s.is_active
where c.ticker = 'QXO' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #48 Astera Labs (ALAB)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 48, 62, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 31952.2, 3, 95856.59,
  61964.59, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ALAB' and s.is_active
where c.ticker = 'ALAB' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #49 PayPal (PYPL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 49, 64, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 13304.22, 7, 93129.55,
  42254.04, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'PYPL' and s.is_active
where c.ticker = 'PYPL' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #50 Vertiv (VRT)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 50, 65, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.05, 17811.25, 5, 89056.24,
  116560.79, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'VRT' and s.is_active
where c.ticker = 'VRT' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #51 TeraWulf (WULF)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 51, 67, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.04, 26220.97, 3, 78662.9,
  8250.23, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'WULF' and s.is_active
where c.ticker = 'WULF' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #52 Eli Lilly (LLY)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 52, 68, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.04, 15472.1, 5, 77360.52,
  1027767.64, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'LLY' and s.is_active
where c.ticker = 'LLY' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #53 Oklo Inc. (OKLO)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 53, 69, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.04, 12265.37, 6, 73592.24,
  8036.17, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'OKLO' and s.is_active
where c.ticker = 'OKLO' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #54 Verizon (VZ)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 54, 70, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.04, 23486.78, 3, 70460.35,
  177335.99, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'VZ' and s.is_active
where c.ticker = 'VZ' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #55 Berkshire Hathaway (BRK.B)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 55, 71, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 16924.07, 4, 67696.28,
  1059394.1, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'BRK.B' and s.is_active
where c.ticker = 'BRK.A' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #56 Webull (BULL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 56, 72, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 22416.76, 3, 67250.27,
  3991.03, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'BULL' and s.is_active
where c.ticker = 'BULL' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #57 CrowdStrike Holdings, Inc. (CRWD)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 57, 73, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 20940.13, 3, 62820.38,
  214554.33, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'CRWD' and s.is_active
where c.ticker = 'CRWD' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #58 Rigetti Computing (RGTI)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 58, 74, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 7532.58, 8, 60260.61,
  5353.48, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'RGTI' and s.is_active
where c.ticker = 'RGTI' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #59 The Trade Desk (TTD)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 59, 75, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 19727.85, 3, 59183.55,
  8920.72, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'TTD' and s.is_active
where c.ticker = 'TTD' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #60 AT&T (T)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 60, 76, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 14628.06, 4, 58512.22,
  148317.5, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'T' and s.is_active
where c.ticker = 'T' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #61 GameStop (GME)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 61, 79, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 6198.82, 9, 55789.41,
  10064.34, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'GME' and s.is_active
where c.ticker = 'GME' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #62 AMC Entertainment (AMC)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 62, 80, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 4228.28, 13, 54967.59,
  1186.24, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'AMC' and s.is_active
where c.ticker = 'AMC' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #63 Galaxy Digital (GLXY)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 63, 83, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 16640.77, 3, 49922.3,
  4648.54, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'GLXY' and s.is_active
where c.ticker = 'GLXY' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #64 Enovix (ENVX)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 64, 84, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.03, 16341.67, 3, 49025,
  1072.98, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ENVX' and s.is_active
where c.ticker = 'ENVX' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #65 MercadoLibre (MELI)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 65, 85, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 16183.27, 3, 48549.8,
  94971.54, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'MELI' and s.is_active
where c.ticker = 'MELI' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #66 Adobe Inc. (ADBE)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 66, 86, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 12083.68, 4, 48334.71,
  88091.22, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ADBE' and s.is_active
where c.ticker = 'ADBE' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #67 Kratos Defense (KTOS)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 67, 87, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 6021.72, 8, 48173.75,
  9437.11, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'KTOS' and s.is_active
where c.ticker = 'KTOS' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #68 Ondas Holdings (ONDS)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 68, 88, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 5998.97, 8, 47991.74,
  3452.3, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'ONDS' and s.is_active
where c.ticker = 'ONDS' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #69 Rezolve AI (RZLV)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 69, 89, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 14623.33, 3, 43870,
  844.18, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'RZLV' and s.is_active
where c.ticker = 'RZLV' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #70 Hecla Mining (HL)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 70, 90, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 10964.02, 4, 43856.09,
  10394.52, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'HL' and s.is_active
where c.ticker = 'HL' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #71 Joby Aviation (JOBY)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 71, 91, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 8732.79, 5, 43663.94,
  7737.24, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'JOBY' and s.is_active
where c.ticker = 'JOBY' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #72 SoundHound AI (SOUN)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 72, 92, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 7141.14, 6, 42846.82,
  2841.14, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NASDAQ' and s.normalized_symbol = 'SOUN' and s.is_active
where c.ticker = 'SOUN' and c.exchange = 'NASDAQ'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

-- #73 BlackBerry (BB)
insert into public.company_retail_popularity (
  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,
  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,
  market_cap_usd_mm, ranking_method, is_featured)
select c.id, s.id, 73, 94, 'Fintel Retail Ownership - Most Widely Held Stocks', 'https://fintel.io/sro', '2026-07-15'::date,
  0.02, 9640.97, 4, 38563.89,
  6452.54, 'Fintel linked-broker panel rank; ETFs, funds, private securities, and names below approximately $500M market cap excluded', true
from public.companies c
left join public.securities s on s.exchange = 'NYSE' and s.normalized_symbol = 'BB' and s.is_active
where c.ticker = 'BB' and c.exchange = 'NYSE'
on conflict (company_id) do update set
  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,
  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,
  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,
  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,
  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,
  is_featured = excluded.is_featured, updated_at = now();

commit;
