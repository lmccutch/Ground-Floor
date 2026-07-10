-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/generate-company-bootstrap.ts from src/data/companyDirectory.ts.
-- Re-run `npm run bootstrap:generate` to regenerate after editing the directory data.
--
-- This bootstrap populates companies, securities, and company_aliases ONLY.
-- It creates no campaigns, questions, votes, followers, or users. It is safe
-- to re-run: every statement is an upsert. Apply it to a Supabase project
-- manually (CLI, dashboard SQL editor, or psql) — it is never run automatically.
--
-- Companies: 225
-- Generated: 2026-07-10

begin;

-- Apple Inc. (AAPL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Apple Inc.', 'AAPL', 'NASDAQ', 'United States', 'Technology', 'Designs, manufactures, and sells smartphones, personal computers, wearables, and related services.', 'Over $100B', 'Early shareholder campaign', true, 'Apple Inc.', 'Apple Inc.', 'apple-inc-apple', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AAPL', 'AAPL', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AAPL' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Microsoft Corporation (MSFT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Microsoft Corporation', 'MSFT', 'NASDAQ', 'United States', 'Technology', 'Develops operating systems, productivity software, cloud computing, and gaming platforms.', 'Over $100B', 'Early shareholder campaign', true, 'Microsoft Corporation', 'Microsoft Corporation', 'microsoft-corporation-micros', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MSFT', 'MSFT', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MSFT' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Alphabet (GOOGL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Alphabet', 'GOOGL', 'NASDAQ', 'United States', 'Technology', 'Parent company of Google, providing search, advertising, cloud computing, and other internet services.', 'Over $100B', 'Early shareholder campaign', true, 'Alphabet Inc.', 'Alphabet', 'alphabet-alphab', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GOOGL', 'GOOGL', 'NASDAQ', true, true, false, 'Class A', 'admin'
from public.companies c where c.ticker = 'GOOGL' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GOOG', 'GOOG', 'NASDAQ', false, true, false, 'Class C', 'admin'
from public.companies c where c.ticker = 'GOOGL' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Amazon.com, Inc. (AMZN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Amazon.com, Inc.', 'AMZN', 'NASDAQ', 'United States', 'Technology', 'Operates online retail, cloud computing (AWS), digital advertising, and logistics businesses.', 'Over $100B', 'Early shareholder campaign', true, 'Amazon.com, Inc.', 'Amazon.com, Inc.', 'amazon-com-inc-amazon', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMZN', 'AMZN', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMZN' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Meta Platforms (META)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Meta Platforms', 'META', 'NASDAQ', 'United States', 'Technology', 'Operates Facebook, Instagram, and WhatsApp, and develops virtual and augmented reality products.', 'Over $100B', 'Early shareholder campaign', true, 'Meta Platforms, Inc.', 'Meta Platforms', 'meta-platforms-metapl', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'META', 'META', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'META' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'FB', 'FB', 'former_ticker', 'admin'
from public.companies c where c.ticker = 'META' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'Facebook, Inc.', 'facebook, inc.', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'META' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'Facebook', 'facebook', 'brand_name', 'admin'
from public.companies c where c.ticker = 'META' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- NVIDIA Corporation (NVDA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('NVIDIA Corporation', 'NVDA', 'NASDAQ', 'United States', 'Technology', 'Designs graphics processors and AI computing hardware and software platforms.', 'Over $100B', 'Early shareholder campaign', true, 'NVIDIA Corporation', 'NVIDIA Corporation', 'nvidia-corporation-nvidia', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NVDA', 'NVDA', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NVDA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Adobe Inc. (ADBE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Adobe Inc.', 'ADBE', 'NASDAQ', 'United States', 'Technology', 'Develops creative, document, and digital-marketing software.', '$25B-$100B', 'Early shareholder campaign', true, 'Adobe Inc.', 'Adobe Inc.', 'adobe-inc-adobe', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ADBE', 'ADBE', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ADBE' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Salesforce, Inc. (CRM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Salesforce, Inc.', 'CRM', 'NYSE', 'United States', 'Technology', 'Provides cloud-based customer relationship management and enterprise software.', '$25B-$100B', 'Early shareholder campaign', true, 'Salesforce, Inc.', 'Salesforce, Inc.', 'salesforce-inc-salesf', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CRM', 'CRM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CRM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Oracle Corporation (ORCL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Oracle Corporation', 'ORCL', 'NYSE', 'United States', 'Technology', 'Develops database software, cloud infrastructure, and enterprise applications.', 'Over $100B', 'Early shareholder campaign', true, 'Oracle Corporation', 'Oracle Corporation', 'oracle-corporation-oracle', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ORCL', 'ORCL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ORCL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Intel Corporation (INTC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Intel Corporation', 'INTC', 'NASDAQ', 'United States', 'Technology', 'Designs and manufactures semiconductors and computing hardware.', '$25B-$100B', 'Early shareholder campaign', true, 'Intel Corporation', 'Intel Corporation', 'intel-corporation-intel', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'INTC', 'INTC', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'INTC' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Cisco Systems, Inc. (CSCO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Cisco Systems, Inc.', 'CSCO', 'NASDAQ', 'United States', 'Technology', 'Manufactures networking hardware, software, and cybersecurity products.', '$25B-$100B', 'Early shareholder campaign', true, 'Cisco Systems, Inc.', 'Cisco Systems, Inc.', 'cisco-systems-inc-cisco', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CSCO', 'CSCO', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CSCO' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- IBM (IBM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('IBM', 'IBM', 'NYSE', 'United States', 'Technology', 'Provides enterprise IT infrastructure, consulting, and hybrid-cloud software.', 'Over $100B', 'Early shareholder campaign', true, 'International Business Machines Corporation', 'IBM', 'ibm-ibm', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'IBM', 'IBM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'IBM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Qualcomm (QCOM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Qualcomm', 'QCOM', 'NASDAQ', 'United States', 'Technology', 'Designs semiconductors and wireless technology for mobile devices.', '$25B-$100B', 'Early shareholder campaign', true, 'QUALCOMM Incorporated', 'Qualcomm', 'qualcomm-qualco', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'QCOM', 'QCOM', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'QCOM' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Texas Instruments (TXN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Texas Instruments', 'TXN', 'NASDAQ', 'United States', 'Technology', 'Designs and manufactures analog and embedded processing semiconductors.', '$25B-$100B', 'Early shareholder campaign', true, 'Texas Instruments Incorporated', 'Texas Instruments', 'texas-instruments-texasi', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TXN', 'TXN', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TXN' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Broadcom Inc. (AVGO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Broadcom Inc.', 'AVGO', 'NASDAQ', 'United States', 'Technology', 'Designs semiconductors and infrastructure software for networking and data centers.', 'Over $100B', 'Early shareholder campaign', true, 'Broadcom Inc.', 'Broadcom Inc.', 'broadcom-inc-broadc', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AVGO', 'AVGO', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AVGO' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- AMD (AMD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('AMD', 'AMD', 'NASDAQ', 'United States', 'Technology', 'Designs microprocessors and graphics processors for computing and gaming.', '$25B-$100B', 'Early shareholder campaign', true, 'Advanced Micro Devices, Inc.', 'AMD', 'amd-amd', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMD', 'AMD', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- ServiceNow, Inc. (NOW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('ServiceNow, Inc.', 'NOW', 'NYSE', 'United States', 'Technology', 'Provides cloud-based workflow automation software for enterprises.', '$25B-$100B', 'Early shareholder campaign', true, 'ServiceNow, Inc.', 'ServiceNow, Inc.', 'servicenow-inc-servic', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NOW', 'NOW', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NOW' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Workday, Inc. (WDAY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Workday, Inc.', 'WDAY', 'NASDAQ', 'United States', 'Technology', 'Provides cloud-based finance and human-capital-management software.', '$5B-$25B', 'Early shareholder campaign', true, 'Workday, Inc.', 'Workday, Inc.', 'workday-inc-workda', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WDAY', 'WDAY', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WDAY' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Palo Alto Networks (PANW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Palo Alto Networks', 'PANW', 'NASDAQ', 'United States', 'Technology', 'Provides cybersecurity platforms for network, cloud, and endpoint security.', '$25B-$100B', 'Early shareholder campaign', true, 'Palo Alto Networks, Inc.', 'Palo Alto Networks', 'palo-alto-networks-paloal', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PANW', 'PANW', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PANW' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- CrowdStrike Holdings, Inc. (CRWD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('CrowdStrike Holdings, Inc.', 'CRWD', 'NASDAQ', 'United States', 'Technology', 'Provides cloud-delivered endpoint and threat-detection security software.', '$25B-$100B', 'Early shareholder campaign', true, 'CrowdStrike Holdings, Inc.', 'CrowdStrike Holdings, Inc.', 'crowdstrike-holdings-inc-crowds', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CRWD', 'CRWD', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CRWD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Shopify Inc. (SHOP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Shopify Inc.', 'SHOP', 'NYSE', 'Canada', 'Technology', 'Provides e-commerce software that lets merchants build and manage online stores.', '$25B-$100B', 'Early shareholder campaign', true, 'Shopify Inc.', 'Shopify Inc.', 'shopify-inc-shopif', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SHOP', 'SHOP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SHOP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- SAP SE (SAP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('SAP SE', 'SAP', 'NYSE', 'Germany', 'Technology', 'Develops enterprise resource planning and business-application software.', 'Over $100B', 'Early shareholder campaign', true, 'SAP SE', 'SAP SE', 'sap-se-sap', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SAP', 'SAP', 'NYSE', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'SAP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Snowflake Inc. (SNOW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Snowflake Inc.', 'SNOW', 'NYSE', 'United States', 'Technology', 'Provides a cloud-based data platform for storage, analytics, and sharing.', '$25B-$100B', 'Early shareholder campaign', true, 'Snowflake Inc.', 'Snowflake Inc.', 'snowflake-inc-snowfl', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SNOW', 'SNOW', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SNOW' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Palantir Technologies Inc. (PLTR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Palantir Technologies Inc.', 'PLTR', 'NYSE', 'United States', 'Technology', 'Builds data-integration and analytics software for government and commercial customers.', 'Over $100B', 'Early shareholder campaign', true, 'Palantir Technologies Inc.', 'Palantir Technologies Inc.', 'palantir-technologies-inc-palant', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PLTR', 'PLTR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PLTR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Uber Technologies, Inc. (UBER)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Uber Technologies, Inc.', 'UBER', 'NYSE', 'United States', 'Technology', 'Operates ride-hailing, food-delivery, and freight marketplace platforms.', '$25B-$100B', 'Early shareholder campaign', true, 'Uber Technologies, Inc.', 'Uber Technologies, Inc.', 'uber-technologies-inc-uber', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UBER', 'UBER', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'UBER' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Airbnb, Inc. (ABNB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Airbnb, Inc.', 'ABNB', 'NASDAQ', 'United States', 'Technology', 'Operates an online marketplace for short-term lodging and experiences.', '$25B-$100B', 'Early shareholder campaign', true, 'Airbnb, Inc.', 'Airbnb, Inc.', 'airbnb-inc-airbnb', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ABNB', 'ABNB', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ABNB' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- DoorDash, Inc. (DASH)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('DoorDash, Inc.', 'DASH', 'NASDAQ', 'United States', 'Technology', 'Operates a local commerce and food-delivery logistics platform.', '$25B-$100B', 'Early shareholder campaign', true, 'DoorDash, Inc.', 'DoorDash, Inc.', 'doordash-inc-doorda', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DASH', 'DASH', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DASH' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Micron Technology (MU)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Micron Technology', 'MU', 'NASDAQ', 'United States', 'Technology', 'Manufactures memory and storage semiconductors.', '$25B-$100B', 'Early shareholder campaign', true, 'Micron Technology, Inc.', 'Micron Technology', 'micron-technology-micron', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MU', 'MU', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MU' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Applied Materials, Inc. (AMAT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Applied Materials, Inc.', 'AMAT', 'NASDAQ', 'United States', 'Technology', 'Manufactures equipment used to fabricate semiconductors and displays.', '$25B-$100B', 'Early shareholder campaign', true, 'Applied Materials, Inc.', 'Applied Materials, Inc.', 'applied-materials-inc-applie', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMAT', 'AMAT', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMAT' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Lam Research Corporation (LRCX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Lam Research Corporation', 'LRCX', 'NASDAQ', 'United States', 'Technology', 'Manufactures wafer-fabrication equipment for the semiconductor industry.', '$25B-$100B', 'Early shareholder campaign', true, 'Lam Research Corporation', 'Lam Research Corporation', 'lam-research-corporation-lamres', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LRCX', 'LRCX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'LRCX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- KLA (KLAC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('KLA', 'KLAC', 'NASDAQ', 'United States', 'Technology', 'Manufactures process-control and yield-management systems for semiconductor manufacturing.', '$25B-$100B', 'Early shareholder campaign', true, 'KLA Corporation', 'KLA', 'kla-kla', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KLAC', 'KLAC', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KLAC' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Analog Devices, Inc. (ADI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Analog Devices, Inc.', 'ADI', 'NASDAQ', 'United States', 'Technology', 'Designs analog, mixed-signal, and digital signal processing semiconductors.', '$25B-$100B', 'Early shareholder campaign', true, 'Analog Devices, Inc.', 'Analog Devices, Inc.', 'analog-devices-inc-analog', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ADI', 'ADI', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ADI' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Synopsys, Inc. (SNPS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Synopsys, Inc.', 'SNPS', 'NASDAQ', 'United States', 'Technology', 'Provides electronic design automation software for chip design.', '$25B-$100B', 'Early shareholder campaign', true, 'Synopsys, Inc.', 'Synopsys, Inc.', 'synopsys-inc-synops', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SNPS', 'SNPS', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SNPS' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Cadence Design Systems (CDNS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Cadence Design Systems', 'CDNS', 'NASDAQ', 'United States', 'Technology', 'Provides electronic design automation software and IP for chip and system design.', '$25B-$100B', 'Early shareholder campaign', true, 'Cadence Design Systems, Inc.', 'Cadence Design Systems', 'cadence-design-systems-cadenc', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CDNS', 'CDNS', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CDNS' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Autodesk, Inc. (ADSK)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Autodesk, Inc.', 'ADSK', 'NASDAQ', 'United States', 'Technology', 'Develops design and engineering software for architecture, construction, and manufacturing.', '$25B-$100B', 'Early shareholder campaign', true, 'Autodesk, Inc.', 'Autodesk, Inc.', 'autodesk-inc-autode', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ADSK', 'ADSK', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ADSK' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Intuit Inc. (INTU)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Intuit Inc.', 'INTU', 'NASDAQ', 'United States', 'Technology', 'Develops financial and tax software including TurboTax and QuickBooks.', 'Over $100B', 'Early shareholder campaign', true, 'Intuit Inc.', 'Intuit Inc.', 'intuit-inc-intuit', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'INTU', 'INTU', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'INTU' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Booking Holdings (BKNG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Booking Holdings', 'BKNG', 'NASDAQ', 'United States', 'Technology', 'Operates online travel and reservation platforms including Booking.com and Priceline.', 'Over $100B', 'Early shareholder campaign', true, 'Booking Holdings Inc.', 'Booking Holdings', 'booking-holdings-bookin', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BKNG', 'BKNG', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BKNG' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Netflix, Inc. (NFLX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Netflix, Inc.', 'NFLX', 'NASDAQ', 'United States', 'Technology', 'Operates a subscription streaming service for films and television series.', 'Over $100B', 'Early shareholder campaign', true, 'Netflix, Inc.', 'Netflix, Inc.', 'netflix-inc-netfli', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NFLX', 'NFLX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NFLX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Datadog, Inc. (DDOG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Datadog, Inc.', 'DDOG', 'NASDAQ', 'United States', 'Technology', 'Provides cloud-monitoring and observability software for infrastructure and applications.', '$25B-$100B', 'Early shareholder campaign', true, 'Datadog, Inc.', 'Datadog, Inc.', 'datadog-inc-datado', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DDOG', 'DDOG', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DDOG' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- MongoDB, Inc. (MDB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('MongoDB, Inc.', 'MDB', 'NASDAQ', 'United States', 'Technology', 'Develops a general-purpose document database platform.', '$5B-$25B', 'Early shareholder campaign', true, 'MongoDB, Inc.', 'MongoDB, Inc.', 'mongodb-inc-mongod', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MDB', 'MDB', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MDB' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Zoom (ZM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Zoom', 'ZM', 'NASDAQ', 'United States', 'Technology', 'Provides video conferencing and unified communications software.', '$5B-$25B', 'Early shareholder campaign', true, 'Zoom Communications, Inc.', 'Zoom', 'zoom-zoom', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ZM', 'ZM', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ZM' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Atlassian Corporation (TEAM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Atlassian Corporation', 'TEAM', 'NASDAQ', 'Australia', 'Technology', 'Develops collaboration and software-development tools including Jira and Confluence.', '$25B-$100B', 'Early shareholder campaign', true, 'Atlassian Corporation', 'Atlassian Corporation', 'atlassian-corporation-atlass', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TEAM', 'TEAM', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TEAM' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Spotify (SPOT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Spotify', 'SPOT', 'NYSE', 'Luxembourg', 'Technology', 'Operates an audio streaming platform for music and podcasts.', '$25B-$100B', 'Early shareholder campaign', true, 'Spotify Technology S.A.', 'Spotify', 'spotify-spotif', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SPOT', 'SPOT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SPOT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- MercadoLibre (MELI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('MercadoLibre', 'MELI', 'NASDAQ', 'Argentina', 'Technology', 'Operates e-commerce and fintech platforms across Latin America.', '$25B-$100B', 'Early shareholder campaign', true, 'MercadoLibre, Inc.', 'MercadoLibre', 'mercadolibre-mercad', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MELI', 'MELI', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MELI' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- JPMorgan Chase (JPM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('JPMorgan Chase', 'JPM', 'NYSE', 'United States', 'Financial services', 'Operates a global bank offering consumer, commercial, and investment banking services.', 'Over $100B', 'Early shareholder campaign', true, 'JPMorgan Chase & Co.', 'JPMorgan Chase', 'jpmorgan-chase-jpmorg', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'JPM', 'JPM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'JPM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Bank of America (BAC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Bank of America', 'BAC', 'NYSE', 'United States', 'Financial services', 'Provides consumer and commercial banking, wealth management, and investment banking.', 'Over $100B', 'Early shareholder campaign', true, 'Bank of America Corporation', 'Bank of America', 'bank-of-america-bankof', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BAC', 'BAC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BAC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Wells Fargo & Company (WFC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Wells Fargo & Company', 'WFC', 'NYSE', 'United States', 'Financial services', 'Provides consumer and commercial banking and financial services.', 'Over $100B', 'Early shareholder campaign', true, 'Wells Fargo & Company', 'Wells Fargo & Company', 'wells-fargo-company-wellsf', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WFC', 'WFC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WFC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Citigroup Inc. (C)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Citigroup Inc.', 'C', 'NYSE', 'United States', 'Financial services', 'Operates a global bank offering consumer and institutional financial services.', 'Over $100B', 'Early shareholder campaign', true, 'Citigroup Inc.', 'Citigroup Inc.', 'citigroup-inc-citigr', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'C', 'C', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'C' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Goldman Sachs (GS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Goldman Sachs', 'GS', 'NYSE', 'United States', 'Financial services', 'Provides investment banking, securities, and investment management services.', 'Over $100B', 'Early shareholder campaign', true, 'The Goldman Sachs Group, Inc.', 'Goldman Sachs', 'goldman-sachs-goldma', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GS', 'GS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Morgan Stanley (MS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Morgan Stanley', 'MS', 'NYSE', 'United States', 'Financial services', 'Provides investment banking, wealth management, and institutional securities services.', 'Over $100B', 'Early shareholder campaign', true, 'Morgan Stanley', 'Morgan Stanley', 'morgan-stanley-morgan', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MS', 'MS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Berkshire Hathaway (BRK.A)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Berkshire Hathaway', 'BRK.A', 'NYSE', 'United States', 'Financial services', 'A diversified holding company with insurance, railroad, energy, and manufacturing operations.', 'Over $100B', 'Early shareholder campaign', true, 'Berkshire Hathaway Inc.', 'Berkshire Hathaway', 'berkshire-hathaway-berksh', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BRK.A', 'BRK.A', 'NYSE', true, true, false, 'Class A', 'admin'
from public.companies c where c.ticker = 'BRK.A' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BRK.B', 'BRK.B', 'NYSE', false, true, false, 'Class B', 'admin'
from public.companies c where c.ticker = 'BRK.A' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- American Express (AXP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('American Express', 'AXP', 'NYSE', 'United States', 'Financial services', 'Issues charge and credit cards and provides merchant payment services.', 'Over $100B', 'Early shareholder campaign', true, 'American Express Company', 'American Express', 'american-express-americ', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AXP', 'AXP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AXP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Visa Inc. (V)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Visa Inc.', 'V', 'NYSE', 'United States', 'Financial services', 'Operates a global electronic payments network.', 'Over $100B', 'Early shareholder campaign', true, 'Visa Inc.', 'Visa Inc.', 'visa-inc-visa', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'V', 'V', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'V' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Mastercard Incorporated (MA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Mastercard Incorporated', 'MA', 'NYSE', 'United States', 'Financial services', 'Operates a global electronic payments network.', 'Over $100B', 'Early shareholder campaign', true, 'Mastercard Incorporated', 'Mastercard Incorporated', 'mastercard-incorporated-master', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MA', 'MA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- PayPal (PYPL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('PayPal', 'PYPL', 'NASDAQ', 'United States', 'Financial services', 'Operates a digital payments and money-transfer platform.', '$25B-$100B', 'Early shareholder campaign', true, 'PayPal Holdings, Inc.', 'PayPal', 'paypal-paypal', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PYPL', 'PYPL', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PYPL' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- SoFi Technologies (SOFI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('SoFi Technologies', 'SOFI', 'NASDAQ', 'United States', 'Financial services', 'Provides digital banking, lending, and investing products.', '$5B-$25B', 'Early shareholder campaign', true, 'SoFi Technologies, Inc.', 'SoFi Technologies', 'sofi-technologies-sofi', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SOFI', 'SOFI', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SOFI' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Charles Schwab (SCHW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Charles Schwab', 'SCHW', 'NYSE', 'United States', 'Financial services', 'Provides brokerage, banking, and wealth-management services.', 'Over $100B', 'Early shareholder campaign', true, 'The Charles Schwab Corporation', 'Charles Schwab', 'charles-schwab-charle', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SCHW', 'SCHW', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SCHW' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- BlackRock, Inc. (BLK)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('BlackRock, Inc.', 'BLK', 'NYSE', 'United States', 'Financial services', 'Provides investment management and financial technology services.', 'Over $100B', 'Early shareholder campaign', true, 'BlackRock, Inc.', 'BlackRock, Inc.', 'blackrock-inc-blackr', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BLK', 'BLK', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BLK' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- U.S. Bancorp (USB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('U.S. Bancorp', 'USB', 'NYSE', 'United States', 'Financial services', 'Operates a regional bank holding company offering consumer and commercial banking.', '$25B-$100B', 'Early shareholder campaign', true, 'U.S. Bancorp', 'U.S. Bancorp', 'u-s-bancorp-usbanc', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'USB', 'USB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'USB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- PNC Financial Services (PNC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('PNC Financial Services', 'PNC', 'NYSE', 'United States', 'Financial services', 'Provides regional banking, asset management, and corporate banking services.', '$25B-$100B', 'Early shareholder campaign', true, 'The PNC Financial Services Group, Inc.', 'PNC Financial Services', 'pnc-financial-services-pncfin', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PNC', 'PNC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PNC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Truist Financial (TFC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Truist Financial', 'TFC', 'NYSE', 'United States', 'Financial services', 'Provides regional consumer and commercial banking services.', '$25B-$100B', 'Early shareholder campaign', true, 'Truist Financial Corporation', 'Truist Financial', 'truist-financial-truist', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TFC', 'TFC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TFC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Capital One (COF)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Capital One', 'COF', 'NYSE', 'United States', 'Financial services', 'Provides credit cards, consumer banking, and commercial banking services.', '$25B-$100B', 'Early shareholder campaign', true, 'Capital One Financial Corporation', 'Capital One', 'capital-one-capita', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'COF', 'COF', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'COF' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Discover Financial Services (DFS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Discover Financial Services', 'DFS', 'NYSE', 'United States', 'Financial services', 'Issues credit cards and operates a payments network and direct bank.', '$25B-$100B', 'Early shareholder campaign', true, 'Discover Financial Services', 'Discover Financial Services', 'discover-financial-services-discov', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DFS', 'DFS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DFS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- MetLife (MET)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('MetLife', 'MET', 'NYSE', 'United States', 'Financial services', 'Provides life insurance, annuities, and employee benefits.', '$25B-$100B', 'Early shareholder campaign', true, 'MetLife, Inc.', 'MetLife', 'metlife-metlif', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MET', 'MET', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MET' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Prudential Financial (PRU)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Prudential Financial', 'PRU', 'NYSE', 'United States', 'Financial services', 'Provides life insurance, annuities, and investment management services.', '$25B-$100B', 'Early shareholder campaign', true, 'Prudential Financial, Inc.', 'Prudential Financial', 'prudential-financial-pruden', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PRU', 'PRU', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PRU' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Aon plc (AON)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Aon plc', 'AON', 'NYSE', 'Ireland', 'Financial services', 'Provides insurance brokerage, risk management, and consulting services.', '$25B-$100B', 'Early shareholder campaign', true, 'Aon plc', 'Aon plc', 'aon-plc-aon', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AON', 'AON', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AON' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Marsh & McLennan (MMC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Marsh & McLennan', 'MMC', 'NYSE', 'United States', 'Financial services', 'Provides insurance brokerage, risk management, and consulting services.', '$25B-$100B', 'Early shareholder campaign', true, 'Marsh & McLennan Companies, Inc.', 'Marsh & McLennan', 'marsh-mclennan-marshm', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MMC', 'MMC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MMC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Progressive (PGR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Progressive', 'PGR', 'NYSE', 'United States', 'Financial services', 'Underwrites auto, home, and commercial insurance.', 'Over $100B', 'Early shareholder campaign', true, 'The Progressive Corporation', 'Progressive', 'progressive-progre', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PGR', 'PGR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PGR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Chubb Limited (CB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Chubb Limited', 'CB', 'NYSE', 'Switzerland', 'Financial services', 'Underwrites property, casualty, and specialty insurance.', '$25B-$100B', 'Early shareholder campaign', true, 'Chubb Limited', 'Chubb Limited', 'chubb-limited-chubb', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CB', 'CB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Royal Bank of Canada (RY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Royal Bank of Canada', 'RY', 'NYSE', 'Canada', 'Financial services', 'Operates a diversified Canadian bank offering personal, commercial, and investment banking.', 'Over $100B', 'Early shareholder campaign', true, 'Royal Bank of Canada', 'Royal Bank of Canada', 'royal-bank-of-canada-royalb', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'RY', 'RY', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'RY' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- TD Bank Group (TD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('TD Bank Group', 'TD', 'NYSE', 'Canada', 'Financial services', 'Operates a diversified Canadian and U.S. bank.', '$25B-$100B', 'Early shareholder campaign', true, 'The Toronto-Dominion Bank', 'TD Bank Group', 'td-bank-group-tdbank', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TD', 'TD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Intercontinental Exchange (ICE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Intercontinental Exchange', 'ICE', 'NYSE', 'United States', 'Financial services', 'Operates financial exchanges, clearing houses, and mortgage-technology platforms.', '$25B-$100B', 'Early shareholder campaign', true, 'Intercontinental Exchange, Inc.', 'Intercontinental Exchange', 'intercontinental-exchange-ice', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ICE', 'ICE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ICE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- CME Group (CME)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('CME Group', 'CME', 'NASDAQ', 'United States', 'Financial services', 'Operates derivatives and futures exchanges.', '$25B-$100B', 'Early shareholder campaign', true, 'CME Group Inc.', 'CME Group', 'cme-group-cmegro', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CME', 'CME', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CME' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Moody's (MCO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Moody''s', 'MCO', 'NYSE', 'United States', 'Financial services', 'Provides credit ratings, research, and risk-analysis tools.', '$25B-$100B', 'Early shareholder campaign', true, 'Moody''s Corporation', 'Moody''s', 'moody-s-moodys', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MCO', 'MCO', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MCO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- S&P Global (SPGI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('S&P Global', 'SPGI', 'NYSE', 'United States', 'Financial services', 'Provides credit ratings, market-data, and index services.', 'Over $100B', 'Early shareholder campaign', true, 'S&P Global Inc.', 'S&P Global', 's-p-global-spglob', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SPGI', 'SPGI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SPGI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Ameriprise Financial (AMP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Ameriprise Financial', 'AMP', 'NYSE', 'United States', 'Financial services', 'Provides financial planning, asset management, and insurance services.', '$25B-$100B', 'Early shareholder campaign', true, 'Ameriprise Financial, Inc.', 'Ameriprise Financial', 'ameriprise-financial-amerip', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMP', 'AMP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Synchrony Financial (SYF)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Synchrony Financial', 'SYF', 'NYSE', 'United States', 'Financial services', 'Provides consumer financing and private-label credit card programs.', '$5B-$25B', 'Early shareholder campaign', true, 'Synchrony Financial', 'Synchrony Financial', 'synchrony-financial-synchr', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SYF', 'SYF', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SYF' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Fifth Third Bancorp (FITB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Fifth Third Bancorp', 'FITB', 'NASDAQ', 'United States', 'Financial services', 'Operates a regional bank holding company in the Midwest and Southeast.', '$5B-$25B', 'Early shareholder campaign', true, 'Fifth Third Bancorp', 'Fifth Third Bancorp', 'fifth-third-bancorp-fiftht', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'FITB', 'FITB', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'FITB' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- M&T Bank (MTB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('M&T Bank', 'MTB', 'NYSE', 'United States', 'Financial services', 'Operates a regional bank holding company in the Northeast and Mid-Atlantic.', '$5B-$25B', 'Early shareholder campaign', true, 'M&T Bank Corporation', 'M&T Bank', 'm-t-bank-mtbank', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MTB', 'MTB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MTB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- ExxonMobil (XOM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('ExxonMobil', 'XOM', 'NYSE', 'United States', 'Energy', 'Explores for, produces, and refines oil and natural gas.', 'Over $100B', 'Early shareholder campaign', true, 'Exxon Mobil Corporation', 'ExxonMobil', 'exxonmobil-exxonm', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'XOM', 'XOM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'XOM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Chevron Corporation (CVX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Chevron Corporation', 'CVX', 'NYSE', 'United States', 'Energy', 'Explores for, produces, and refines oil and natural gas.', 'Over $100B', 'Early shareholder campaign', true, 'Chevron Corporation', 'Chevron Corporation', 'chevron-corporation-chevro', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CVX', 'CVX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CVX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- ConocoPhillips (COP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('ConocoPhillips', 'COP', 'NYSE', 'United States', 'Energy', 'Explores for and produces crude oil and natural gas.', 'Over $100B', 'Early shareholder campaign', true, 'ConocoPhillips', 'ConocoPhillips', 'conocophillips-conoco', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'COP', 'COP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'COP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Occidental Petroleum (OXY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Occidental Petroleum', 'OXY', 'NYSE', 'United States', 'Energy', 'Explores for and produces oil and natural gas, and operates chemical manufacturing.', '$25B-$100B', 'Early shareholder campaign', true, 'Occidental Petroleum Corporation', 'Occidental Petroleum', 'occidental-petroleum-occide', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'OXY', 'OXY', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'OXY' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- SLB (SLB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('SLB', 'SLB', 'NYSE', 'United States', 'Energy', 'Provides technology and services for oil and gas exploration and production.', '$25B-$100B', 'Early shareholder campaign', true, 'SLB', 'SLB', 'slb-slb', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SLB', 'SLB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SLB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Marathon Petroleum (MPC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Marathon Petroleum', 'MPC', 'NYSE', 'United States', 'Energy', 'Refines, transports, and markets petroleum products.', '$25B-$100B', 'Early shareholder campaign', true, 'Marathon Petroleum Corporation', 'Marathon Petroleum', 'marathon-petroleum-marath', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MPC', 'MPC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MPC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Valero Energy (VLO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Valero Energy', 'VLO', 'NYSE', 'United States', 'Energy', 'Refines and markets petroleum and renewable fuel products.', '$25B-$100B', 'Early shareholder campaign', true, 'Valero Energy Corporation', 'Valero Energy', 'valero-energy-valero', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VLO', 'VLO', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'VLO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Phillips 66 (PSX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Phillips 66', 'PSX', 'NYSE', 'United States', 'Energy', 'Refines, transports, and markets petroleum and chemical products.', '$25B-$100B', 'Early shareholder campaign', true, 'Phillips 66', 'Phillips 66', 'phillips-66-philli', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PSX', 'PSX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PSX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- EOG Resources (EOG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('EOG Resources', 'EOG', 'NYSE', 'United States', 'Energy', 'Explores for and produces crude oil and natural gas.', '$25B-$100B', 'Early shareholder campaign', true, 'EOG Resources, Inc.', 'EOG Resources', 'eog-resources-eogres', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EOG', 'EOG', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EOG' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Williams Companies (WMB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Williams Companies', 'WMB', 'NYSE', 'United States', 'Energy', 'Gathers, processes, and transports natural gas through pipeline infrastructure.', '$25B-$100B', 'Early shareholder campaign', true, 'The Williams Companies, Inc.', 'Williams Companies', 'williams-companies-willia', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WMB', 'WMB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WMB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Kinder Morgan (KMI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Kinder Morgan', 'KMI', 'NYSE', 'United States', 'Energy', 'Operates energy infrastructure including pipelines and terminals.', '$25B-$100B', 'Early shareholder campaign', true, 'Kinder Morgan, Inc.', 'Kinder Morgan', 'kinder-morgan-kinder', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KMI', 'KMI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KMI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Baker Hughes (BKR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Baker Hughes', 'BKR', 'NASDAQ', 'United States', 'Energy', 'Provides oilfield services, equipment, and energy technology.', '$25B-$100B', 'Early shareholder campaign', true, 'Baker Hughes Company', 'Baker Hughes', 'baker-hughes-bakerh', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BKR', 'BKR', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BKR' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Halliburton Company (HAL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Halliburton Company', 'HAL', 'NYSE', 'United States', 'Energy', 'Provides products and services for oil and gas exploration and production.', '$5B-$25B', 'Early shareholder campaign', true, 'Halliburton Company', 'Halliburton Company', 'halliburton-company-hallib', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HAL', 'HAL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HAL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Devon Energy (DVN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Devon Energy', 'DVN', 'NYSE', 'United States', 'Energy', 'Explores for and produces crude oil and natural gas.', '$5B-$25B', 'Early shareholder campaign', true, 'Devon Energy Corporation', 'Devon Energy', 'devon-energy-devone', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DVN', 'DVN', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DVN' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Enbridge Inc. (ENB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Enbridge Inc.', 'ENB', 'NYSE', 'Canada', 'Energy', 'Operates crude oil and natural gas pipeline and midstream infrastructure.', '$25B-$100B', 'Early shareholder campaign', true, 'Enbridge Inc.', 'Enbridge Inc.', 'enbridge-inc-enbrid', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ENB', 'ENB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ENB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Suncor Energy (SU)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Suncor Energy', 'SU', 'NYSE', 'Canada', 'Energy', 'Produces synthetic crude oil from oil sands and operates refining and retail fuel businesses.', '$25B-$100B', 'Early shareholder campaign', true, 'Suncor Energy Inc.', 'Suncor Energy', 'suncor-energy-suncor', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SU', 'SU', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SU' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Targa Resources (TRGP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Targa Resources', 'TRGP', 'NYSE', 'United States', 'Energy', 'Gathers, processes, and transports natural gas liquids.', '$25B-$100B', 'Early shareholder campaign', true, 'Targa Resources Corp.', 'Targa Resources', 'targa-resources-targar', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TRGP', 'TRGP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TRGP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- ONEOK, Inc. (OKE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('ONEOK, Inc.', 'OKE', 'NYSE', 'United States', 'Energy', 'Gathers, processes, and transports natural gas and natural gas liquids.', '$25B-$100B', 'Early shareholder campaign', true, 'ONEOK, Inc.', 'ONEOK, Inc.', 'oneok-inc-oneok', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'OKE', 'OKE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'OKE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Coterra Energy (CTRA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Coterra Energy', 'CTRA', 'NYSE', 'United States', 'Energy', 'Explores for and produces crude oil and natural gas.', '$5B-$25B', 'Early shareholder campaign', true, 'Coterra Energy Inc.', 'Coterra Energy', 'coterra-energy-coterr', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CTRA', 'CTRA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CTRA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Freeport-McMoRan (FCX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Freeport-McMoRan', 'FCX', 'NYSE', 'United States', 'Mining', 'Mines copper, gold, and molybdenum.', '$25B-$100B', 'Early shareholder campaign', true, 'Freeport-McMoRan Inc.', 'Freeport-McMoRan', 'freeport-mcmoran-freepo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'FCX', 'FCX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'FCX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Newmont Corporation (NEM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Newmont Corporation', 'NEM', 'NYSE', 'United States', 'Mining', 'Mines gold and copper.', '$25B-$100B', 'Early shareholder campaign', true, 'Newmont Corporation', 'Newmont Corporation', 'newmont-corporation-newmon', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NEM', 'NEM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NEM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Barrick Gold (GOLD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Barrick Gold', 'GOLD', 'NYSE', 'Canada', 'Mining', 'Mines gold and copper.', '$25B-$100B', 'Early shareholder campaign', true, 'Barrick Mining Corporation', 'Barrick Gold', 'barrick-gold-barric', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GOLD', 'GOLD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GOLD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Southern Copper (SCCO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Southern Copper', 'SCCO', 'NYSE', 'United States', 'Mining', 'Mines and processes copper and other base metals.', '$25B-$100B', 'Early shareholder campaign', true, 'Southern Copper Corporation', 'Southern Copper', 'southern-copper-southe', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SCCO', 'SCCO', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SCCO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Albemarle Corporation (ALB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Albemarle Corporation', 'ALB', 'NYSE', 'United States', 'Mining', 'Produces lithium and other specialty chemicals for batteries and industrial uses.', '$5B-$25B', 'Early shareholder campaign', true, 'Albemarle Corporation', 'Albemarle Corporation', 'albemarle-corporation-albema', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ALB', 'ALB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ALB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Nucor Corporation (NUE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Nucor Corporation', 'NUE', 'NYSE', 'United States', 'Mining', 'Manufactures steel and steel products.', '$25B-$100B', 'Early shareholder campaign', true, 'Nucor Corporation', 'Nucor Corporation', 'nucor-corporation-nucor', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NUE', 'NUE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NUE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Steel Dynamics (STLD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Steel Dynamics', 'STLD', 'NASDAQ', 'United States', 'Mining', 'Manufactures steel and metal recycling.', '$5B-$25B', 'Early shareholder campaign', true, 'Steel Dynamics, Inc.', 'Steel Dynamics', 'steel-dynamics-steeld', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'STLD', 'STLD', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'STLD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Alcoa Corporation (AA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Alcoa Corporation', 'AA', 'NYSE', 'United States', 'Mining', 'Produces bauxite, alumina, and aluminum products.', '$5B-$25B', 'Early shareholder campaign', true, 'Alcoa Corporation', 'Alcoa Corporation', 'alcoa-corporation-alcoa', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AA', 'AA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Vale S.A. (VALE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Vale S.A.', 'VALE', 'NYSE', 'Brazil', 'Mining', 'Mines iron ore, nickel, and other base metals.', '$25B-$100B', 'Early shareholder campaign', true, 'Vale S.A.', 'Vale S.A.', 'vale-s-a-vale', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VALE', 'VALE', 'NYSE', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'VALE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Rio Tinto (RIO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Rio Tinto', 'RIO', 'NYSE', 'United Kingdom', 'Mining', 'Mines iron ore, aluminum, copper, and other minerals.', 'Over $100B', 'Early shareholder campaign', true, 'Rio Tinto Group', 'Rio Tinto', 'rio-tinto-riotin', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'RIO', 'RIO', 'NYSE', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'RIO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Wheaton Precious Metals (WPM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Wheaton Precious Metals', 'WPM', 'NYSE', 'Canada', 'Mining', 'Holds streaming interests in precious-metals mining operations.', '$25B-$100B', 'Early shareholder campaign', true, 'Wheaton Precious Metals Corp.', 'Wheaton Precious Metals', 'wheaton-precious-metals-wheato', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WPM', 'WPM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WPM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Agnico Eagle Mines (AEM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Agnico Eagle Mines', 'AEM', 'NYSE', 'Canada', 'Mining', 'Mines gold, primarily in Canada, Finland, and Mexico.', '$25B-$100B', 'Early shareholder campaign', true, 'Agnico Eagle Mines Limited', 'Agnico Eagle Mines', 'agnico-eagle-mines-agnico', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AEM', 'AEM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AEM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Cleveland-Cliffs Inc. (CLF)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Cleveland-Cliffs Inc.', 'CLF', 'NYSE', 'United States', 'Mining', 'Mines iron ore and manufactures steel.', '$1B-$5B', 'Early shareholder campaign', true, 'Cleveland-Cliffs Inc.', 'Cleveland-Cliffs Inc.', 'cleveland-cliffs-inc-clevel', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CLF', 'CLF', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CLF' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Boeing (BA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Boeing', 'BA', 'NYSE', 'United States', 'Industrials', 'Designs and manufactures commercial airplanes, defense products, and space systems.', 'Over $100B', 'Early shareholder campaign', true, 'The Boeing Company', 'Boeing', 'boeing-boeing', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BA', 'BA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Caterpillar Inc. (CAT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Caterpillar Inc.', 'CAT', 'NYSE', 'United States', 'Industrials', 'Manufactures construction, mining, and industrial equipment.', 'Over $100B', 'Early shareholder campaign', true, 'Caterpillar Inc.', 'Caterpillar Inc.', 'caterpillar-inc-caterp', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CAT', 'CAT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CAT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Honeywell International Inc. (HON)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Honeywell International Inc.', 'HON', 'NASDAQ', 'United States', 'Industrials', 'Manufactures aerospace systems, building technologies, and industrial products.', 'Over $100B', 'Early shareholder campaign', true, 'Honeywell International Inc.', 'Honeywell International Inc.', 'honeywell-international-inc-honeyw', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HON', 'HON', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HON' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- GE Aerospace (GE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('GE Aerospace', 'GE', 'NYSE', 'United States', 'Industrials', 'Designs and manufactures jet engines and aerospace propulsion systems.', 'Over $100B', 'Early shareholder campaign', true, 'GE Aerospace', 'GE Aerospace', 'ge-aerospace-genera', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GE', 'GE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'General Electric Company', 'general electric company', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'GE' and c.exchange = 'NYSE'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- 3M Company (MMM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('3M Company', 'MMM', 'NYSE', 'United States', 'Industrials', 'Manufactures industrial, safety, and consumer products.', '$25B-$100B', 'Early shareholder campaign', true, '3M Company', '3M Company', '3m-company-3m', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MMM', 'MMM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MMM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Union Pacific (UNP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Union Pacific', 'UNP', 'NYSE', 'United States', 'Industrials', 'Operates a freight railroad network across the western United States.', 'Over $100B', 'Early shareholder campaign', true, 'Union Pacific Corporation', 'Union Pacific', 'union-pacific-unionp', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UNP', 'UNP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'UNP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Lockheed Martin (LMT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Lockheed Martin', 'LMT', 'NYSE', 'United States', 'Industrials', 'Designs and manufactures aerospace and defense systems.', 'Over $100B', 'Early shareholder campaign', true, 'Lockheed Martin Corporation', 'Lockheed Martin', 'lockheed-martin-lockhe', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LMT', 'LMT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'LMT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- RTX Corporation (RTX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('RTX Corporation', 'RTX', 'NYSE', 'United States', 'Industrials', 'Manufactures aerospace and defense systems and jet engines.', 'Over $100B', 'Early shareholder campaign', true, 'RTX Corporation', 'RTX Corporation', 'rtx-corporation-rtx', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'RTX', 'RTX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'RTX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'Raytheon Technologies Corporation', 'raytheon technologies corporation', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'RTX' and c.exchange = 'NYSE'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- John Deere (DE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('John Deere', 'DE', 'NYSE', 'United States', 'Industrials', 'Manufactures agricultural, construction, and forestry equipment.', 'Over $100B', 'Early shareholder campaign', true, 'Deere & Company', 'John Deere', 'john-deere-deere', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DE', 'DE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Emerson Electric (EMR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Emerson Electric', 'EMR', 'NYSE', 'United States', 'Industrials', 'Manufactures automation and industrial process-control equipment.', '$25B-$100B', 'Early shareholder campaign', true, 'Emerson Electric Co.', 'Emerson Electric', 'emerson-electric-emerso', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EMR', 'EMR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EMR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Illinois Tool Works (ITW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Illinois Tool Works', 'ITW', 'NYSE', 'United States', 'Industrials', 'Manufactures diversified industrial equipment and specialty products.', '$25B-$100B', 'Early shareholder campaign', true, 'Illinois Tool Works Inc.', 'Illinois Tool Works', 'illinois-tool-works-illino', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ITW', 'ITW', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ITW' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Parker Hannifin (PH)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Parker Hannifin', 'PH', 'NYSE', 'United States', 'Industrials', 'Manufactures motion and control technologies.', '$25B-$100B', 'Early shareholder campaign', true, 'Parker-Hannifin Corporation', 'Parker Hannifin', 'parker-hannifin-parker', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PH', 'PH', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PH' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Eaton (ETN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Eaton', 'ETN', 'NYSE', 'Ireland', 'Industrials', 'Manufactures electrical, hydraulic, and mechanical power-management products.', 'Over $100B', 'Early shareholder campaign', true, 'Eaton Corporation plc', 'Eaton', 'eaton-eaton', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ETN', 'ETN', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ETN' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Cummins Inc. (CMI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Cummins Inc.', 'CMI', 'NYSE', 'United States', 'Industrials', 'Designs and manufactures engines and power-generation equipment.', '$25B-$100B', 'Early shareholder campaign', true, 'Cummins Inc.', 'Cummins Inc.', 'cummins-inc-cummin', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CMI', 'CMI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CMI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Northrop Grumman (NOC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Northrop Grumman', 'NOC', 'NYSE', 'United States', 'Industrials', 'Designs and manufactures aerospace and defense systems.', '$25B-$100B', 'Early shareholder campaign', true, 'Northrop Grumman Corporation', 'Northrop Grumman', 'northrop-grumman-northr', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NOC', 'NOC', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NOC' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- General Dynamics (GD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('General Dynamics', 'GD', 'NYSE', 'United States', 'Industrials', 'Manufactures defense systems, business jets, and marine vessels.', '$25B-$100B', 'Early shareholder campaign', true, 'General Dynamics Corporation', 'General Dynamics', 'general-dynamics-genera', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GD', 'GD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- FedEx (FDX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('FedEx', 'FDX', 'NYSE', 'United States', 'Industrials', 'Provides package delivery, freight, and logistics services.', '$25B-$100B', 'Early shareholder campaign', true, 'FedEx Corporation', 'FedEx', 'fedex-fedex', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'FDX', 'FDX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'FDX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- UPS (UPS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('UPS', 'UPS', 'NYSE', 'United States', 'Industrials', 'Provides package delivery, freight, and supply-chain services.', '$25B-$100B', 'Early shareholder campaign', true, 'United Parcel Service, Inc.', 'UPS', 'ups-ups', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UPS', 'UPS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'UPS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Canadian National Railway (CNI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Canadian National Railway', 'CNI', 'NYSE', 'Canada', 'Industrials', 'Operates a freight railroad network across Canada and the central United States.', '$25B-$100B', 'Early shareholder campaign', true, 'Canadian National Railway Company', 'Canadian National Railway', 'canadian-national-railway-canadi', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CNI', 'CNI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CNI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Waste Management (WM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Waste Management', 'WM', 'NYSE', 'United States', 'Industrials', 'Provides waste collection, recycling, and disposal services.', '$25B-$100B', 'Early shareholder campaign', true, 'WM (Waste Management, Inc.)', 'Waste Management', 'waste-management-wastem', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WM', 'WM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Delta Air Lines (DAL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Delta Air Lines', 'DAL', 'NYSE', 'United States', 'Industrials', 'Operates a global passenger and cargo airline.', '$25B-$100B', 'Early shareholder campaign', true, 'Delta Air Lines, Inc.', 'Delta Air Lines', 'delta-air-lines-deltaa', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DAL', 'DAL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DAL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Southwest Airlines (LUV)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Southwest Airlines', 'LUV', 'NYSE', 'United States', 'Industrials', 'Operates a low-cost passenger airline in the United States.', '$5B-$25B', 'Early shareholder campaign', true, 'Southwest Airlines Co.', 'Southwest Airlines', 'southwest-airlines-southw', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LUV', 'LUV', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'LUV' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Ryder System (R)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Ryder System', 'R', 'NYSE', 'United States', 'Industrials', 'Provides fleet management, supply chain, and dedicated transportation services.', '$5B-$25B', 'Early shareholder campaign', true, 'Ryder System, Inc.', 'Ryder System', 'ryder-system-ryder', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'R', 'R', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'R' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Old Dominion Freight Line (ODFL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Old Dominion Freight Line', 'ODFL', 'NASDAQ', 'United States', 'Industrials', 'Provides less-than-truckload freight transportation.', '$25B-$100B', 'Early shareholder campaign', true, 'Old Dominion Freight Line, Inc.', 'Old Dominion Freight Line', 'old-dominion-freight-line-olddom', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ODFL', 'ODFL', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ODFL' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Rockwell Automation (ROK)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Rockwell Automation', 'ROK', 'NYSE', 'United States', 'Industrials', 'Manufactures industrial automation and information technology.', '$25B-$100B', 'Early shareholder campaign', true, 'Rockwell Automation, Inc.', 'Rockwell Automation', 'rockwell-automation-rockwe', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ROK', 'ROK', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ROK' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Walmart Inc. (WMT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Walmart Inc.', 'WMT', 'NYSE', 'United States', 'Consumer products', 'Operates discount department stores, supercenters, and e-commerce.', 'Over $100B', 'Early shareholder campaign', true, 'Walmart Inc.', 'Walmart Inc.', 'walmart-inc-walmar', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WMT', 'WMT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WMT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Procter & Gamble (PG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Procter & Gamble', 'PG', 'NYSE', 'United States', 'Consumer products', 'Manufactures household and personal-care consumer products.', 'Over $100B', 'Early shareholder campaign', true, 'The Procter & Gamble Company', 'Procter & Gamble', 'procter-gamble-procte', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PG', 'PG', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PG' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Coca-Cola (KO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Coca-Cola', 'KO', 'NYSE', 'United States', 'Consumer products', 'Manufactures and markets nonalcoholic beverages.', 'Over $100B', 'Early shareholder campaign', true, 'The Coca-Cola Company', 'Coca-Cola', 'coca-cola-cocaco', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KO', 'KO', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- PepsiCo (PEP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('PepsiCo', 'PEP', 'NASDAQ', 'United States', 'Consumer products', 'Manufactures beverages and snack foods.', 'Over $100B', 'Early shareholder campaign', true, 'PepsiCo, Inc.', 'PepsiCo', 'pepsico-pepsic', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PEP', 'PEP', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PEP' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Costco (COST)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Costco', 'COST', 'NASDAQ', 'United States', 'Consumer products', 'Operates membership-based warehouse retail clubs.', 'Over $100B', 'Early shareholder campaign', true, 'Costco Wholesale Corporation', 'Costco', 'costco-costco', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'COST', 'COST', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'COST' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- The Home Depot (HD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('The Home Depot', 'HD', 'NYSE', 'United States', 'Consumer products', 'Operates home-improvement retail stores.', 'Over $100B', 'Early shareholder campaign', true, 'The Home Depot, Inc.', 'The Home Depot', 'the-home-depot-homede', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HD', 'HD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Nike (NKE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Nike', 'NKE', 'NYSE', 'United States', 'Consumer products', 'Designs and markets athletic footwear, apparel, and equipment.', '$25B-$100B', 'Early shareholder campaign', true, 'NIKE, Inc.', 'Nike', 'nike-nike', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NKE', 'NKE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'NKE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- McDonald's (MCD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('McDonald''s', 'MCD', 'NYSE', 'United States', 'Consumer products', 'Franchises and operates quick-service restaurants.', 'Over $100B', 'Early shareholder campaign', true, 'McDonald''s Corporation', 'McDonald''s', 'mcdonald-s-mcdona', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MCD', 'MCD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MCD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Starbucks Corporation (SBUX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Starbucks Corporation', 'SBUX', 'NASDAQ', 'United States', 'Consumer products', 'Operates and licenses coffeehouses.', '$25B-$100B', 'Early shareholder campaign', true, 'Starbucks Corporation', 'Starbucks Corporation', 'starbucks-corporation-starbu', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SBUX', 'SBUX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SBUX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Target Corporation (TGT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Target Corporation', 'TGT', 'NYSE', 'United States', 'Consumer products', 'Operates general-merchandise discount retail stores.', '$25B-$100B', 'Early shareholder campaign', true, 'Target Corporation', 'Target Corporation', 'target-corporation-target', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TGT', 'TGT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TGT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Lowe's (LOW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Lowe''s', 'LOW', 'NYSE', 'United States', 'Consumer products', 'Operates home-improvement retail stores.', 'Over $100B', 'Early shareholder campaign', true, 'Lowe''s Companies, Inc.', 'Lowe''s', 'lowe-s-lowes', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LOW', 'LOW', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'LOW' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Colgate-Palmolive (CL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Colgate-Palmolive', 'CL', 'NYSE', 'United States', 'Consumer products', 'Manufactures oral care, personal care, and household products.', '$25B-$100B', 'Early shareholder campaign', true, 'Colgate-Palmolive Company', 'Colgate-Palmolive', 'colgate-palmolive-colgat', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CL', 'CL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Kimberly-Clark (KMB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Kimberly-Clark', 'KMB', 'NYSE', 'United States', 'Consumer products', 'Manufactures personal-care and consumer tissue products.', '$25B-$100B', 'Early shareholder campaign', true, 'Kimberly-Clark Corporation', 'Kimberly-Clark', 'kimberly-clark-kimber', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KMB', 'KMB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KMB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- General Mills (GIS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('General Mills', 'GIS', 'NYSE', 'United States', 'Consumer products', 'Manufactures packaged food products.', '$25B-$100B', 'Early shareholder campaign', true, 'General Mills, Inc.', 'General Mills', 'general-mills-genera', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GIS', 'GIS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GIS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Kraft Heinz (KHC)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Kraft Heinz', 'KHC', 'NASDAQ', 'United States', 'Consumer products', 'Manufactures packaged food and beverage products.', '$25B-$100B', 'Early shareholder campaign', true, 'The Kraft Heinz Company', 'Kraft Heinz', 'kraft-heinz-krafth', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KHC', 'KHC', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KHC' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Mondelez International (MDLZ)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Mondelez International', 'MDLZ', 'NASDAQ', 'United States', 'Consumer products', 'Manufactures snack foods including cookies, chocolate, and candy.', '$25B-$100B', 'Early shareholder campaign', true, 'Mondelez International, Inc.', 'Mondelez International', 'mondelez-international-mondel', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MDLZ', 'MDLZ', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MDLZ' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- The Hershey Company (HSY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('The Hershey Company', 'HSY', 'NYSE', 'United States', 'Consumer products', 'Manufactures chocolate and confectionery products.', '$25B-$100B', 'Early shareholder campaign', true, 'The Hershey Company', 'The Hershey Company', 'the-hershey-company-hershe', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HSY', 'HSY', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HSY' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Estée Lauder (EL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Estée Lauder', 'EL', 'NYSE', 'United States', 'Consumer products', 'Manufactures and markets prestige skincare, makeup, and fragrance products.', '$5B-$25B', 'Early shareholder campaign', true, 'The Estée Lauder Companies Inc.', 'Estée Lauder', 'est-e-lauder-esteel', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EL', 'EL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Under Armour (UAA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Under Armour', 'UAA', 'NYSE', 'United States', 'Consumer products', 'Designs and markets athletic apparel, footwear, and accessories.', '$1B-$5B', 'Early shareholder campaign', true, 'Under Armour, Inc.', 'Under Armour', 'under-armour-undera', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UAA', 'UAA', 'NYSE', true, true, false, 'Class A', 'admin'
from public.companies c where c.ticker = 'UAA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UA', 'UA', 'NYSE', false, true, false, 'Class C', 'admin'
from public.companies c where c.ticker = 'UAA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- WW International (WW)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('WW International', 'WW', 'NASDAQ', 'United States', 'Consumer products', 'Provides weight-management programs and products under the WeightWatchers brand.', '$300M-$1B', 'Early shareholder campaign', true, 'WW International, Inc.', 'WW International', 'ww-international-wwinte', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WW', 'WW', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WW' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'WTW', 'WTW', 'former_ticker', 'admin'
from public.companies c where c.ticker = 'WW' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'Weight Watchers International, Inc.', 'weight watchers international, inc.', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'WW' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'WeightWatchers', 'weightwatchers', 'brand_name', 'admin'
from public.companies c where c.ticker = 'WW' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- Restaurant Brands International (QSR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Restaurant Brands International', 'QSR', 'NYSE', 'Canada', 'Consumer products', 'Franchises Burger King, Tim Hortons, Popeyes, and Firehouse Subs.', '$25B-$100B', 'Early shareholder campaign', true, 'Restaurant Brands International Inc.', 'Restaurant Brands International', 'restaurant-brands-international-restau', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'QSR', 'QSR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'QSR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Yum! Brands (YUM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Yum! Brands', 'YUM', 'NYSE', 'United States', 'Consumer products', 'Franchises KFC, Taco Bell, and Pizza Hut restaurants.', '$25B-$100B', 'Early shareholder campaign', true, 'Yum! Brands, Inc.', 'Yum! Brands', 'yum-brands-yumbra', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'YUM', 'YUM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'YUM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Chipotle Mexican Grill (CMG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Chipotle Mexican Grill', 'CMG', 'NYSE', 'United States', 'Consumer products', 'Operates fast-casual Mexican food restaurants.', '$25B-$100B', 'Early shareholder campaign', true, 'Chipotle Mexican Grill, Inc.', 'Chipotle Mexican Grill', 'chipotle-mexican-grill-chipot', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CMG', 'CMG', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CMG' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Ross Stores (ROST)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Ross Stores', 'ROST', 'NASDAQ', 'United States', 'Consumer products', 'Operates off-price apparel and home-goods retail stores.', '$25B-$100B', 'Early shareholder campaign', true, 'Ross Stores, Inc.', 'Ross Stores', 'ross-stores-rossst', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ROST', 'ROST', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ROST' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- TJX Companies (TJX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('TJX Companies', 'TJX', 'NYSE', 'United States', 'Consumer products', 'Operates off-price apparel and home-goods retail stores including T.J. Maxx and Marshalls.', 'Over $100B', 'Early shareholder campaign', true, 'The TJX Companies, Inc.', 'TJX Companies', 'tjx-companies-tjx', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TJX', 'TJX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TJX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Dollar General (DG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Dollar General', 'DG', 'NYSE', 'United States', 'Consumer products', 'Operates small-format discount retail stores.', '$25B-$100B', 'Early shareholder campaign', true, 'Dollar General Corporation', 'Dollar General', 'dollar-general-dollar', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DG', 'DG', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DG' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- eBay (EBAY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('eBay', 'EBAY', 'NASDAQ', 'United States', 'Consumer products', 'Operates an online marketplace connecting buyers and sellers.', '$25B-$100B', 'Early shareholder campaign', true, 'eBay Inc.', 'eBay', 'ebay-ebay', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EBAY', 'EBAY', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EBAY' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Constellation Brands (STZ)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Constellation Brands', 'STZ', 'NYSE', 'United States', 'Consumer products', 'Produces and markets beer, wine, and spirits.', '$25B-$100B', 'Early shareholder campaign', true, 'Constellation Brands, Inc.', 'Constellation Brands', 'constellation-brands-conste', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'STZ', 'STZ', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'STZ' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Molson Coors (TAP)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Molson Coors', 'TAP', 'NYSE', 'United States', 'Consumer products', 'Produces and markets beer and other beverages.', '$5B-$25B', 'Early shareholder campaign', true, 'Molson Coors Beverage Company', 'Molson Coors', 'molson-coors-molson', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TAP', 'TAP', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TAP' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Church & Dwight (CHD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Church & Dwight', 'CHD', 'NYSE', 'United States', 'Consumer products', 'Manufactures household and personal-care products.', '$25B-$100B', 'Early shareholder campaign', true, 'Church & Dwight Co., Inc.', 'Church & Dwight', 'church-dwight-church', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CHD', 'CHD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CHD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Clorox (CLX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Clorox', 'CLX', 'NYSE', 'United States', 'Consumer products', 'Manufactures cleaning, disinfecting, and household consumer products.', '$5B-$25B', 'Early shareholder campaign', true, 'The Clorox Company', 'Clorox', 'clorox-clorox', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CLX', 'CLX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CLX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Kroger (KR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Kroger', 'KR', 'NYSE', 'United States', 'Consumer products', 'Operates supermarkets and grocery retail stores.', '$25B-$100B', 'Early shareholder campaign', true, 'The Kroger Co.', 'Kroger', 'kroger-kroger', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'KR', 'KR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'KR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Albertsons Companies (ACI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Albertsons Companies', 'ACI', 'NYSE', 'United States', 'Consumer products', 'Operates supermarkets and grocery retail stores.', '$5B-$25B', 'Early shareholder campaign', true, 'Albertsons Companies, Inc.', 'Albertsons Companies', 'albertsons-companies-albert', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ACI', 'ACI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ACI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Marriott International (MAR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Marriott International', 'MAR', 'NASDAQ', 'United States', 'Consumer products', 'Franchises and manages hotel brands worldwide.', '$25B-$100B', 'Early shareholder campaign', true, 'Marriott International, Inc.', 'Marriott International', 'marriott-international-marrio', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MAR', 'MAR', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MAR' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Hilton Worldwide (HLT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Hilton Worldwide', 'HLT', 'NYSE', 'United States', 'Consumer products', 'Franchises and manages hotel brands worldwide.', '$25B-$100B', 'Early shareholder campaign', true, 'Hilton Worldwide Holdings Inc.', 'Hilton Worldwide', 'hilton-worldwide-hilton', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HLT', 'HLT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HLT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Expedia Group (EXPE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Expedia Group', 'EXPE', 'NASDAQ', 'United States', 'Consumer products', 'Operates online travel-booking platforms.', '$5B-$25B', 'Early shareholder campaign', true, 'Expedia Group, Inc.', 'Expedia Group', 'expedia-group-expedi', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EXPE', 'EXPE', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EXPE' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- UnitedHealth Group (UNH)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('UnitedHealth Group', 'UNH', 'NYSE', 'United States', 'Healthcare', 'Provides health insurance and health-services technology.', 'Over $100B', 'Early shareholder campaign', true, 'UnitedHealth Group Incorporated', 'UnitedHealth Group', 'unitedhealth-group-united', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'UNH', 'UNH', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'UNH' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Johnson & Johnson (JNJ)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Johnson & Johnson', 'JNJ', 'NYSE', 'United States', 'Healthcare', 'Manufactures pharmaceuticals and medical devices.', 'Over $100B', 'Early shareholder campaign', true, 'Johnson & Johnson', 'Johnson & Johnson', 'johnson-johnson-johnso', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'JNJ', 'JNJ', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'JNJ' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Pfizer Inc. (PFE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Pfizer Inc.', 'PFE', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures pharmaceuticals and vaccines.', 'Over $100B', 'Early shareholder campaign', true, 'Pfizer Inc.', 'Pfizer Inc.', 'pfizer-inc-pfizer', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PFE', 'PFE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PFE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Eli Lilly (LLY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Eli Lilly', 'LLY', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures pharmaceuticals.', 'Over $100B', 'Early shareholder campaign', true, 'Eli Lilly and Company', 'Eli Lilly', 'eli-lilly-elilil', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LLY', 'LLY', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'LLY' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- AbbVie Inc. (ABBV)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('AbbVie Inc.', 'ABBV', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures pharmaceuticals.', 'Over $100B', 'Early shareholder campaign', true, 'AbbVie Inc.', 'AbbVie Inc.', 'abbvie-inc-abbvie', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ABBV', 'ABBV', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ABBV' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Merck & Co., Inc. (MRK)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Merck & Co., Inc.', 'MRK', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures pharmaceuticals and vaccines.', 'Over $100B', 'Early shareholder campaign', true, 'Merck & Co., Inc.', 'Merck & Co., Inc.', 'merck-co-inc-merck', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MRK', 'MRK', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MRK' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Thermo Fisher Scientific (TMO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Thermo Fisher Scientific', 'TMO', 'NYSE', 'United States', 'Healthcare', 'Manufactures scientific instruments, reagents, and laboratory equipment.', 'Over $100B', 'Early shareholder campaign', true, 'Thermo Fisher Scientific Inc.', 'Thermo Fisher Scientific', 'thermo-fisher-scientific-thermo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TMO', 'TMO', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TMO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Abbott Laboratories (ABT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Abbott Laboratories', 'ABT', 'NYSE', 'United States', 'Healthcare', 'Manufactures medical devices, diagnostics, and nutrition products.', 'Over $100B', 'Early shareholder campaign', true, 'Abbott Laboratories', 'Abbott Laboratories', 'abbott-laboratories-abbott', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ABT', 'ABT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ABT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Bristol-Myers Squibb (BMY)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Bristol-Myers Squibb', 'BMY', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures pharmaceuticals.', '$25B-$100B', 'Early shareholder campaign', true, 'Bristol-Myers Squibb Company', 'Bristol-Myers Squibb', 'bristol-myers-squibb-bristo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BMY', 'BMY', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BMY' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Amgen Inc. (AMGN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Amgen Inc.', 'AMGN', 'NASDAQ', 'United States', 'Healthcare', 'Discovers, develops, and manufactures biologic medicines.', 'Over $100B', 'Early shareholder campaign', true, 'Amgen Inc.', 'Amgen Inc.', 'amgen-inc-amgen', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMGN', 'AMGN', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMGN' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Gilead Sciences (GILD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Gilead Sciences', 'GILD', 'NASDAQ', 'United States', 'Healthcare', 'Discovers, develops, and manufactures antiviral and oncology medicines.', '$25B-$100B', 'Early shareholder campaign', true, 'Gilead Sciences, Inc.', 'Gilead Sciences', 'gilead-sciences-gilead', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'GILD', 'GILD', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'GILD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Vertex Pharmaceuticals (VRTX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Vertex Pharmaceuticals', 'VRTX', 'NASDAQ', 'United States', 'Healthcare', 'Discovers, develops, and manufactures treatments for serious diseases.', 'Over $100B', 'Early shareholder campaign', true, 'Vertex Pharmaceuticals Incorporated', 'Vertex Pharmaceuticals', 'vertex-pharmaceuticals-vertex', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VRTX', 'VRTX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'VRTX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Regeneron Pharmaceuticals (REGN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Regeneron Pharmaceuticals', 'REGN', 'NASDAQ', 'United States', 'Healthcare', 'Discovers, develops, and manufactures biologic medicines.', '$25B-$100B', 'Early shareholder campaign', true, 'Regeneron Pharmaceuticals, Inc.', 'Regeneron Pharmaceuticals', 'regeneron-pharmaceuticals-regene', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'REGN', 'REGN', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'REGN' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Moderna, Inc. (MRNA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Moderna, Inc.', 'MRNA', 'NASDAQ', 'United States', 'Healthcare', 'Develops mRNA-based vaccines and therapeutics.', '$5B-$25B', 'Early shareholder campaign', true, 'Moderna, Inc.', 'Moderna, Inc.', 'moderna-inc-modern', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MRNA', 'MRNA', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MRNA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- CVS Health (CVS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('CVS Health', 'CVS', 'NYSE', 'United States', 'Healthcare', 'Operates pharmacies, health insurance, and healthcare-services businesses.', '$25B-$100B', 'Early shareholder campaign', true, 'CVS Health Corporation', 'CVS Health', 'cvs-health-cvshea', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CVS', 'CVS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CVS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- The Cigna Group (CI)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('The Cigna Group', 'CI', 'NYSE', 'United States', 'Healthcare', 'Provides health insurance and pharmacy-benefit management services.', '$25B-$100B', 'Early shareholder campaign', true, 'The Cigna Group', 'The Cigna Group', 'the-cigna-group-cigna', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CI', 'CI', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CI' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Elevance Health (ELV)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Elevance Health', 'ELV', 'NYSE', 'United States', 'Healthcare', 'Provides health insurance and health-services technology.', '$25B-$100B', 'Early shareholder campaign', true, 'Elevance Health, Inc.', 'Elevance Health', 'elevance-health-elevan', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ELV', 'ELV', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ELV' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'Anthem, Inc.', 'anthem, inc.', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'ELV' and c.exchange = 'NYSE'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- HCA Healthcare (HCA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('HCA Healthcare', 'HCA', 'NYSE', 'United States', 'Healthcare', 'Operates general acute-care hospitals and outpatient facilities.', '$25B-$100B', 'Early shareholder campaign', true, 'HCA Healthcare, Inc.', 'HCA Healthcare', 'hca-healthcare-hcahea', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'HCA', 'HCA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'HCA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Novo Nordisk (NVO)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Novo Nordisk', 'NVO', 'NYSE', 'Denmark', 'Healthcare', 'Discovers, develops, and manufactures diabetes and obesity treatments.', 'Over $100B', 'Early shareholder campaign', true, 'Novo Nordisk A/S', 'Novo Nordisk', 'novo-nordisk-novono', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'NVO', 'NVO', 'NYSE', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'NVO' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Biogen Inc. (BIIB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Biogen Inc.', 'BIIB', 'NASDAQ', 'United States', 'Healthcare', 'Discovers, develops, and manufactures treatments for neurological diseases.', '$5B-$25B', 'Early shareholder campaign', true, 'Biogen Inc.', 'Biogen Inc.', 'biogen-inc-biogen', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BIIB', 'BIIB', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BIIB' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Zoetis Inc. (ZTS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Zoetis Inc.', 'ZTS', 'NYSE', 'United States', 'Healthcare', 'Discovers, develops, and manufactures medicines and vaccines for animals.', '$25B-$100B', 'Early shareholder campaign', true, 'Zoetis Inc.', 'Zoetis Inc.', 'zoetis-inc-zoetis', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ZTS', 'ZTS', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ZTS' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- IDEXX Laboratories (IDXX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('IDEXX Laboratories', 'IDXX', 'NASDAQ', 'United States', 'Healthcare', 'Manufactures diagnostic products and services for veterinary and food safety.', '$25B-$100B', 'Early shareholder campaign', true, 'IDEXX Laboratories, Inc.', 'IDEXX Laboratories', 'idexx-laboratories-idexx', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'IDXX', 'IDXX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'IDXX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Stryker Corporation (SYK)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Stryker Corporation', 'SYK', 'NYSE', 'United States', 'Healthcare', 'Manufactures orthopaedic implants and medical technology.', 'Over $100B', 'Early shareholder campaign', true, 'Stryker Corporation', 'Stryker Corporation', 'stryker-corporation-stryke', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SYK', 'SYK', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SYK' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Boston Scientific (BSX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Boston Scientific', 'BSX', 'NYSE', 'United States', 'Healthcare', 'Manufactures interventional medical devices.', 'Over $100B', 'Early shareholder campaign', true, 'Boston Scientific Corporation', 'Boston Scientific', 'boston-scientific-boston', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BSX', 'BSX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BSX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Medtronic plc (MDT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Medtronic plc', 'MDT', 'NYSE', 'Ireland', 'Healthcare', 'Manufactures medical devices for cardiac, neurological, and diabetes care.', 'Over $100B', 'Early shareholder campaign', true, 'Medtronic plc', 'Medtronic plc', 'medtronic-plc-medtro', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'MDT', 'MDT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'MDT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- BD (BDX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('BD', 'BDX', 'NYSE', 'United States', 'Healthcare', 'Manufactures medical devices, laboratory equipment, and diagnostic products.', '$25B-$100B', 'Early shareholder campaign', true, 'Becton, Dickinson and Company', 'BD', 'bd-becton', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BDX', 'BDX', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BDX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Illumina, Inc. (ILMN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Illumina, Inc.', 'ILMN', 'NASDAQ', 'United States', 'Healthcare', 'Manufactures genomic sequencing and array-based technologies.', '$5B-$25B', 'Early shareholder campaign', true, 'Illumina, Inc.', 'Illumina, Inc.', 'illumina-inc-illumi', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'ILMN', 'ILMN', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'ILMN' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Dexcom (DXCM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Dexcom', 'DXCM', 'NASDAQ', 'United States', 'Healthcare', 'Manufactures continuous glucose-monitoring systems.', '$25B-$100B', 'Early shareholder campaign', true, 'DexCom, Inc.', 'Dexcom', 'dexcom-dexcom', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DXCM', 'DXCM', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DXCM' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- AT&T (T)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('AT&T', 'T', 'NYSE', 'United States', 'Telecommunications', 'Provides wireless, broadband, and media communications services.', 'Over $100B', 'Early shareholder campaign', true, 'AT&T Inc.', 'AT&T', 'at-t-att', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'T', 'T', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'T' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Verizon (VZ)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Verizon', 'VZ', 'NYSE', 'United States', 'Telecommunications', 'Provides wireless and broadband communications services.', 'Over $100B', 'Early shareholder campaign', true, 'Verizon Communications Inc.', 'Verizon', 'verizon-verizo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VZ', 'VZ', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'VZ' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- T-Mobile (TMUS)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('T-Mobile', 'TMUS', 'NASDAQ', 'United States', 'Telecommunications', 'Provides wireless communications services.', 'Over $100B', 'Early shareholder campaign', true, 'T-Mobile US, Inc.', 'T-Mobile', 't-mobile-tmobil', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TMUS', 'TMUS', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TMUS' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Paramount Global (PARA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Paramount Global', 'PARA', 'NASDAQ', 'United States', 'Telecommunications', 'Operates media and entertainment networks, film studios, and streaming services.', '$5B-$25B', 'Early shareholder campaign', true, 'Paramount Global', 'Paramount Global', 'paramount-global-paramo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PARA', 'PARA', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PARA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'VIAC', 'VIAC', 'former_ticker', 'admin'
from public.companies c where c.ticker = 'PARA' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)
select c.id, 'ViacomCBS Inc.', 'viacomcbs inc.', 'former_company_name', 'admin'
from public.companies c where c.ticker = 'PARA' and c.exchange = 'NASDAQ'
on conflict (company_id, normalized_alias, alias_type) do update set
  alias = excluded.alias, source = excluded.source;

-- Comcast Corporation (CMCSA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Comcast Corporation', 'CMCSA', 'NASDAQ', 'United States', 'Telecommunications', 'Provides cable, broadband, and media and entertainment services.', 'Over $100B', 'Early shareholder campaign', true, 'Comcast Corporation', 'Comcast Corporation', 'comcast-corporation-comcas', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CMCSA', 'CMCSA', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CMCSA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Charter Communications (CHTR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Charter Communications', 'CHTR', 'NASDAQ', 'United States', 'Telecommunications', 'Provides cable television, broadband, and voice services.', '$25B-$100B', 'Early shareholder campaign', true, 'Charter Communications, Inc.', 'Charter Communications', 'charter-communications-charte', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'CHTR', 'CHTR', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'CHTR' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- BCE Inc. (BCE)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('BCE Inc.', 'BCE', 'NYSE', 'Canada', 'Telecommunications', 'Provides wireless, wireline, and media communications services in Canada.', '$25B-$100B', 'Early shareholder campaign', true, 'BCE Inc.', 'BCE Inc.', 'bce-inc-bce', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BCE', 'BCE', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BCE' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Warner Bros. Discovery (WBD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Warner Bros. Discovery', 'WBD', 'NASDAQ', 'United States', 'Telecommunications', 'Operates media networks, film studios, and streaming services.', '$25B-$100B', 'Early shareholder campaign', true, 'Warner Bros. Discovery, Inc.', 'Warner Bros. Discovery', 'warner-bros-discovery-warner', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WBD', 'WBD', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WBD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Vodafone (VOD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Vodafone', 'VOD', 'NASDAQ', 'United Kingdom', 'Telecommunications', 'Provides mobile and fixed communications services across Europe and Africa.', '$25B-$100B', 'Early shareholder campaign', true, 'Vodafone Group Plc', 'Vodafone', 'vodafone-vodafo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VOD', 'VOD', 'NASDAQ', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'VOD' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- América Móvil (AMX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('América Móvil', 'AMX', 'NYSE', 'Mexico', 'Telecommunications', 'Provides wireless and fixed-line telecommunications services across Latin America.', '$25B-$100B', 'Early shareholder campaign', true, 'América Móvil, S.A.B. de C.V.', 'América Móvil', 'am-rica-m-vil-americ', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMX', 'AMX', 'NYSE', true, true, true, null, 'admin'
from public.companies c where c.ticker = 'AMX' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Telus (TU)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Telus', 'TU', 'NYSE', 'Canada', 'Telecommunications', 'Provides wireless, internet, and television services in Canada.', '$25B-$100B', 'Early shareholder campaign', true, 'TELUS Corporation', 'Telus', 'telus-telus', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'TU', 'TU', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'TU' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Liberty Broadband (LBRDA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Liberty Broadband', 'LBRDA', 'NASDAQ', 'United States', 'Telecommunications', 'Holds interests in broadband and communications businesses, including Charter Communications.', '$5B-$25B', 'Early shareholder campaign', true, 'Liberty Broadband Corporation', 'Liberty Broadband', 'liberty-broadband-libert', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LBRDA', 'LBRDA', 'NASDAQ', true, true, false, 'Series A', 'admin'
from public.companies c where c.ticker = 'LBRDA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'LBRDK', 'LBRDK', 'NASDAQ', false, true, false, 'Series K', 'admin'
from public.companies c where c.ticker = 'LBRDA' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- American Tower (AMT)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('American Tower', 'AMT', 'NYSE', 'United States', 'Real estate', 'Owns and operates wireless and broadcast communications infrastructure.', '$25B-$100B', 'Early shareholder campaign', true, 'American Tower Corporation', 'American Tower', 'american-tower-americ', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AMT', 'AMT', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AMT' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Prologis, Inc. (PLD)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Prologis, Inc.', 'PLD', 'NYSE', 'United States', 'Real estate', 'Owns and develops logistics and industrial real estate.', '$25B-$100B', 'Early shareholder campaign', true, 'Prologis, Inc.', 'Prologis, Inc.', 'prologis-inc-prolog', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PLD', 'PLD', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PLD' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Equinix, Inc. (EQIX)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Equinix, Inc.', 'EQIX', 'NASDAQ', 'United States', 'Real estate', 'Owns and operates data centers and interconnection facilities.', '$25B-$100B', 'Early shareholder campaign', true, 'Equinix, Inc.', 'Equinix, Inc.', 'equinix-inc-equini', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EQIX', 'EQIX', 'NASDAQ', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EQIX' and c.exchange = 'NASDAQ'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Simon Property Group (SPG)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Simon Property Group', 'SPG', 'NYSE', 'United States', 'Real estate', 'Owns and operates shopping malls and premium outlet centers.', '$25B-$100B', 'Early shareholder campaign', true, 'Simon Property Group, Inc.', 'Simon Property Group', 'simon-property-group-simonp', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'SPG', 'SPG', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'SPG' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Public Storage (PSA)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Public Storage', 'PSA', 'NYSE', 'United States', 'Real estate', 'Owns and operates self-storage facilities.', '$25B-$100B', 'Early shareholder campaign', true, 'Public Storage', 'Public Storage', 'public-storage-public', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'PSA', 'PSA', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'PSA' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Realty Income (O)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Realty Income', 'O', 'NYSE', 'United States', 'Real estate', 'Owns and leases free-standing commercial real estate.', '$25B-$100B', 'Early shareholder campaign', true, 'Realty Income Corporation', 'Realty Income', 'realty-income-realty', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'O', 'O', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'O' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Digital Realty (DLR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Digital Realty', 'DLR', 'NYSE', 'United States', 'Real estate', 'Owns and operates data centers globally.', '$25B-$100B', 'Early shareholder campaign', true, 'Digital Realty Trust, Inc.', 'Digital Realty', 'digital-realty-digita', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'DLR', 'DLR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'DLR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Welltower Inc. (WELL)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Welltower Inc.', 'WELL', 'NYSE', 'United States', 'Real estate', 'Owns and operates senior housing and healthcare real estate.', '$25B-$100B', 'Early shareholder campaign', true, 'Welltower Inc.', 'Welltower Inc.', 'welltower-inc-wellto', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'WELL', 'WELL', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'WELL' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- AvalonBay Communities (AVB)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('AvalonBay Communities', 'AVB', 'NYSE', 'United States', 'Real estate', 'Owns and develops multifamily residential apartment communities.', '$25B-$100B', 'Early shareholder campaign', true, 'AvalonBay Communities, Inc.', 'AvalonBay Communities', 'avalonbay-communities-avalon', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'AVB', 'AVB', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'AVB' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Brookfield (BN)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Brookfield', 'BN', 'NYSE', 'Canada', 'Real estate', 'Manages real estate, renewable power, infrastructure, and private-equity assets.', 'Over $100B', 'Early shareholder campaign', true, 'Brookfield Corporation', 'Brookfield', 'brookfield-brookf', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'BN', 'BN', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'BN' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Iron Mountain (IRM)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Iron Mountain', 'IRM', 'NYSE', 'United States', 'Real estate', 'Provides records management, data-center, and storage real estate services.', '$25B-$100B', 'Early shareholder campaign', true, 'Iron Mountain Incorporated', 'Iron Mountain', 'iron-mountain-ironmo', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'IRM', 'IRM', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'IRM' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Extra Space Storage (EXR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Extra Space Storage', 'EXR', 'NYSE', 'United States', 'Real estate', 'Owns and operates self-storage facilities.', '$25B-$100B', 'Early shareholder campaign', true, 'Extra Space Storage Inc.', 'Extra Space Storage', 'extra-space-storage-extras', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'EXR', 'EXR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'EXR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

-- Ventas, Inc. (VTR)
insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)
values ('Ventas, Inc.', 'VTR', 'NYSE', 'United States', 'Real estate', 'Owns and operates senior housing and healthcare real estate.', '$25B-$100B', 'Early shareholder campaign', true, 'Ventas, Inc.', 'Ventas, Inc.', 'ventas-inc-ventas', null, true, true, true, 'admin')
on conflict (ticker, exchange) do update set
  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,
  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,
  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,
  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();

insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)
select c.id, 'VTR', 'VTR', 'NYSE', true, true, false, null, 'admin'
from public.companies c where c.ticker = 'VTR' and c.exchange = 'NYSE'
on conflict (exchange, normalized_symbol) where is_active do update set
  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();

commit;
