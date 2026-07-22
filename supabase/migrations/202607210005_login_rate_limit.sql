-- Cross-instance rate limiting for the username-login Edge Function.
--
-- The Edge Function's in-memory limiter is per-instance and unreliable on the
-- distributed edge runtime, and GoTrue does not strongly throttle password
-- grants. This adds a shared, DB-backed limiter the function calls with the
-- service role. Forward-only and additive.

create table if not exists public.login_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.login_rate_limits enable row level security;
-- No policies: never touched by browser clients. Only the SECURITY DEFINER
-- function below (owner) and the service role (RLS-bypassing) use it.
revoke all on public.login_rate_limits from anon, authenticated;

-- Atomically record a hit for p_key within a rolling window and report whether
-- the caller is still within p_max. Returns true = allowed, false = limited.
-- Fixed-window semantics: the window resets once it expires. Opportunistically
-- purges stale keys so the table cannot grow unbounded.
create or replace function public.check_login_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if random() < 0.02 then
    delete from public.login_rate_limits where window_start < now() - interval '1 hour';
  end if;

  insert into public.login_rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when public.login_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else public.login_rate_limits.count + 1 end,
        window_start = case
          when public.login_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else public.login_rate_limits.window_start end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

revoke execute on function public.check_login_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_login_rate_limit(text, integer, integer) to service_role;

comment on function public.check_login_rate_limit(text, integer, integer) is
  'Shared fixed-window rate limiter for the login Edge Function. Service-role only. Returns true when the key is within p_max hits in the last p_window_seconds.';
