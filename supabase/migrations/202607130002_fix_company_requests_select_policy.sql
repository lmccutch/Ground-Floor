-- Fix: the "Request a company" flow fails in Supabase mode.
--
-- The frontend inserts with `.insert(...).select('id').single()` (see
-- src/lib/api.ts requestCompany), which requires the inserted row to be
-- visible under a SELECT policy. company_requests only had an INSERT policy
-- for users ("users create requests") and an admin-only FOR ALL policy
-- ("admins manage requests"), so the insert+returning failed with 42501 and
-- no row was created. Verified live on the scratch project on 2026-07-13.
--
-- Add an owner-only SELECT policy. Policies are permissive (OR'd), so admins
-- keep full access via the existing policy; anon has auth.uid() = null and
-- matches nothing.

create policy "users read own requests"
on public.company_requests
for select
using (auth.uid() = requested_by);
