import { approveCompanyRequest, getCompanyRequests, updateCompanyRequest, type AdminCompanyRequest } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { Link } from 'react-router-dom'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'duplicate', 'needs_information']
const OPEN = ['pending', 'under_review', 'needs_information']

const requestActions: AdminAction<AdminCompanyRequest>[] = [
  {
    key: 'review',
    label: 'Begin review',
    available: r => r.status === 'pending' || r.status === 'needs_information',
    run: r => updateCompanyRequest({ id: r.id, status: 'under_review', reason: 'Began review' }),
  },
  {
    key: 'approve',
    label: 'Approve',
    tone: 'normal',
    available: r => OPEN.includes(r.status),
    consequence: 'Creates or links a company and marks the request approved. Repeating this is safe — it never creates a duplicate company.',
    reversible: false,
    emailNote: 'No email is sent to the requester in this phase.',
    reason: { label: 'Approval note (optional)', required: false },
    run: (r, reason) => approveCompanyRequest({ id: r.id, reason }).then(() => undefined),
  },
  {
    key: 'reject',
    label: 'Reject',
    tone: 'critical',
    available: r => OPEN.includes(r.status),
    consequence: 'Marks the request rejected. The rejection reason is stored internally.',
    reversible: true,
    reason: { label: 'Rejection reason', required: true, placeholder: 'Why is this request rejected?' },
    run: (r, reason) => updateCompanyRequest({ id: r.id, status: 'rejected', rejectionReason: reason, reason }),
  },
  {
    key: 'duplicate',
    label: 'Mark duplicate',
    available: r => OPEN.includes(r.status),
    reason: { label: 'Note (optional)', required: false, placeholder: 'Which existing company/request is this a duplicate of?' },
    run: (r, reason) => updateCompanyRequest({ id: r.id, status: 'duplicate', adminNotes: reason, reason: 'Marked duplicate' }),
  },
  {
    key: 'needs_info',
    label: 'Request more info',
    available: r => r.status === 'pending' || r.status === 'under_review',
    reason: { label: 'What information is needed? (optional)', required: false },
    run: (r, reason) => updateCompanyRequest({ id: r.id, status: 'needs_information', adminNotes: reason, reason: 'Requested more information' }),
  },
  {
    key: 'reopen',
    label: 'Return to pending',
    available: r => r.status === 'under_review' || r.status === 'needs_information',
    run: r => updateCompanyRequest({ id: r.id, status: 'pending', reason: 'Returned to pending' }),
  },
  {
    key: 'note',
    label: 'Add / update note',
    reason: { label: 'Internal note (not visible to the requester)', required: true },
    run: (r, reason) => updateCompanyRequest({ id: r.id, adminNotes: reason, reason: 'Updated internal note' }),
  },
]

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
      renderDetail={(r, helpers) => (
        <div className="admin-detail">
          <ActionBar row={r} actions={requestActions} onDone={() => { helpers.refresh(); helpers.close() }} />
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
