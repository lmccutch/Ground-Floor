insert into public.companies (name, ticker, exchange, country, sector, description, website, investor_relations_url, market_cap_category, status, is_public)
values
  ('Northstar Grid Systems', 'NGS', 'NYSE', 'United States', 'Energy infrastructure', 'Fictional energy infrastructure company used for Grround Floor product testing.', 'https://example.com/ngs', 'https://example.com/ngs/investors', '$2B-$5B', 'Early shareholder campaign', true),
  ('Asteria Cloud', 'ASTR', 'NASDAQ', 'United States', 'Software', 'Fictional cloud software company used for Grround Floor product testing.', 'https://example.com/astr', 'https://example.com/astr/investors', '$5B-$10B', 'Early shareholder campaign', true),
  ('Morrow Foods', 'MRWF', 'TSX', 'Canada', 'Consumer products', 'Fictional consumer products company used for Grround Floor product testing.', 'https://example.com/mrwf', 'https://example.com/mrwf/investors', '$1B-$2B', 'Early shareholder campaign', true),
  ('LumenPay', 'LMPY', 'LSE', 'United Kingdom', 'Financial technology', 'Fictional financial technology company used for Grround Floor product testing.', 'https://example.com/lmpy', 'https://example.com/lmpy/investors', '$2B-$5B', 'Early shareholder campaign', true),
  ('Ironvale Robotics', 'IVRB', 'XETRA', 'Germany', 'Industrials', 'Fictional industrial robotics company used for Grround Floor product testing.', 'https://example.com/ivrb', 'https://example.com/ivrb/investors', '$5B-$10B', 'Early shareholder campaign', true),
  ('Vireo Health', 'VIRE', 'NASDAQ', 'United States', 'Healthcare', 'Fictional healthcare company used for Grround Floor product testing.', 'https://example.com/vire', 'https://example.com/vire/investors', 'Under $1B', 'Early shareholder campaign', true),
  ('Redwood Minerals', 'RWDM', 'ASX', 'Australia', 'Mining', 'Fictional mining company used for Grround Floor product testing.', 'https://example.com/rwdm', 'https://example.com/rwdm/investors', '$1B-$2B', 'Early shareholder campaign', true),
  ('SignalNorth', 'SGNL', 'NASDAQ', 'Sweden', 'Telecommunications', 'Fictional telecommunications company used for Grround Floor product testing.', 'https://example.com/sgnl', 'https://example.com/sgnl/investors', '$2B-$5B', 'Early shareholder campaign', true)
on conflict (ticker, exchange) do update set
  name = excluded.name,
  country = excluded.country,
  sector = excluded.sector,
  description = excluded.description,
  website = excluded.website,
  investor_relations_url = excluded.investor_relations_url,
  market_cap_category = excluded.market_cap_category,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.campaigns (company_id, status, outreach_target)
select id, 'Gathering shareholder interest', 100
from public.companies
where ticker in ('NGS', 'ASTR', 'MRWF', 'LMPY', 'IVRB', 'VIRE', 'RWDM', 'SGNL')
on conflict (company_id) do update set
  status = excluded.status,
  outreach_target = excluded.outreach_target,
  updated_at = now();
