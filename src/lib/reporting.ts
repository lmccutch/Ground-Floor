// Single source of truth for question-report categories, shared by the report
// modal, the Moderation Policy page, and tests. Stored as plain text in
// reports.reason (no enum constraint), so adding a category needs no migration.

export const REPORT_REASONS = [
  'Spam or promotion',
  'Abusive or harassing',
  'Manipulation or coordinated abuse',
  'Duplicate question',
  'Misinformation or unsupported allegation',
  'Personal information',
  'Confidential or material non-public information',
  'Other',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]
