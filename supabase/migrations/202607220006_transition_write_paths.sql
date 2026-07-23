-- Write-path hardening: make server-side transition enforcement PATH-COMPLETE.
--
-- Migration 202607220005 added transition gates inside the admin mutation RPCs.
-- But five workflow tables (company_requests, bug_reports, support_tickets,
-- question_reports, questions) carry an `... for all using is_admin()` RLS policy,
-- and Supabase grants UPDATE to `authenticated` by default. That left ONE way to
-- bypass the RPC gates: a direct PostgREST PATCH issued by the sole admin
-- (e.g. PATCH /rest/v1/bug_reports {status:'deployed'}), which the "admin manages"
-- policy would permit. campaigns are already immune (they have NO admin UPDATE
-- policy — only the SECURITY DEFINER RPCs, running as owner, can write them).
--
-- This migration removes the UPDATE privilege that made that bypass possible, so
-- every status change MUST go through a transition-checked RPC. It is a
-- privilege-only, forward-only change: no table, row, policy or data is altered,
-- and the admin app is unaffected (adminApi.ts performs NO direct table writes —
-- only the is_admin()-guarded definer RPCs, which run as the table owner and are
-- not constrained by these role grants).
--
-- What is deliberately preserved:
--   * INSERT — users still file company requests / bug reports / support tickets /
--     question reports, and still ask questions (RLS still governs which rows).
--   * DELETE — users still delete their own eligible questions (unchanged).
--   * questions edits — users may still edit ONLY their own question text/topic, so
--     UPDATE is re-granted at COLUMN scope for exactly those two columns. All
--     moderation columns (moderation_status/status/moderated_*) are therefore no
--     longer directly writable by a client, forcing moderation — including the
--     restore-before-publish rule — through admin_moderate_question.

/* --- insert-only workflow tables: no client ever updates these directly ------ */

revoke update on public.company_requests from authenticated, anon;
revoke update on public.bug_reports from authenticated, anon;
revoke update on public.support_tickets from authenticated, anon;
revoke update on public.question_reports from authenticated, anon;

/* --- questions: keep user text/topic edits, block direct moderation writes ---- */

revoke update on public.questions from authenticated, anon;
grant update (question_text, topic) on public.questions to authenticated;

comment on table public.questions is
  'Users may edit only their own question_text/topic (column-scoped UPDATE grant). All moderation writes (moderation_status/status/moderated_*) go exclusively through admin_moderate_question (SECURITY DEFINER), which enforces the restore-before-publish transition rule. Direct client PATCH of moderation columns is not possible.';
