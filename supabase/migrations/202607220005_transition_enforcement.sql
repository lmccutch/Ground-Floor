-- Server-side status-transition enforcement + search_path hardening for the
-- Prompt 3 admin mutation RPCs (final security audit).
--
-- WHY THIS MIGRATION EXISTS
-- The seven core mutation RPCs plus the notification/support helpers previously
-- wrote status with `status = coalesce(p_status, status)` and NO server-side
-- transition validation — any status could jump to any other status via a direct
-- RPC call. CHECK constraints only bound the *set* of legal values, and the admin
-- UI only *hid* invalid buttons; neither is transition enforcement. This migration
-- adds explicit, provable, server-side transition + completion-metadata gates to
-- every mutation RPC, and hardens each SECURITY DEFINER function's search_path
-- from `public` to `''` (empty) so temporary/public object shadowing cannot alter
-- behaviour regardless of who can CREATE in the public schema.
--
-- Forward-only and production-data-safe: no table, column, row, grant or policy
-- is dropped. Every function is recreated with CREATE OR REPLACE (same name and
-- signature, so existing GRANTs and RLS bindings are preserved) and grants are
-- re-asserted defensively.
--
-- PERMITTED TRANSITIONS (enforced below; proven by scripts/verify-transition-enforcement.ts)
--
--   company_requests.status (via admin_update_company_request):
--     pending           -> under_review | needs_information | rejected | duplicate
--     under_review      -> pending | needs_information | rejected | duplicate
--     needs_information -> pending | under_review | rejected | duplicate
--     approved | rejected | duplicate -> (terminal; no transition via the updater)
--     * 'approved' is NEVER reachable through the generic updater — approval must
--       go through admin_approve_company_request (which creates/links the company).
--
--   campaigns.operational_status (via admin_update_campaign_ops):
--     Operational statuses move freely between active states (active,
--     near_threshold, threshold_reached, outreach_required, outreach_started,
--     management_engaged, scheduled, stalled, paused). Additionally:
--       -> completed  ONLY from outreach_started | management_engaged | scheduled
--                     AND requires a completion reason (closed_reason).
--       -> closed     requires a closed reason (closed_reason).
--     * A campaign can NEVER go straight from active to completed.
--
--   questions.moderation_status (via admin_moderate_question, action-based):
--     publish  allowed from pending_review | reported | restored | published
--     hide     -> hidden      (blocked when already hidden/removed)
--     remove   -> removed
--     restore  allowed ONLY from hidden | removed | archived   (the recovery path)
--     archive  -> archived
--     * A hidden/removed/archived question CANNOT be published directly; it must
--       be restored first. Destructive actions (hide/remove) still require a reason.
--
--   question_reports.status (via admin_resolve_report):
--     pending   -> reviewing | dismissed | action_taken | escalated
--     reviewing -> dismissed | action_taken | escalated
--     escalated -> dismissed | action_taken
--     dismissed | action_taken -> (terminal; a resolved report cannot be re-resolved)
--     * Reaching 'action_taken' via a bare 'confirm' requires a coordinated
--       resolution: either a moderation action (hide/remove, performed atomically)
--       or an explicit resolution note.
--
--   bug_reports.status (via admin_update_bug):
--     new              -> triaged | confirmed | cannot_reproduce | duplicate | closed
--     triaged          -> confirmed | in_progress | cannot_reproduce | duplicate | closed
--     confirmed        -> in_progress | fixed | cannot_reproduce | duplicate | closed
--     in_progress      -> fixed | triaged | cannot_reproduce | duplicate | closed
--     fixed            -> deployed | in_progress | triaged | closed
--     deployed         -> triaged | closed
--     cannot_reproduce -> new | triaged | closed
--     duplicate        -> new | triaged | closed
--     closed           -> triaged | in_progress   (reopen)
--     * A new bug can NEVER go straight to deployed. 'fixed'/'deployed' require
--       fix/deployment metadata (a fixed commit or a fix note).
--
--   support_tickets.status (via admin_update_support_ticket / admin_record_support_response):
--     new             -> open | in_progress | waiting_on_user | resolved | closed | spam
--     open            -> in_progress | waiting_on_user | resolved | closed | spam
--     waiting_on_user -> open | in_progress | resolved | closed | spam
--     in_progress     -> open | waiting_on_user | resolved | closed | spam
--     resolved        -> open | closed
--     closed          -> open        (reopen)
--     spam            -> open | resolved | closed
--     * Moving to 'resolved'/'closed' requires a resolution reason supplied with
--       the request. A new ticket cannot be closed without one.
--
--   admin_notifications: read/unread and dismiss/restore are idempotent boolean
--     flags, not a linear status workflow — no transition graph applies; the RPCs
--     already no-op when the requested flag state already holds.

