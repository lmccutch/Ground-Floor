-- Column-level privacy for internal/operational fields.
--
-- campaigns has an RLS policy `using (true)` (public reads all rows), and the
-- operational columns added in 202607210003 were therefore readable by anon via
-- the REST API (e.g. GET /rest/v1/campaigns?select=internal_notes). This restricts
-- anon + authenticated to the public columns only. The app reads campaign data
-- exclusively through public_campaign_metrics (an owner-privileged view that is
-- unaffected), and admins read internal fields through SECURITY DEFINER RPCs
-- (admin_update_campaign_ops / admin_work_queue). RLS continues to govern rows.
--
-- company_requests exposes admin_notes / reviewed_by only to the request's own
-- owner (via "users read own requests"), but those are internal reviewer fields —
-- withhold them from anon + authenticated too. The app only inserts requests and
-- selects the new id, so nothing breaks.
--
-- Forward-only, privilege-only change. No data is modified.

/* --------------------------------- campaigns ------------------------------- */

revoke select on public.campaigns from anon, authenticated;
grant select (id, company_id, status, outreach_target, launched_at, created_at, updated_at)
  on public.campaigns to anon, authenticated;

/* ------------------------------ company_requests --------------------------- */

revoke select on public.company_requests from anon, authenticated;
grant select (
  id, requested_by, company_name, ticker, exchange, reason, shareholder_status,
  suggested_topic, consent, created_at, status, priority, reviewed_at,
  rejection_reason, duplicate_of_request_id, created_company_id, updated_at
) on public.company_requests to anon, authenticated;

comment on table public.campaigns is
  'Public reads go through public_campaign_metrics. Internal operational columns (operational_status, internal_notes, risk_status, assigned_admin, management_contact_status, outreach/threshold timestamps, supporter_threshold, closed_reason) are NOT granted to anon/authenticated — admins access them via SECURITY DEFINER RPCs.';
