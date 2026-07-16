-- Simplify company_requests to match the streamlined "Request a company" form,
-- which now collects only the company name and ticker.
--
-- The form previously collected exchange, a free-text reason, a shareholder
-- status, and an email-updates consent flag. Those are no longer gathered, so
-- their NOT NULL constraints are relaxed rather than being satisfied with
-- fabricated placeholder values. Existing historical rows keep every value they
-- already have — this migration only loosens constraints and reshapes the dedupe
-- index. Nothing is deleted and no data is rewritten.
--
-- Idempotent and safe to re-run.

-- 1) Stop requiring the fields the form no longer collects. New rows leave them
--    NULL; the `consent` column already defaults to false, so it is untouched.
alter table public.company_requests alter column exchange drop not null;
alter table public.company_requests alter column reason drop not null;
alter table public.company_requests alter column shareholder_status drop not null;

-- 2) Redesign the duplicate guard. The old index included `exchange`
--    (lower(company_name), upper(ticker), exchange); with exchange now NULL for
--    new rows, Postgres treats those NULLs as distinct and the guard would stop
--    catching duplicates. Replace it with a per-shareholder guard keyed only on
--    the fields still collected, so a shareholder cannot file the same company
--    twice while different shareholders can each register their interest.
drop index if exists public.company_requests_dedupe_idx;

create unique index if not exists company_requests_user_dedupe_idx
  on public.company_requests (requested_by, lower(company_name), upper(ticker));
