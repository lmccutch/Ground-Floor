import { getCompanyRequests, type AdminCompanyRequest } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { Link } from 'react-router-dom'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'duplicate', 'needs_information']

const columns: Column<AdminCompanyRequest>[] = [
  {
    header: 'Company',
    render: r => (
      <span>
        <b>{r.companyName}</b>
        {r.ticker && <span className="admin-sub"> · {r.ticker}</span>}
      </span>
    ),
  },
  { header: 'Status', render: r => <Chip tone={statusTone(r.status)}>{humanize(r.status)}</Chip> },
  { header: 'Priority', render: r => humanize(r.priority) },
  { header: 'Requester', render: r => r.requesterName ?? '—' },
  { header: 'Age', render: r => timeAgo(r.createdAt) },
]

export function CompanyRequestsPage() {
  return (
    <AdminListPage<AdminCompanyRequest>
      title="Company requests"
      description="Companies shareholders have asked Open Floor to add. Read-only — review actions arrive in the next phase."
      searchPlaceholder="Company name or ticker"
      filters={[{ key: 'status', label: 'Status', options: STATUSES.map(s => ({ value: s, label: humanize(s) })) }]}
      columns={columns}
      gridTemplate="1.7fr 1fr 0.8fr 1.1fr 0.6fr"
      getRowKey={r => r.id}
      fetchPage={({ search, filters, offset, limit }) =>
        getCompanyRequests({ search, status: filters.status || undefined, offset, limit }).then(rows => ({ rows, total: rows[0]?.totalCount ?? rows.length }))
      }
      emptyTitle="No company requests yet"
      emptyMessage="New requests will appear here as shareholders submit them."
      detailTitle={r => r.companyName}
      renderDetail={r => (
        <div className="admin-detail">
          <div className="admin-detail-chips">
            <Chip tone={statusTone(r.status)}>{humanize(r.status)}</Chip>
            <Chip tone="muted">{humanize(r.priority)} priority</Chip>
          </div>
          <Field label="Ticker">{r.ticker ?? '—'}</Field>
          <Field label="Requested by">{r.requesterName ?? '—'}</Field>
          <Field label="Requested">{formatDateTime(r.createdAt)}</Field>
          <Field label="Reviewer">{r.reviewerName ?? 'Not reviewed'}</Field>
          <Field label="Reviewed">{formatDateTime(r.reviewedAt)}</Field>
          <Field label="Rejection reason">{r.rejectionReason ?? '—'}</Field>
          <Field label="Admin notes">{r.adminNotes ?? '—'}</Field>
          {r.createdCompanyId && r.ticker && (
            <Field label="Created company">
              <Link to={companyPath(r.ticker)}>Open company page</Link>
            </Field>
          )}
          <Field label="Request ID">
            <CopyId id={r.id} />
          </Field>
        </div>
      )}
    />
  )
}
