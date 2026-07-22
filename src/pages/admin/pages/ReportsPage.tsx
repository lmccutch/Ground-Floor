import { getReports, resolveReport, type AdminReport } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { MODERATION_REASONS } from './moderationReasons'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['pending', 'reviewing', 'dismissed', 'action_taken', 'escalated']
const REASONS = ['spam', 'harassment', 'abusive_content', 'personal_information', 'manipulation', 'misleading_claim', 'off_topic', 'duplicate', 'legal_concern', 'other']
const OPEN_REPORT = ['pending', 'reviewing', 'escalated']

const ESCALATION_REASONS = [
  { value: 'legal_concern', label: 'Legal concern' },
  { value: 'privacy_concern', label: 'Privacy concern' },
  { value: 'security_concern', label: 'Security concern' },
  { value: 'management_review', label: 'Management review' },
  { value: 'other', label: 'Other (explain)' },
]

// Resolving a report affects only THIS report — unrelated reports against the same
// question keep their own state. hide/remove coordinate the question moderation
// atomically inside the RPC. A report count is never treated as proof of guilt.
const reportActions: AdminAction<AdminReport>[] = [
  {
    key: 'dismiss',
    label: 'Dismiss report',
    available: r => OPEN_REPORT.includes(r.status),
    consequence: 'Closes this report as not actionable. The question is left unchanged.',
    reversible: true,
    reason: { label: 'Resolution reason', required: true },
    run: (r, reason) => resolveReport({ id: r.id, action: 'dismiss', resolution: reason, reason }),
  },
  {
    key: 'confirm',
    label: 'Confirm (leave published)',
    available: r => OPEN_REPORT.includes(r.status),
    consequence: 'Marks the report resolved with action taken, without changing the question’s visibility.',
    reversible: true,
    reason: { label: 'Resolution note (optional)', required: false },
    run: (r, reason) => resolveReport({ id: r.id, action: 'confirm', resolution: reason, reason }),
  },
  {
    key: 'hide_question',
    label: 'Resolve + hide question',
    available: r => OPEN_REPORT.includes(r.status),
    consequence: 'Hides the reported question from public view and resolves this report — atomically.',
    reversible: true,
    reason: { label: 'Reason', required: true, options: MODERATION_REASONS, requireTextFor: 'other' },
    run: (r, reason) => resolveReport({ id: r.id, action: 'hide_question', reason }),
  },
  {
    key: 'remove_question',
    label: 'Resolve + remove question',
    tone: 'critical',
    available: r => OPEN_REPORT.includes(r.status),
    consequence: 'Removes the reported question from public view (content retained) and resolves this report.',
    reversible: true,
    reason: { label: 'Reason', required: true, options: MODERATION_REASONS, requireTextFor: 'other' },
    run: (r, reason) => resolveReport({ id: r.id, action: 'remove_question', reason }),
  },
  {
    key: 'escalate',
    label: 'Escalate',
    available: r => r.status === 'pending' || r.status === 'reviewing',
    consequence: 'Flags the report for further review. No automated external workflow is triggered.',
    reversible: true,
    reason: { label: 'Escalation reason', required: true, options: ESCALATION_REASONS, requireTextFor: 'other' },
    run: (r, reason) => resolveReport({ id: r.id, action: 'escalate', resolution: reason, reason }),
  },
]

const columns: Column<AdminReport>[] = [
  { header: 'Reported question', render: r => <span className="admin-clamp">{r.questionText ?? '—'}</span> },
  { header: 'Company', render: r => (r.companyName ? `${r.companyName}${r.ticker ? ` · ${r.ticker}` : ''}` : '—') },
  { header: 'Reason', render: r => humanize(r.reason) },
  { header: 'Status', render: r => <Chip tone={statusTone(r.status)}>{humanize(r.status)}</Chip> },
  { header: 'Age', render: r => timeAgo(r.createdAt) },
]

export function ReportsPage() {
  return (
    <AdminListPage<AdminReport>
      title="Reports"
      description="Content reports filed against questions. A report never hides a question on its own — resolution actions arrive in the next phase."
      searchPlaceholder="Reported content"
      filters={[
        { key: 'status', label: 'Status', options: STATUSES.map(s => ({ value: s, label: humanize(s) })) },
        { key: 'reason', label: 'Reason', options: REASONS.map(s => ({ value: s, label: humanize(s) })) },
      ]}
      columns={columns}
      gridTemplate="2fr 1.1fr 1.1fr 1fr 0.6fr"
      getRowKey={r => r.id}
      fetchPage={({ search, filters, offset, limit }) => getReports({ search, status: filters.status || undefined, reason: filters.reason || undefined, offset, limit })}
      emptyTitle="No reports"
      emptyMessage="Reported questions will appear here. Report details stay private to administrators."
      detailTitle={() => 'Report detail'}
      renderDetail={(r, helpers) => (
        <div className="admin-detail">
          <ActionBar row={r} actions={reportActions} onDone={() => { helpers.refresh(); helpers.close() }} />
          <div className="admin-detail-chips">
            <Chip tone={statusTone(r.status)}>{humanize(r.status)}</Chip>
            <Chip tone="muted">{humanize(r.reason)}</Chip>
          </div>
          <Field label="Reported question">
            <p className="admin-longtext">{r.questionText ?? '—'}</p>
          </Field>
          <Field label="Company">{r.companyName ?? '—'}</Field>
          <Field label="Question moderation">{humanize(r.questionModerationStatus)}</Field>
          <Field label="Question author">{r.questionAuthorName ?? '—'}</Field>
          <Field label="Reports against this question">{r.reportsAgainstQuestion}</Field>
          <Field label="Reporter">{r.reporterName ?? '—'}</Field>
          <Field label="Reason detail">{r.details ?? '—'}</Field>
          <Field label="Filed">{formatDateTime(r.createdAt)}</Field>
          <Field label="Reviewed by">{r.reviewedByName ?? '—'}</Field>
          <Field label="Reviewed">{formatDateTime(r.reviewedAt)}</Field>
          <Field label="Resolution">{r.resolution ?? '—'}</Field>
          <Field label="Report ID">
            <CopyId id={r.id} />
          </Field>
        </div>
      )}
    />
  )
}
