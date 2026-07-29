-- Private bug-report attachments (Prompt 5, Deliverable 5).
--
-- Additive and forward-only.
--
-- AUDIT NOTE: bug_reports already had a vestigial `screenshot_path text` column
-- from 202607210003 with no bucket, no policies, no upload path and no reader.
-- It is NOT dropped (forward-only) and NOT reused: a single text path cannot
-- express multiple files, sanitized names, validated MIME types, sizes or access
-- auditing. It is left in place, unused, and documented as superseded.
--
-- STORAGE MODEL
--   Bucket: 'bug-attachments', PRIVATE (public = false). There is no public URL
--   for any object in it, ever.
--   No storage RLS policy is granted to anon or authenticated. That is
--   deliberate, not an omission: every read and write goes through an Edge
--   Function using the service role, which is the only place MIME sniffing,
--   size limits and admin authorization can actually be enforced. With no
--   policy, PostgREST/Storage denies browser access by default.
--   Object paths are SERVER-GENERATED (<bug_id>/<uuid>.<ext>) — the uploader's
--   filename is never used as a path, only recorded separately after sanitizing.
--
-- LIMITATIONS (documented, not hidden)
--   * There is NO malware scanning. No scanner is integrated, so no file is
--     "clean" — the mitigations are the narrow type allowlist (PNG/JPEG/WebP/PDF
--     only, verified by magic bytes server-side), small size caps, private
--     storage, short-lived signed URLs, and never rendering a PDF inline.
--   * SVG, HTML, JS, archives and executables are rejected outright: SVG and
--     HTML are script-bearing formats and would be an XSS vector in the admin
--     console even from private storage.

/* ------------------------------ storage bucket ----------------------------- */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-attachments', 'bug-attachments', false,
  5242880,  -- 5 MB per object, enforced again by the Edge Function
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

-- NOTE: storage.buckets is owned by supabase_storage_admin, so no COMMENT is set
-- on it here (COMMENT requires ownership and would abort the migration). The
-- invariant is instead asserted at runtime: /admin/system raises a CRITICAL
-- warning if bug-attachments is ever found with public = true.

/* ---------------------------- bug_attachments ------------------------------ */

create table if not exists public.bug_attachments (
  id uuid primary key default gen_random_uuid(),
  bug_report_id uuid not null references public.bug_reports(id) on delete cascade,
  -- Server-generated object key inside the private bucket. Never derived from
  -- the uploaded filename.
  object_path text not null unique,
  -- The uploader's filename AFTER sanitizing (path separators, control chars and
  -- leading dots removed). Display only — never used to address the object.
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  -- Set when a submitter was signed in; anonymous submissions leave it null.
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bug_attachments_bug_idx on public.bug_attachments (bug_report_id, created_at);

alter table public.bug_attachments enable row level security;

-- Admin-only read. No client INSERT/UPDATE/DELETE policy: rows arrive solely
-- through record_bug_attachment() (service role, called by the intake function
-- after the file has been validated and stored).
create policy "admin reads bug attachments" on public.bug_attachments
  for select using (public.is_admin());

revoke all on public.bug_attachments from anon, authenticated;
grant select on public.bug_attachments to authenticated;  -- RLS still restricts to the admin

comment on table public.bug_attachments is
  'Metadata for files attached to a public bug report. Objects live in the PRIVATE bug-attachments storage bucket and are reachable only through short-lived signed URLs minted by the admin-attachment-url Edge Function. Files are NOT malware-scanned; type and size limits plus private storage are the mitigations.';
comment on column public.bug_reports.screenshot_path is
  'SUPERSEDED by public.bug_attachments (202607280003). Unused; retained because migrations are forward-only.';

/* ------------------------- attachment count guard -------------------------- */

-- Hard cap of 3 files per report, enforced in the database so a compromised or
-- buggy client cannot exceed it even if the Edge Function check is bypassed.
create or replace function public.enforce_bug_attachment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_total bigint;
begin
  select count(*), coalesce(sum(size_bytes), 0) into v_count, v_total
  from public.bug_attachments where bug_report_id = new.bug_report_id;
  if v_count >= 3 then
    raise exception 'A bug report may have at most 3 attachments.' using errcode = 'check_violation';
  end if;
  if v_total + new.size_bytes > 10485760 then
    raise exception 'Attachments for a bug report may total at most 10 MB.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_bug_attachment_limit() from public, anon, authenticated;

drop trigger if exists bug_attachments_limit on public.bug_attachments;
create trigger bug_attachments_limit before insert on public.bug_attachments
  for each row execute function public.enforce_bug_attachment_limit();

/* --------------------------- record_bug_attachment ------------------------- */

