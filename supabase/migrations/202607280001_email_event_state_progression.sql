-- Monotonic, out-of-order-safe email delivery-state progression (Prompt 4 fix).
--
-- Additive, forward-only. Fixes a status-regression bug in record_email_event
-- (introduced in 202607230002_email_events.sql): it applied `status = v_status`
-- UNCONDITIONALLY, so when Resend delivered webhook events out of order — e.g.
-- email.delivered followed milliseconds later by an earlier-stage email.sent —
-- the trailing event REGRESSED status delivered -> sent. It also wrote the event
-- name ("sent"/"delivered") into error_code for successful events, polluting the
-- email-health view.
--
-- This migration replaces the recorder with an explicit transition graph and
-- corrects the error metadata rules. It also runs a narrow one-time repair of
-- rows already corrupted by the previous behavior. Nothing is dropped.

/* ------------------------- transition graph helpers ------------------------ */

-- Progress rank along the POSITIVE delivery axis only. Adverse/off-axis states
-- return -1 and are handled explicitly by email_next_status (never by rank).
create or replace function public.email_status_rank(p_status text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'queued'     then 0
    when 'sent'       then 1
    when 'delayed'    then 2
    when 'delivered'  then 3
    when 'complained' then 4  -- a complaint legitimately follows delivery
    else -1                    -- bounced / failed / suppressed / unknown
  end;
$$;

-- Decide the status to store given the current status and an incoming event's
-- mapped status. Explicit graph (NOT a naive total rank) so it handles the
-- mutually-exclusive terminal outcomes and complained-after-delivered correctly:
--
--   * bounced/complained/failed/suppressed are STICKY terminals — once set, no
--     later event (earlier-stage, duplicate, or contradictory) may change them.
--   * From anywhere on the positive path a complaint always wins (post-delivery).
--   * A bounce/failure sets an adverse terminal EXCEPT over a confirmed delivery
--     (delivered and bounced are mutually exclusive; the confirmed inbox delivery
--     is authoritative, so a late bounce/failure is ignored).
--   * Otherwise (sent/delivered/delayed) advance-only by rank: a later event with
--     a lower rank (out-of-order) never regresses a higher one.
create or replace function public.email_next_status(p_cur text, p_evt text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_cur in ('bounced','complained','failed','suppressed') then p_cur
    when p_evt = 'complained' then 'complained'
    when p_evt in ('bounced','failed') then
      case when p_cur = 'delivered' then 'delivered' else p_evt end
    else
      case when public.email_status_rank(p_evt) > public.email_status_rank(p_cur)
        then p_evt else p_cur end
  end;
$$;

comment on function public.email_status_rank(text) is
  'Positive-delivery progress rank (queued<sent<delayed<delivered<complained); adverse/unknown = -1. Helper for email_next_status.';
comment on function public.email_next_status(text, text) is
  'Explicit email delivery-state transition graph: monotonic, out-of-order-safe, sticky adverse terminals, complained supersedes delivered, confirmed delivery beats a late bounce/failure.';

/* --------------------------- corrected recorder ---------------------------- */

-- Error-metadata policy (documented decision):
--   * SUCCESS events (email.sent, email.delivered) never write an event name into
--     error_code. A confirmed delivery additionally CLEARS stale transient error
--     metadata (e.g. a prior delivery_delayed reason) because the condition has
--     resolved.
--   * TRANSIENT email.delivery_delayed records status 'delayed' only; it is not a
--     failure, so it writes no error_code/error details.
--   * ADVERSE events (email.bounced, email.complained, email.failed) populate
--     error_code + sanitized error details — but only when the event actually
--     advances the row into that adverse state (duplicates/older events don't
--     rewrite it, and don't re-raise the admin notification).
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
  v_evt_status text;
  v_cur text;
  v_target text;
  v_advanced boolean;
  v_is_adverse boolean;
begin
  v_evt_status := case p_event
    when 'email.sent'             then 'sent'
    when 'email.delivered'        then 'delivered'
    when 'email.delivery_delayed' then 'delayed'
    when 'email.bounced'          then 'bounced'
    when 'email.complained'       then 'complained'
    when 'email.failed'           then 'failed'
    else null
  end;
  if v_evt_status is null then
    return false;  -- unknown/irrelevant event: ignore rather than trust it
  end if;

  select status into v_cur from public.email_messages
    where provider_message_id = p_provider_message_id;
  if not found then
    return false;  -- no matching message we sent; nothing to update
  end if;

  v_target     := public.email_next_status(v_cur, v_evt_status);
  v_advanced   := (v_target is distinct from v_cur);
  v_is_adverse := v_evt_status in ('bounced','complained','failed');

  update public.email_messages
    set status = v_target,
        error_code = case
          when v_is_adverse and v_advanced then coalesce(p_error_code, split_part(p_event, '.', 2))
          when v_target = 'delivered' and v_advanced then null
          else error_code
        end,
        error_message_sanitized = case
          when v_is_adverse and v_advanced then left(p_error_message, 500)
          when v_target = 'delivered' and v_advanced then null
          else error_message_sanitized
        end,
        -- First timestamp per milestone wins (coalesce); an adverse/positive
        -- timestamp is stamped only when the event is actually adopted, so a
        -- rejected late event never leaves a contradictory *_at behind.
        sent_at      = coalesce(sent_at,      case when v_advanced and v_target = 'sent'       then now() end),
        delivered_at = coalesce(delivered_at, case when v_advanced and v_target = 'delivered'  then now() end),
        bounced_at   = coalesce(bounced_at,   case when v_advanced and v_target = 'bounced'    then now() end),
        complained_at= coalesce(complained_at,case when v_advanced and v_target = 'complained' then now() end),
        failed_at    = coalesce(failed_at,    case when v_advanced and v_target = 'failed'     then now() end),
        updated_at = now()
    where provider_message_id = p_provider_message_id
    returning * into v_row;

  if v_advanced and v_target in ('bounced','complained','failed') then
    perform public.create_admin_notification(
      'email_failed',
      'Email ' || v_target || ' — ' || coalesce(v_row.template, 'unknown template'),
      'A transactional email was reported ' || v_target || ' by the provider. See the System email-health panel.',
      'high', v_row.entity_type, v_row.entity_id, '/admin/system',
      'email_event:' || p_provider_message_id || ':' || v_target);
  end if;
  return true;
end;
$$;

revoke execute on function public.record_email_event(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_email_event(text, text, text, text) to service_role;

comment on function public.record_email_event(text, text, text, text) is
  'Applies a verified Resend delivery event to the matching email_messages row using a monotonic, out-of-order-safe transition graph (public.email_next_status). Success events never pollute error_code; delivery clears stale transient errors; adverse terminals are sticky and raise one high-priority admin notification on the transition. service_role only; called by the resend-webhook Edge Function after signature verification. Idempotent.';

/* ----------------------- one-time historical repair ------------------------ */

-- Repair rows corrupted by the previous unconditional writer. Narrow and safe:
--   (a) a confirmed delivery (delivered_at set) that a late earlier-stage event
--       regressed to an earlier POSITIVE status -> restore 'delivered'. Never
--       touches bounced/complained/failed rows.
update public.email_messages
  set status = 'delivered', updated_at = now()
  where delivered_at is not null
    and status in ('queued','sent','delayed');

--   (b) clear success-event names wrongly stored in error_code on non-adverse
--       rows (the "error_code = 'sent'" pollution). Genuine adverse rows keep
--       their real error_code (bounced/complained/failed/...).
update public.email_messages
  set error_code = null, updated_at = now()
  where error_code in ('sent','delivered','delayed','delivery_delayed')
    and status not in ('bounced','complained','failed');
