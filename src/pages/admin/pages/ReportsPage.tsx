import { getReports, type AdminReport } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['pending', 'reviewing', 'dismissed', 'action_taken', 'escalated']
const REASONS = ['spam', 'harassment', 'abusive_content', 'personal_information', 'manipulation', 'misleading_claim', 'off_topic', 'duplicate', 'legal_concern', 'other']

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
      fetchPage={({ filters, offset, limit }) => getReports({ status: filters.status || undefined, reason: filters.reason || undefined, offset, limit })}
      emptyTitle="No reports"
      emptyMessage="Reported questions will appear here. Report details stay private to administrators."
      detailTitle={() => 'Report detail'}
      renderDetail={r => (
        <div className="admin-detail">
          <div className="admin-detail-chips">
            <Chip tone={statusTone(r.status)}>{humanize(r.status)}</Chip>
            <Chip tone="muted">{humanize(r.reason)}</Chip>
          </div>
          <Field label="Reported question">
            <p className="admin-longtext">{r.questionText ?? '—'}</p>
          </Field>
          <Field label="Company">{r.companyName ?? '—'}</Field>
          <Field label="Question moderation">{humanize(r.questionModerationStatus)}</Field>
          <Field label="Reporter">{r.reporterName ?? '—'}</Field>
          <Field label="Reason detail">{r.details ?? '—'}</Field>
          <Field label="Filed">{formatDateTime(r.createdAt)}</Field>
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
