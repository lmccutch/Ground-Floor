import { getSupportTickets, type AdminTicket } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['new', 'open', 'waiting_on_user', 'in_progress', 'resolved', 'closed', 'spam']
const CATEGORIES = ['general', 'company_request', 'technical_support', 'bug', 'privacy', 'partnership', 'company_management', 'media', 'legal', 'other']

const str = (v: unknown) => (v == null || v === '' ? '—' : String(v))

const columns: Column<AdminTicket>[] = [
  { header: 'Ticket', render: t => <span className="admin-mono">{t.ticketNumber}</span> },
  { header: 'Subject', render: t => <span className="admin-clamp">{str(t.subject)}</span> },
  { header: 'Category', render: t => humanize(t.category) },
  { header: 'Status', render: t => <Chip tone={statusTone(t.status)}>{humanize(t.status)}</Chip> },
  { header: 'Age', render: t => timeAgo(t.createdAt) },
]

export function SupportPage() {
  return (
    <AdminListPage<AdminTicket>
      title="Support"
      description="Support and contact submissions. Public contact forms are not yet wired to support tickets, so this stays empty until they are."
      searchPlaceholder="Subject"
      filters={[
        { key: 'status', label: 'Status', options: STATUSES.map(s => ({ value: s, label: humanize(s) })) },
        { key: 'category', label: 'Category', options: CATEGORIES.map(s => ({ value: s, label: humanize(s) })) },
      ]}
      columns={columns}
      gridTemplate="0.9fr 1.9fr 1fr 1fr 0.6fr"
      getRowKey={t => t.id}
      fetchPage={({ search, filters, offset, limit }) => getSupportTickets({ search, status: filters.status || undefined, category: filters.category || undefined, offset, limit })}
      emptyTitle="No support tickets"
      emptyMessage="Contact forms are not yet connected to support tickets, so nothing is recorded here."
      detailTitle={t => `Ticket ${t.ticketNumber}`}
      renderDetail={t => (
        <div className="admin-detail">
          <div className="admin-detail-chips">
            <Chip tone={statusTone(t.status)}>{humanize(t.status)}</Chip>
            <Chip tone="muted">{humanize(t.category)}</Chip>
          </div>
          <Field label="Subject">{str(t.subject)}</Field>
          <Field label="Message">
            <p className="admin-longtext">{str(t.message)}</p>
          </Field>
          <Field label="Sender">{t.senderName ?? '—'}</Field>
          <Field label="Priority">{humanize(str(t.priority))}</Field>
          <Field label="Internal notes">{str(t.admin_notes)}</Field>
          <Field label="Last response">{formatDateTime(t.last_response_at as string | undefined)}</Field>
          <Field label="Created">{formatDateTime(t.createdAt)}</Field>
          <Field label="Resolved">{formatDateTime(t.resolved_at as string | undefined)}</Field>
          <Field label="Ticket ID">
            <CopyId id={t.id} />
          </Field>
        </div>
      )}
    />
  )
}