/* ==========================================================================
   transition matrix (pure logic; no privileges; empty search_path)
   ========================================================================== */

create or replace function public.admin_is_valid_transition(
  p_entity text,
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    -- A no-op (same status) is always permitted; callers gate real transitions.
    when p_from is not distinct from p_to then true

    when p_entity = 'company_request' then case p_from
      when 'pending'           then p_to in ('under_review','needs_information','rejected','duplicate')
      when 'under_review'      then p_to in ('pending','needs_information','rejected','duplicate')
      when 'needs_information' then p_to in ('pending','under_review','rejected','duplicate')
      else false  -- approved/rejected/duplicate are terminal for the generic updater
    end

    when p_entity = 'campaign' then case
      -- 'completed' is reachable only after real outreach progression.
      when p_to = 'completed' then p_from in ('outreach_started','management_engaged','scheduled')
      -- Other operational statuses are intentionally non-linear (an operator may
      -- move between active operational states as the real-world situation shifts).
      else true
    end

    when p_entity = 'bug' then case p_from
      when 'new'              then p_to in ('triaged','confirmed','cannot_reproduce','duplicate','closed')
      when 'triaged'          then p_to in ('confirmed','in_progress','cannot_reproduce','duplicate','closed')
      when 'confirmed'        then p_to in ('in_progress','fixed','cannot_reproduce','duplicate','closed')
      when 'in_progress'      then p_to in ('fixed','triaged','cannot_reproduce','duplicate','closed')
      when 'fixed'            then p_to in ('deployed','in_progress','triaged','closed')
      when 'deployed'         then p_to in ('triaged','closed')
      when 'cannot_reproduce' then p_to in ('new','triaged','closed')
      when 'duplicate'        then p_to in ('new','triaged','closed')
      when 'closed'           then p_to in ('triaged','in_progress')
      else false
    end

    when p_entity = 'support_ticket' then case p_from
      when 'new'             then p_to in ('open','in_progress','waiting_on_user','resolved','closed','spam')
      when 'open'            then p_to in ('in_progress','waiting_on_user','resolved','closed','spam')
      when 'waiting_on_user' then p_to in ('open','in_progress','resolved','closed','spam')
      when 'in_progress'     then p_to in ('open','waiting_on_user','resolved','closed','spam')
      when 'resolved'        then p_to in ('open','closed')
      when 'closed'          then p_to in ('open')
      when 'spam'            then p_to in ('open','resolved','closed')
      else false
    end

    when p_entity = 'question_report' then case p_from
      when 'pending'   then p_to in ('reviewing','dismissed','action_taken','escalated')
      when 'reviewing' then p_to in ('dismissed','action_taken','escalated')
      when 'escalated' then p_to in ('dismissed','action_taken')
      else false  -- dismissed/action_taken are terminal
    end

    else false
  end;
$$;

revoke execute on function public.admin_is_valid_transition(text, text, text) from public, anon;
grant execute on function public.admin_is_valid_transition(text, text, text) to authenticated;

/* ==========================================================================
   hardened shared helpers (search_path '' — bodies unchanged, all refs qualified)
   ========================================================================== */

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships m
    join auth.users u on u.id = m.user_id
    where m.user_id = auth.uid()
      and m.is_active
      and u.email = public.approved_admin_email()
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.write_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb,
  p_reason text default null,
  p_request_ref text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'write_admin_audit: caller is not an administrator'
      using errcode = 'insufficient_privilege';
  end if;
  insert into public.admin_audit_log (admin_user_id, action, entity_type, entity_id, before_state, after_state, reason, request_ref)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason, p_request_ref)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.write_admin_audit(text, text, uuid, jsonb, jsonb, text, text) from public, anon, authenticated;

