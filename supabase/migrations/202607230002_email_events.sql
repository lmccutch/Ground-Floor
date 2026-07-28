-- Email delivery-event recorder for the Resend webhook (Prompt 4).
--
-- Additive, forward-only. The resend-webhook Edge Function verifies the Svix
-- signature and then calls this function (service role) to apply the event to the
-- matching email_messages row and raise a high-priority admin notification on a
-- bounce/complaint/failure. Idempotent: re-applying the same event sets the same
-- timestamps, and the notification deduplication key includes the provider id and
-- event so retries never flood.

create or replace function public.record_email_event(
  p_provider_message_id text,
  p_event text,
  p_error_code text default null,
  p_error_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.email_messages;
  v_status text;
begin
  v_status := case p_event
    when 'email.sent'             then 'sent'
    when 'email.delivered'        then 'delivered'
    when 'email.delivery_delayed' then 'delayed'
    when 'email.bounced'          then 'bounced'
    when 'email.complained'       then 'complained'
    when 'email.failed'           then 'failed'
    else null
  end;
  if v_status is null then
    return false;  -- unknown/irrelevant event: ignore rather than trust it
  end if;

  update public.email_messages
    set status = v_status,
        error_code = coalesce(p_error_code, error_code),
        error_message_sanitized = coalesce(left(p_error_message, 500), error_message_sanitized),
        sent_at      = coalesce(sent_at,      case when v_status = 'sent'       then now() else null end),
        delivered_at = coalesce(delivered_at, case when v_status = 'delivered'  then now() else null end),
        bounced_at   = coalesce(bounced_at,   case when v_status = 'bounced'    then now() else null end),
        complained_at= coalesce(complained_at,case when v_status = 'complained' then now() else null end),
        failed_at    = coalesce(failed_at,    case when v_status = 'failed'     then now() else null end),
        updated_at = now()
    where provider_message_id = p_provider_message_id
    returning * into v_row;

  if not found then
    return false;  -- no matching message we sent; nothing to update
  end if;

  if v_status in ('bounced', 'complained', 'failed') then
    perform public.create_admin_notification(
      'email_failed',
      'Email ' || v_status || ' — ' || coalesce(v_row.template, 'unknown template'),
      'A transactional email was reported ' || v_status || ' by the provider. See the System email-health panel.',
      'high', v_row.entity_type, v_row.entity_id, '/admin/system',
      'email_event:' || p_provider_message_id || ':' || v_status);
  end if;
  return true;
end;
$$;

revoke execute on function public.record_email_event(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_email_event(text, text, text, text) to service_role;

-- record_email_attempt (from 202607230001) is called by the send Edge Function via
-- the service role; the revoke-from-PUBLIC there also dropped service_role's
-- inherited access, so grant it back explicitly (service_role only).
grant execute on function public.record_email_attempt(text, text, text, uuid, text, text, text, text, text) to service_role;

comment on function public.record_email_event(text, text, text, text) is
  'Applies a verified Resend delivery event to the matching email_messages row and raises a high-priority email_failed admin notification on bounce/complaint/failure. service_role only; called by the resend-webhook Edge Function after signature verification. Idempotent.';
