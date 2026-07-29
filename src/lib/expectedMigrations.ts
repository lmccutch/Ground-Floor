// The migration versions this build of the frontend expects the database to have
// applied. /admin/system compares this list against admin_applied_migrations()
// to detect drift in either direction:
//   * expected but not applied  -> the database is BEHIND this build (critical)
//   * applied but not expected  -> the database is AHEAD of this build (warning)
//
// This file is kept honest by src/lib/expectedMigrations.test.ts, which reads
// supabase/migrations/ from disk and fails if the two ever disagree. It must
// therefore be updated in the same commit as any new migration — which is exactly
// the coupling that makes the drift check meaningful.
//
// Versions are the Supabase CLI timestamp prefix (the part before the first
// underscore); the descriptive suffix is kept here for readability only.

export const EXPECTED_MIGRATIONS = [
  '202607100001_grround_floor_mvp',
  '202607110001_company_universe_core',
  '202607130001_fix_start_campaign_security',
  '202607130002_fix_company_requests_select_policy',
  '202607140001_core_experience',
  '202607150001_retail_popularity',
  '202607160001_company_requests_simplify',
  '202607210001_admin_authorization',
  '202607210002_profiles_username',
  '202607210003_operational_workflows',
  '202607210004_admin_actions',
  '202607210005_login_rate_limit',
  '202607210006_internal_column_privacy',
  '202607220001_username_reclaim_idempotent',
  '202607220002_admin_read_models',
  '202607220003_admin_moderation_read_models',
  '202607220004_admin_operations',
  '202607220005_transition_enforcement',
  '202607220006_transition_write_paths',
  '202607230001_public_intake',
  '202607230002_email_events',
  '202607280001_email_event_state_progression',
  '202607280002_admin_communications',
  '202607280003_bug_attachments',
  '202607280004_system_health',
] as const

/** Just the timestamp prefixes — what schema_migrations.version actually stores. */
export const EXPECTED_MIGRATION_VERSIONS: readonly string[] = EXPECTED_MIGRATIONS.map(m => m.split('_')[0])
