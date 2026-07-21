-- Usernames on public profiles (Phase: admin foundation + password auth).
--
-- Adds case-insensitive-unique usernames to public.profiles for the new
-- username/email + password auth. Forward-only and production-data-safe:
-- existing profiles keep username = NULL (no fabricated values) and are prompted
-- to choose one at next sign-in. Same auth.users UUIDs, same profile rows.

/* ------------------------------ profile columns ---------------------------- */

alter table public.profiles
  add column if not exists username text,
  add column if not exists username_normalized text;

-- Format: 3–30 chars, begins with a letter or number, letters/numbers/underscore
-- only. NULL allowed (existing users until they claim one). Comparisons are
-- case-insensitive via the normalized column.
alter table public.profiles
  drop constraint if exists profiles_username_format_chk;
alter table public.profiles
  add constraint profiles_username_format_chk
  check (username is null or username ~ '^[A-Za-z0-9][A-Za-z0-9_]{2,29}$');

-- Keep the normalized column honest (it must be the lowercase of username).
alter table public.profiles
  drop constraint if exists profiles_username_normalized_chk;
alter table public.profiles
  add constraint profiles_username_normalized_chk
  check (username_normalized is null or username_normalized = lower(username));

-- Case-insensitive uniqueness: two users cannot both hold "Luke"/"luke".
create unique index if not exists profiles_username_normalized_idx
  on public.profiles (username_normalized) where username_normalized is not null;

/* --------------------------- reserved usernames ---------------------------- */

-- Blocked usernames (stored lowercase). A table (not a hardcoded list) so the
-- set can be extended later without a code migration. Admin-managed; readable by
-- the availability check.
create table if not exists public.reserved_usernames (
  name text primary key
);

insert into public.reserved_usernames (name) values
  ('admin'),('administrator'),('moderator'),('support'),('openfloor'),
  ('open_floor'),('open-floor'),('staff'),('security'),('privacy'),
  ('legal'),('help'),('system'),('root'),('official')
on conflict (name) do nothing;

alter table public.reserved_usernames enable row level security;
-- No policies: not readable/writable by clients directly. The SECURITY DEFINER
-- helpers below consult it as the owner (bypassing RLS).
revoke all on public.reserved_usernames from anon, authenticated;

/* --------------------------- availability + claim -------------------------- */

-- Pre-signup availability check. Returns ONLY a boolean (available or not) — it
-- never reveals who owns a taken username, only what normal signup validation
-- inherently requires. anon-callable because it runs before authentication.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9_]{2,29}$' then false
    when exists (select 1 from public.reserved_usernames r where r.name = lower(p_username)) then false
    when exists (select 1 from public.profiles p where p.username_normalized = lower(p_username)) then false
    else true
  end;
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Reserve a username for the CALLING user. Validates format, length and the
-- reserved list, then writes username + normalized on the caller's own profile.
-- Concurrency-safe: the unique index means two simultaneous claims for the same
-- normalized username produce exactly one winner; the loser gets 'username_taken'.
-- SECURITY DEFINER because the username columns are not client-updatable (see the
-- column-grant hardening below) — this function is the only write path.
create or replace function public.claim_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_normalized text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9_]{2,29}$' then
    raise exception 'invalid_username' using errcode = 'check_violation';
  end if;
  v_normalized := lower(p_username);
  if exists (select 1 from public.reserved_usernames r where r.name = v_normalized) then
    raise exception 'username_reserved' using errcode = 'check_violation';
  end if;

  update public.profiles
    set username = p_username, username_normalized = v_normalized, updated_at = now()
    where id = v_uid;

  if not found then
    -- The on_auth_user_created trigger normally inserts the profile first; this
    -- is a defensive fallback so an account is never left without a profile.
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

/* ------------------------- column-grant hardening -------------------------- */

-- The "users manage own profile" policy is FOR ALL, so without column grants a
-- user could set username/username_normalized directly (bypassing validation,
-- the reserved list, and the claim path). Restrict client UPDATEs to the safe,
-- self-editable columns only; username* can then change ONLY through
-- claim_username() above. INSERT is unaffected (the trigger creates the row).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, country, investor_type, referral_source, public_anonymous, updated_at)
  on public.profiles to authenticated;

/* ----------------------------- new-user trigger ---------------------------- */

-- Recreate the signup trigger to seed display_name from signup metadata when
-- present (falling back to the email local-part, as before). Username is NOT set
-- here on purpose: it is claimed via claim_username() so uniqueness conflicts can
-- be surfaced to the user instead of being silently swallowed in a trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.claim_username(text) is
  'Reserves a username for auth.uid() on their own profile. Validates format/reserved list; concurrency-safe via the unique index (loser gets username_taken). Only write path for profiles.username* (client UPDATE of those columns is revoked).';
