-- Preflight fix: make claim_username an explicit idempotent no-op when the caller
-- already owns the target normalized username (exact reclaim or a case-only
-- change such as luke -> Luke), so it can never trip the unique index against the
-- caller's own row. The prior version was already idempotent in practice (a
-- same-value UPDATE does not conflict with the row itself), but this makes the
-- intent explicit and robust and never runs the reserved-list/uniqueness path for
-- a username the caller already holds. Another user claiming the same username
-- still receives username_taken; uniqueness and RLS are unchanged.
--
-- Forward-only function replacement. No data is modified.

create or replace function public.claim_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_normalized text;
  v_current text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9_]{2,29}$' then
    raise exception 'invalid_username' using errcode = 'check_violation';
  end if;
  v_normalized := lower(p_username);

  -- Idempotent owner reclaim: the caller already holds this normalized username.
  -- Only the display casing can change; never touch username_normalized (and thus
  -- never interact with the unique index or the reserved-list check).
  select username_normalized into v_current from public.profiles where id = v_uid;
  if v_current is not null and v_current = v_normalized then
    update public.profiles set username = p_username, updated_at = now() where id = v_uid;
    return p_username;
  end if;

  if exists (select 1 from public.reserved_usernames r where r.name = v_normalized) then
    raise exception 'username_reserved' using errcode = 'check_violation';
  end if;

  update public.profiles
    set username = p_username, username_normalized = v_normalized, updated_at = now()
    where id = v_uid;

  if not found then
    insert into public.profiles (id, username, username_normalized)
    values (v_uid, p_username, v_normalized);
  end if;

  return p_username;
exception
  when unique_violation then
    raise exception 'username_taken' using errcode = 'unique_violation';
end;
$$;

revoke execute on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated;
