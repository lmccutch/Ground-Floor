-- Security fix: start_campaign(uuid) was callable by anonymous clients.
--
-- Root cause: PostgreSQL grants EXECUTE on new functions to PUBLIC by default,
-- and 202607110001 only ever ADDED a grant to `authenticated` — it never
-- revoked the default PUBLIC grant, so `anon` could still execute. Because the
-- function is SECURITY DEFINER (required: campaigns intentionally has no
-- INSERT policy) and had no auth.uid() guard, an unauthenticated REST call to
-- /rpc/start_campaign could create campaign rows, bypassing campaigns RLS.
--
-- Verified live on the scratch project on 2026-07-13: an anon-key call
-- returned 200 and created campaign 31ee1c6f-97fc-4f3d-82fc-46809522792d.
-- Regression coverage: scripts/verify-start-campaign-security.ts.
--
-- Fix: recreate the function with an explicit auth guard (defense in depth),
-- revoke EXECUTE from PUBLIC and anon, and grant only to authenticated.
-- Campaign-creation semantics are unchanged: one campaign per company,
-- race-safe via `on conflict do nothing` + fallback select, returns the UUID.

create or replace function public.start_campaign(p_company_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

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

revoke execute on function public.start_campaign(uuid) from public;
revoke execute on function public.start_campaign(uuid) from anon;

grant execute on function public.start_campaign(uuid) to authenticated;
