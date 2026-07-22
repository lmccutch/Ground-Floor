import { getSupportTickets, recordSupportResponse, updateSupportTicket, type AdminTicket } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['new', 'open', 'waiting_on_user', 'in_progress', 'resolved', 'closed', 'spam']
const CATEGORIES = ['general', 'company_request', 'technical_support', 'bug', 'privacy', 'partnership', 'company_management', 'media', 'legal', 'other']
const PRIORITY_OPTIONS = ['urgent', 'high', 'normal', 'low'].map(p => ({ value: p, label: humanize(p) }))
const OPEN_TICKET = ['new', 'open', 'waiting_on_user', 'in_progress']

const str = (v: unknown) => (v == null || v === '' ? '—' : String(v))

const ticketActions: AdminAction<AdminTicket>[] = [
  { key: 'priority', label: 'Set priority', reason: { label: 'Priority', required: true, options: PRIORITY_OPTIONS }, run: (t, v) => updateSupportTicket({ id: t.id, priority: v, reason: `Priority set to ${v}` }) },
  { key: 'open', label: 'Mark open', available: t => t.status === 'new', run: t => updateSupportTicket({ id: t.id, status: 'open', reason: 'Opened' }) },
  { key: 'in_progress', label: 'Mark in progress', available: t => OPEN_TICKET.includes(t.status), run: t => updateSupportTicket({ id: t.id, status: 'in_progress', reason: 'In progress' }) },
  { key: 'response', label: 'Record response sent', available: t => OPEN_TICKET.includes(t.status), consequence: 'Stamps the response time and appends your summary to the internal notes. Sends no email itself — use “Email the sender” for that.', reversible: true, reason: { label: 'Response summary (optional)', required: false }, run: (t, summary) => recordSupportResponse({ id: t.id, summary }) },
  { key: 'waiting', label: 'Waiting on user', available: t => OPEN_TICKET.includes(t.status), reason: { label: 'What are we waiting for?', required: true }, run: (t, reason) => recordSupportResponse({ id: t.id, status: 'waiting_on_user', summary: reason }) },
  { key: 'resolve', label: 'Resolve', available: t => t.status !== 'resolved' && t.status !== 'closed', consequence: 'Marks the ticket resolved.', reversible: true, reason: { label: 'Resolution summary', required: true }, run: (t, reason) => updateSupportTicket({ id: t.id, status: 'resolved', adminNotes: reason, reason: 'Resolved' }) },
  { key: 'close', label: 'Close', tone: 'critical', available: t => t.status !== 'closed', consequence: 'Closes the ticket.', reversible: true, reason: { label: 'Final reason', required: true }, run: (t, reason) => updateSupportTicket({ id: t.id, status: 'closed', adminNotes: reason, reason: 'Closed' }) },
  { key: 'spam', label: 'Mark spam', tone: 'critical', available: t => t.status !== 'spam', consequence: 'Marks the ticket as spam.', reversible: true, reason: { label: 'Confirm — why is this spam?', required: true }, run: (t, reason) => updateSupportTicket({ id: t.id, status: 'spam', adminNotes: reason, reason: 'Marked spam' }) },
  { key: 'reopen', label: 'Reopen', available: t => ['resolved', 'closed', 'spam'].includes(t.status), run: t => updateSupportTicket({ id: t.id, status: 'open', reason: 'Reopened' }) },
  { key: 'note', label: 'Add / update note', reason: { label: 'Internal note', required: true }, run: (t, reason) => updateSupportTicket({ id: t.id, adminNotes: reason, reason: 'Updated internal note' }) },
]

function mailtoLink(t: AdminTicket): string | undefined {
  if (!t.senderEmail) return undefined
  const subject = `Re: [${t.ticketNumber}] ${str(t.subject) === '—' ? 'Open Floor support' : String(t.subject)}`
  return `mailto:${encodeURIComponent(t.senderEmail)}?subject=${encodeURIComponent(subject)}`
}

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
      renderDetail={(t, helpers) => (
        <div className="admin-detail">
          <ActionBar row={t} actions={ticketActions} onDone={() => { helpers.refresh(); helpers.close() }} />
          {mailtoLink(t) && (
            <a className="btn small secondary admin-mailto" href={mailtoLink(t)}>
              Email the sender
            </a>
          )}
          <div className="admin-detail-chips">
            <Chip tone={statusTone(t.status)}>{humanize(t.status)}</Chip>
            <Chip tone="muted">{humanize(t.category)}</Chip>
          </div>
          <Field label="Subject">{str(t.subject)}</Field>
          <Field label="Message">
            <p className="admin-longtext">{str(t.message)}</p>
          </Field>
          <Field label="Sender">{t.senderName ?? '—'}</Field>
          <Field label="Sender email">{t.senderEmail ?? '—'}</Field>
          <Field label="Assigned admin">{t.assignedAdminName ?? 'Unassigned'}</Field>
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