-- Called by submit-intake (service role) AFTER the object has been uploaded and
-- its magic bytes verified. Validates independently of the caller: the report
-- must exist, the type must be in the allowlist, and the object path must live
-- under that report's prefix (which is what prevents one report's row from
-- pointing at another report's object).
create or replace function public.record_bug_attachment(
  p_bug_report_id uuid,
  p_object_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes integer,
  p_uploaded_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text;
begin
  if not exists (select 1 from public.bug_reports where id = p_bug_report_id) then
    raise exception 'bug report % not found', p_bug_report_id using errcode = 'no_data_found';
  end if;
  -- Cross-record protection: the object key must be inside this report's prefix.
  if p_object_path is null or p_object_path not like p_bug_report_id::text || '/%' then
    raise exception 'attachment path does not belong to that bug report' using errcode = 'check_violation';
  end if;
  if p_mime_type not in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf') then
    raise exception 'unsupported attachment type' using errcode = 'check_violation';
  end if;

  -- Sanitize the display name: strip any directory component, control characters
  -- and leading dots, then cap the length. Never used as a path.
  v_name := regexp_replace(coalesce(p_original_filename, 'attachment'), '.*[/\\]', '');
  v_name := regexp_replace(v_name, '[\x00-\x1F\x7F]', '', 'g');
  v_name := regexp_replace(v_name, '^[.\s]+', '');
  v_name := left(nullif(trim(v_name), ''), 120);

  insert into public.bug_attachments (
    bug_report_id, object_path, original_filename, mime_type, size_bytes, uploaded_by)
  values (
    p_bug_report_id, p_object_path, coalesce(v_name, 'attachment'), p_mime_type,
    p_size_bytes, p_uploaded_by)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.record_bug_attachment(uuid, text, text, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.record_bug_attachment(uuid, text, text, text, integer, uuid) to service_role;

/* ------------------------ admin access: resolve + audit -------------------- */

-- Resolves an attachment to its private object path FOR THE ADMINISTRATOR ONLY
-- and records the access in the audit log. The signed URL itself is minted by
-- the admin-attachment-url Edge Function (Storage signing is not available from
-- SQL); this function is the authorization + audit gate in front of it, so a
-- non-admin cannot obtain a path to sign even if they could reach the function.
create or replace function public.admin_resolve_attachment(
  p_attachment_id uuid,
  p_intent text default 'view'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.bug_attachments;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into a from public.bug_attachments where id = p_attachment_id;
  if not found then
    raise exception 'attachment % not found', p_attachment_id using errcode = 'no_data_found';
  end if;

  -- Cheap abuse guard on bulk enumeration of private objects.
  if not public.check_login_rate_limit('attachment_access:' || auth.uid()::text, 60, 3600) then
    raise exception 'Too many attachment requests. Please wait a moment.' using errcode = 'check_violation';
  end if;

  perform public.write_admin_audit(
    case when p_intent = 'download' then 'attachment_downloaded' else 'attachment_viewed' end,
    'bug_report', a.bug_report_id, null,
    jsonb_build_object('attachment_id', a.id, 'filename', a.original_filename,
      'mime_type', a.mime_type, 'size_bytes', a.size_bytes),
    null, null);

  return jsonb_build_object(
    'object_path', a.object_path,
    'filename', a.original_filename,
    'mime_type', a.mime_type,
    'size_bytes', a.size_bytes);
end;
$$;

revoke execute on function public.admin_resolve_attachment(uuid, text) from public, anon;
grant execute on function public.admin_resolve_attachment(uuid, text) to authenticated;

comment on function public.admin_resolve_attachment(uuid, text) is
  'Administrator-only resolution of a private bug attachment to its storage object path, with an audit entry for every access. is_admin()-guarded and rate-limited. The signed URL is minted from this path by the admin-attachment-url Edge Function; only the administrator can reach either step.';

/* ------------------------- orphan cleanup + alerting ----------------------- */

-- Called by submit-intake when a submission's attachment upload fails after the
-- bug report was already created. Raises a deduplicated admin notification so a
-- silently incomplete report is visible rather than lost.
create or replace function public.record_attachment_failure(
  p_bug_report_id uuid,
  p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_admin_notification(
    'attachment_failed',
    'Attachment upload failed on a submitted bug report',
    'A bug report was recorded but at least one attached file could not be stored'
      || case when p_detail is null then '.' else ' (' || left(p_detail, 200) || ').' end
      || ' The report is complete apart from the missing file — ask the reporter to resend it if it matters.',
    'medium', 'bug_report', p_bug_report_id, '/admin/bugs',
    'attachment_failed:' || p_bug_report_id::text);
end;
$$;

revoke execute on function public.record_attachment_failure(uuid, text) from public, anon, authenticated;
grant execute on function public.record_attachment_failure(uuid, text) to service_role;

/* --------------------- notification types for Prompt 5 --------------------- */

-- Widen the notification type allowlist for the new operational events. This is
-- a superset of the existing values, so every historical row remains valid.
alter table public.admin_notifications drop constraint if exists admin_notifications_type_check;
alter table public.admin_notifications add constraint admin_notifications_type_check
  check (type in (
    'company_request_submitted','campaign_near_threshold','campaign_threshold_reached',
    'question_reported','bug_submitted','support_ticket_created','email_failed',
    'webhook_failed','security_alert',
    -- Prompt 5
    'attachment_failed','queue_stale','system_warning'
  ));
