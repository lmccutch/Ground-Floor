-- Admin operational controls not already covered by 202607210004 (Prompt 3).
--
-- The seven core mutation RPCs (company requests, campaigns, questions, reports,
-- bugs, support) already exist and are reused as-is. This migration adds only the
-- gaps the read-only phase left:
--   * notification state controls (mark read / unread, dismiss / restore)
--   * a support "record response" action that stamps last_response_at
-- All are narrow, is_admin()-guarded, audited, idempotent where meaningful, and
-- never touch anything they shouldn't. No new tables, no second audit/notification
-- system, no generic table mutator.

/* ---------------------------- notification controls ------------------------ */

create or replace function public.admin_mark_notification_read(
  p_notification_id uuid,
  p_read boolean default true
)
returns public.admin_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.admin_notifications;
  v_after public.admin_notifications;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.admin_notifications where id = p_notification_id for update;
  if not found then
    raise exception 'notification % not found', p_notification_id using errcode = 'no_data_found';
  end if;

  -- Idempotent no-op: already in the requested read state (no audit noise).
  if (p_read and v_before.read_at is not null) or (not p_read and v_before.read_at is null) then
    return v_before;
  end if;

  update public.admin_notifications
    set read_at = case when p_read then now() else null end
    where id = p_notification_id
    returning * into v_after;

  perform public.write_admin_audit(
    case when p_read then 'notification_mark_read' else 'notification_mark_unread' end,
    'admin_notification', p_notification_id, to_jsonb(v_before), to_jsonb(v_after), null, null);
  return v_after;
end;
$$;

create or replace function public.admin_dismiss_notification(
  p_notification_id uuid,
  p_dismiss boolean default true
)
returns public.admin_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.admin_notifications;
  v_after public.admin_notifications;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.admin_notifications where id = p_notification_id for update;
  if not found then
    raise exception 'notification % not found', p_notification_id using errcode = 'no_data_found';
  end if;

  -- Idempotent no-op: already in the requested dismissed state.
  if (p_dismiss and v_before.dismissed_at is not null) or (not p_dismiss and v_before.dismissed_at is null) then
    return v_before;
  end if;

  update public.admin_notifications
    set dismissed_at = case when p_dismiss then now() else null end
    where id = p_notification_id
    returning * into v_after;

  perform public.write_admin_audit(
    case when p_dismiss then 'notification_dismiss' else 'notification_restore' end,
    'admin_notification', p_notification_id, to_jsonb(v_before), to_jsonb(v_after), null, null);
  return v_after;
end;
$$;

/* --------------------------- support: record response ---------------------- */

-- Records that the administrator responded to a ticket (out of band — this system
-- does not send the email itself). Stamps last_response_at, optionally transitions
-- status, and appends a dated summary to the internal notes. Reusing
-- admin_update_support_ticket is not enough because it has no last_response_at.
create or replace function public.admin_record_support_response(
  p_ticket_id uuid,
  p_status text default null,
  p_summary text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.support_tickets;
  v_after public.support_tickets;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.support_tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'support ticket % not found', p_ticket_id using errcode = 'no_data_found';
  end if;

  update public.support_tickets
    set last_response_at = now(),
        status = coalesce(p_status, status),
        admin_notes = case
          when coalesce(trim(p_summary), '') = '' then admin_notes
          else coalesce(admin_notes || E'\n\n', '') || to_char(now(), 'YYYY-MM-DD') || ' — response: ' || p_summary
        end
    where id = p_ticket_id
    returning * into v_after;

  perform public.write_admin_audit('support_response_recorded', 'support_ticket', p_ticket_id,
    to_jsonb(v_before), to_jsonb(v_after), p_summary, null);
  return v_after;
end;
$$;

/* --------------------------------- grants ---------------------------------- */

do $$
declare fn text;
begin
  foreach fn in array array[
    'admin_mark_notification_read(uuid, boolean)',
    'admin_dismiss_notification(uuid, boolean)',
    'admin_record_support_response(uuid, text, text)'
  ]
  loop
    execute format('revoke execute on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end;
$$;