create or replace function public.create_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_severity text,
  p_entity_type text,
  p_entity_id uuid,
  p_action_path text,
  p_dedup_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.admin_notifications (type, title, message, severity, entity_type, entity_id, action_path, deduplication_key)
  values (p_type, p_title, p_message, coalesce(p_severity, 'info'), p_entity_type, p_entity_id, p_action_path, p_dedup_key)
  on conflict (deduplication_key) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_admin_notification(text, text, text, text, text, uuid, text, text) from public, anon, authenticated;

/* ==========================================================================
   company requests
   ========================================================================== */

create or replace function public.admin_update_company_request(
  p_request_id uuid,
  p_status text default null,
  p_priority text default null,
  p_admin_notes text default null,
  p_rejection_reason text default null,
  p_reason text default null
)
returns public.company_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.company_requests;
  v_after public.company_requests;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.company_requests where id = p_request_id for update;
  if not found then
    raise exception 'company request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  -- Transition enforcement (only when the status actually changes).
  if p_status is not null and p_status is distinct from v_before.status then
    if p_status = 'approved' then
      raise exception 'approve a company request via admin_approve_company_request, not a status update'
        using errcode = 'check_violation';
    end if;
    if not public.admin_is_valid_transition('company_request', v_before.status, p_status) then
      raise exception 'invalid company request transition: % -> %', v_before.status, p_status
        using errcode = 'check_violation';
    end if;
  end if;

  update public.company_requests
    set status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        rejection_reason = coalesce(p_rejection_reason, rejection_reason),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_request_id
    returning * into v_after;

  perform public.write_admin_audit('company_request_update', 'company_request', p_request_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

-- Atomic approval (unchanged logic; search_path hardened, all refs qualified).
create or replace function public.admin_approve_company_request(
  p_request_id uuid,
  p_exchange text default 'NASDAQ',
  p_sector text default 'Unknown',
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.company_requests;
  v_norm text;
  v_company_id uuid;
  v_security_id uuid;
  v_created boolean := false;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_req from public.company_requests where id = p_request_id for update;
  if not found then
    raise exception 'company request % not found', p_request_id using errcode = 'no_data_found';
  end if;

  if v_req.status = 'approved' and v_req.created_company_id is not null then
    return jsonb_build_object('request_id', p_request_id, 'company_id', v_req.created_company_id, 'created', false, 'already_approved', true);
  end if;
  if v_req.status not in ('pending', 'under_review', 'needs_information') then
    raise exception 'company request % is not approvable (status=%).', p_request_id, v_req.status using errcode = 'check_violation';
  end if;

  v_norm := upper(regexp_replace(trim(v_req.ticker), '[-/]', '.', 'g'));

  select s.company_id into v_company_id
    from public.securities s where s.is_active and s.normalized_symbol = v_norm limit 1;
  if v_company_id is null then
    select a.company_id into v_company_id
      from public.company_aliases a
      where a.alias_type = 'former_ticker' and a.normalized_alias = v_norm limit 1;
  end if;

  if v_company_id is null then
    v_company_id := gen_random_uuid();
    insert into public.companies (id, name, ticker, exchange, sector, legal_name, display_name, slug, metadata_source)
    values (
      v_company_id, v_req.company_name, v_req.ticker, p_exchange, p_sector,
      v_req.company_name, v_req.company_name,
      lower(regexp_replace(regexp_replace(v_req.company_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substr(v_company_id::text, 1, 6),
      'admin_request'
    );
    insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, source)
    values (v_company_id, v_req.ticker, v_norm, p_exchange, true, true, 'admin_request')
    returning id into v_security_id;
    update public.companies set primary_security_id = v_security_id where id = v_company_id;
    v_created := true;
  end if;

  update public.company_requests
    set status = 'approved', created_company_id = v_company_id, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_request_id;

  perform public.write_admin_audit('company_request_approve', 'company_request', p_request_id,
    to_jsonb(v_req), jsonb_build_object('company_id', v_company_id, 'created', v_created), p_reason, null);

  update public.admin_notifications set dismissed_at = coalesce(dismissed_at, now())
    where deduplication_key = 'company_request:' || p_request_id;

  return jsonb_build_object('request_id', p_request_id, 'company_id', v_company_id, 'created', v_created);
end;
$$;

/* ==========================================================================
   campaign operations
   ========================================================================== */

create or replace function public.admin_update_campaign_ops(
  p_campaign_id uuid,
  p_operational_status text default null,
  p_assigned_admin uuid default null,
  p_management_contact_status text default null,
  p_internal_notes text default null,
  p_risk_status text default null,
  p_next_follow_up_at timestamptz default null,
  p_supporter_threshold integer default null,
  p_closed_reason text default null,
  p_reason text default null
)
returns public.campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.campaigns;
  v_after public.campaigns;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_before from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign % not found', p_campaign_id using errcode = 'no_data_found';
  end if;

  -- Transition + completion-metadata enforcement (only when status changes).
  if p_operational_status is not null and p_operational_status is distinct from v_before.operational_status then
    if not public.admin_is_valid_transition('campaign', v_before.operational_status, p_operational_status) then
      raise exception 'a campaign cannot move from % to % (complete the outreach workflow first)',
        v_before.operational_status, p_operational_status using errcode = 'check_violation';
    end if;
    if p_operational_status = 'completed'
       and coalesce(nullif(trim(p_closed_reason), ''), nullif(trim(v_before.closed_reason), '')) is null then
      raise exception 'completing a campaign requires a completion reason' using errcode = 'check_violation';
    end if;
    if p_operational_status = 'closed'
       and coalesce(nullif(trim(p_closed_reason), ''), nullif(trim(v_before.closed_reason), '')) is null then
      raise exception 'closing a campaign requires a closed reason' using errcode = 'check_violation';
    end if;
  end if;

  update public.campaigns
    set operational_status = coalesce(p_operational_status, operational_status),
        assigned_admin = coalesce(p_assigned_admin, assigned_admin),
        management_contact_status = coalesce(p_management_contact_status, management_contact_status),
        internal_notes = coalesce(p_internal_notes, internal_notes),
        risk_status = coalesce(p_risk_status, risk_status),
        next_follow_up_at = coalesce(p_next_follow_up_at, next_follow_up_at),
        supporter_threshold = coalesce(p_supporter_threshold, supporter_threshold),
        closed_reason = coalesce(p_closed_reason, closed_reason),
        last_outreach_at = case when p_operational_status = 'outreach_started' then now() else last_outreach_at end
    where id = p_campaign_id
    returning * into v_after;

  perform public.write_admin_audit('campaign_ops_update', 'campaign', p_campaign_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ==========================================================================
   question moderation
   ========================================================================== */

create or replace function public.admin_moderate_question(
  p_question_id uuid,
  p_action text,
  p_reason text default null
)
returns public.questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.questions;
  v_after public.questions;
  v_new_mod text;
  v_new_status public.question_status;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action not in ('publish', 'hide', 'remove', 'restore', 'archive') then
    raise exception 'unknown moderation action: %', p_action using errcode = 'check_violation';
  end if;
  if p_action in ('hide', 'remove') and coalesce(trim(p_reason), '') = '' then
    raise exception 'a reason is required to % a question', p_action using errcode = 'check_violation';
  end if;

  select * into v_before from public.questions where id = p_question_id for update;
  if not found then
    raise exception 'question % not found', p_question_id using errcode = 'no_data_found';
  end if;

  -- Restore-path enforcement: a hidden/removed/archived question can NEVER be
  -- published directly — it must be restored first (which is a deliberate,
  -- auditable action). And 'restore' only applies to a hidden/removed/archived
  -- question.
  if p_action = 'publish' and v_before.moderation_status in ('hidden', 'removed', 'archived') then
    raise exception 'a % question must be restored before it can be published', v_before.moderation_status
      using errcode = 'check_violation';
  end if;
  if p_action = 'restore' and v_before.moderation_status not in ('hidden', 'removed', 'archived') then
    raise exception 'only a hidden, removed or archived question can be restored (current: %)', v_before.moderation_status
      using errcode = 'check_violation';
  end if;

  case p_action
    when 'publish' then v_new_mod := 'published'; v_new_status := 'Open';
    when 'hide'    then v_new_mod := 'hidden';    v_new_status := 'Archived';
    when 'remove'  then v_new_mod := 'removed';   v_new_status := 'Archived';
    when 'restore' then v_new_mod := 'restored';  v_new_status := 'Open';
    when 'archive' then v_new_mod := 'archived';  v_new_status := 'Archived';
  end case;

  update public.questions
    set moderation_status = v_new_mod,
        status = v_new_status,
        moderated_by = auth.uid(),
        moderated_at = now(),
        moderation_reason = p_reason
    where id = p_question_id
    returning * into v_after;

  perform public.write_admin_audit('question_moderate', 'question', p_question_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ==========================================================================
   report resolution
   ========================================================================== */

create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_action text,
  p_resolution text default null,
  p_reason text default null
)
returns public.question_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.question_reports;
  v_after public.question_reports;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action not in ('dismiss', 'confirm', 'hide_question', 'remove_question', 'escalate') then
    raise exception 'unknown report action: %', p_action using errcode = 'check_violation';
  end if;

  select * into v_before from public.question_reports where id = p_report_id for update;
  if not found then
    raise exception 'report % not found', p_report_id using errcode = 'no_data_found';
  end if;

  -- Only an open report may be resolved; a dismissed/action_taken report is terminal.
  if v_before.status not in ('pending', 'reviewing', 'escalated') then
    raise exception 'report % is already resolved (status=%) and cannot be re-resolved', p_report_id, v_before.status
      using errcode = 'check_violation';
  end if;
  if p_action = 'escalate' and v_before.status not in ('pending', 'reviewing') then
    raise exception 'only a pending or reviewing report can be escalated (current: %)', v_before.status
      using errcode = 'check_violation';
  end if;
  -- Reaching 'action_taken' via a bare confirm requires a coordinated resolution:
  -- either a moderation action (hide/remove, performed atomically below) or an
  -- explicit resolution statement. A confirm with neither is rejected.
  if p_action = 'confirm' and coalesce(trim(p_resolution), '') = '' then
    raise exception 'confirming a report as action-taken requires a coordinated resolution (a resolution note, or a hide/remove action)'
      using errcode = 'check_violation';
  end if;

  if p_action = 'hide_question' then
    perform public.admin_moderate_question(v_before.question_id, 'hide', coalesce(p_reason, 'Report resolved: hidden'));
  elsif p_action = 'remove_question' then
    perform public.admin_moderate_question(v_before.question_id, 'remove', coalesce(p_reason, 'Report resolved: removed'));
  end if;

  v_status := case p_action
    when 'dismiss' then 'dismissed'
    when 'escalate' then 'escalated'
    else 'action_taken'
  end;

  update public.question_reports
    set status = v_status,
        resolution = coalesce(p_resolution, resolution),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_report_id
    returning * into v_after;

  perform public.write_admin_audit('report_resolve', 'question_report', p_report_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);

  update public.admin_notifications set dismissed_at = coalesce(dismissed_at, now())
    where deduplication_key = 'question_report:' || p_report_id;
  return v_after;
end;
$$;

/* ==========================================================================
   bug + support triage
   ========================================================================== */

create or replace function public.admin_update_bug(
  p_bug_id uuid,
  p_status text default null,
  p_severity text default null,
  p_assigned_to uuid default null,
  p_admin_notes text default null,
  p_linked_issue_url text default null,
  p_fixed_commit text default null,
  p_reason text default null
)
returns public.bug_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.bug_reports;
  v_after public.bug_reports;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into v_before from public.bug_reports where id = p_bug_id for update;
  if not found then
    raise exception 'bug report % not found', p_bug_id using errcode = 'no_data_found';
  end if;

  if p_status is not null and p_status is distinct from v_before.status then
    if not public.admin_is_valid_transition('bug', v_before.status, p_status) then
      raise exception 'invalid bug transition: % -> %', v_before.status, p_status using errcode = 'check_violation';
    end if;
    -- 'fixed'/'deployed' require fix/deployment metadata: a fixed commit or a note
    -- (supplied now or already recorded). This blocks e.g. new -> deployed even if
    -- the transition graph were widened, and documents the deployment.
    if p_status in ('fixed', 'deployed')
       and coalesce(
             nullif(trim(p_fixed_commit), ''), nullif(trim(v_before.fixed_commit), ''),
             nullif(trim(p_admin_notes), ''), nullif(trim(v_before.admin_notes), '')
           ) is null then
      raise exception 'marking a bug % requires fix/deployment metadata (a fixed commit or a note)', p_status
        using errcode = 'check_violation';
    end if;
  end if;

  update public.bug_reports
    set status = coalesce(p_status, status),
        severity = coalesce(p_severity, severity),
        assigned_to = coalesce(p_assigned_to, assigned_to),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        linked_issue_url = coalesce(p_linked_issue_url, linked_issue_url),
        fixed_commit = coalesce(p_fixed_commit, fixed_commit),
        resolved_at = case when coalesce(p_status, status) in ('fixed', 'deployed', 'closed') then coalesce(resolved_at, now()) else resolved_at end
    where id = p_bug_id
    returning * into v_after;

  perform public.write_admin_audit('bug_update', 'bug_report', p_bug_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status text default null,
  p_priority text default null,
  p_assigned_to uuid default null,
  p_admin_notes text default null,
  p_reason text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = ''
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

  if p_status is not null and p_status is distinct from v_before.status then
    if not public.admin_is_valid_transition('support_ticket', v_before.status, p_status) then
      raise exception 'invalid support ticket transition: % -> %', v_before.status, p_status using errcode = 'check_violation';
    end if;
    -- Resolving/closing requires a resolution reason supplied with THIS request.
    if p_status in ('resolved', 'closed')
       and coalesce(nullif(trim(p_reason), ''), nullif(trim(p_admin_notes), '')) is null then
      raise exception 'resolving or closing a support ticket requires a resolution reason' using errcode = 'check_violation';
    end if;
  end if;

  update public.support_tickets
    set status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        assigned_to = coalesce(p_assigned_to, assigned_to),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        resolved_at = case when coalesce(p_status, status) in ('resolved', 'closed') then coalesce(resolved_at, now()) else resolved_at end
    where id = p_ticket_id
    returning * into v_after;

  perform public.write_admin_audit('support_ticket_update', 'support_ticket', p_ticket_id,
    to_jsonb(v_before), to_jsonb(v_after), p_reason, null);
  return v_after;
end;
$$;

/* ==========================================================================
   notification controls (idempotent flags — no status workflow)
   ========================================================================== */

create or replace function public.admin_mark_notification_read(
  p_notification_id uuid,
  p_read boolean default true
)
returns public.admin_notifications
language plpgsql
security definer
set search_path = ''
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
set search_path = ''
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

/* ==========================================================================
   support: record response (may also transition status)
   ========================================================================== */

create or replace function public.admin_record_support_response(
  p_ticket_id uuid,
  p_status text default null,
  p_summary text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = ''
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

  -- Any status change goes through the same transition + resolution gates.
  if p_status is not null and p_status is distinct from v_before.status then
    if not public.admin_is_valid_transition('support_ticket', v_before.status, p_status) then
      raise exception 'invalid support ticket transition: % -> %', v_before.status, p_status using errcode = 'check_violation';
    end if;
    if p_status in ('resolved', 'closed')
       and coalesce(nullif(trim(p_summary), ''), nullif(trim(v_before.admin_notes), '')) is null then
      raise exception 'resolving or closing a support ticket requires a resolution reason' using errcode = 'check_violation';
    end if;
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

/* ==========================================================================
   grants (re-asserted defensively; CREATE OR REPLACE preserves them, but this
   keeps the security posture explicit and self-documenting)
   ========================================================================== */

do $$
declare fn text;
begin
  foreach fn in array array[
    'admin_update_company_request(uuid, text, text, text, text, text)',
    'admin_approve_company_request(uuid, text, text, text)',
    'admin_update_campaign_ops(uuid, text, uuid, text, text, text, timestamptz, integer, text, text)',
    'admin_moderate_question(uuid, text, text)',
    'admin_resolve_report(uuid, text, text, text)',
    'admin_update_bug(uuid, text, text, uuid, text, text, text, text)',
    'admin_update_support_ticket(uuid, text, text, uuid, text, text)',
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

-- is_admin() remains callable by anon+authenticated (it must return false, not
-- error, for non-admins — RLS policies depend on that). Re-assert it explicitly.
grant execute on function public.is_admin() to anon, authenticated;

comment on function public.admin_is_valid_transition(text, text, text) is
  'Pure transition matrix for admin workflow entities (company_request, campaign, bug, support_ticket, question_report). Returns true for a permitted from->to status change (a no-op is always permitted). Question moderation is action-based and gated inside admin_moderate_question. Referenced by the admin mutation RPCs to reject invalid direct-RPC transitions server-side.';
