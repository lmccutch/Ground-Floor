import { Link } from 'react-router-dom'
import { dismissNotification, getNotifications, markNotificationRead, type AdminNotification } from '../../../lib/adminApi'
import { formatDateTime, humanize, timeAgo, type Tone } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { Chip, CopyId, Field } from '../components/adminUi'

// Read-only phase never mutated these; opening a notification still never marks it
// read. All state changes are explicit. Mark read/unread/restore are low-risk and
// run immediately; dismissing a high/critical notification asks for confirmation.
const notificationActions: AdminAction<AdminNotification>[] = [
  { key: 'read', label: 'Mark read', available: n => !n.readAt, run: n => markNotificationRead({ id: n.id, read: true }) },
  { key: 'unread', label: 'Mark unread', available: n => !!n.readAt, run: n => markNotificationRead({ id: n.id, read: false }) },
  {
    key: 'dismiss',
    label: 'Dismiss',
    available: n => !n.dismissedAt,
    consequence: n => (n.severity === 'high' || n.severity === 'critical' ? 'This high-priority notification will be hidden from the unread list. It stays in the audit trail and the underlying record is unchanged.' : undefined),
    run: n => dismissNotification({ id: n.id, dismiss: true }),
  },
  { key: 'restore', label: 'Restore', available: n => !!n.dismissedAt, run: n => dismissNotification({ id: n.id, dismiss: false }) },
]

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']
const TYPES = ['company_request_submitted', 'campaign_near_threshold', 'campaign_threshold_reached', 'question_reported', 'bug_submitted', 'support_ticket_created', 'email_failed', 'webhook_failed', 'security_alert']

function severityTone(s: string): Tone {
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'low' || s === 'info') return 'muted'
  return 'normal'
}

const columns: Column<AdminNotification>[] = [
  { header: 'Severity', render: n => <Chip tone={severityTone(n.severity)}>{humanize(n.severity)}</Chip> },
  { header: 'Title', render: n => <span className={n.readAt ? 'admin-clamp' : 'admin-clamp admin-unread'}>{n.title}</span> },
  { header: 'Type', render: n => humanize(n.type) },
  { header: 'State', render: n => (n.dismissedAt ? 'Dismissed' : n.readAt ? 'Read' : 'Unread') },
  { header: 'Age', render: n => timeAgo(n.createdAt) },
]

export function NotificationsPage() {
  return (
    <AdminListPage<AdminNotification>
      title="Notifications"
      description="Admin notifications. This page is read-only — opening it never marks anything read or dismissed."
      filters={[
        { key: 'state', label: 'State', options: [{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }, { value: 'dismissed', label: 'Dismissed' }] },
        { key: 'severity', label: 'Severity', options: SEVERITIES.map(s => ({ value: s, label: humanize(s) })) },
        { key: 'type', label: 'Type', options: TYPES.map(s => ({ value: s, label: humanize(s) })) },
      ]}
      columns={columns}
      gridTemplate="0.9fr 2fr 1.2fr 0.8fr 0.6fr"
      getRowKey={n => n.id}
      fetchPage={({ filters, offset, limit }) =>
        getNotifications({ state: (filters.state as 'unread' | 'read' | 'dismissed') || undefined, severity: filters.severity || undefined, type: filters.type || undefined, offset, limit })
      }
      emptyTitle="No notifications"
      emptyMessage="Admin notifications appear here as events occur."
      detailTitle={n => n.title}
      renderDetail={(n, helpers) => (
        <div className="admin-detail">
          <ActionBar row={n} actions={notificationActions} onDone={() => { helpers.refresh(); helpers.close() }} />
          <div className="admin-detail-chips">
            <Chip tone={severityTone(n.severity)}>{humanize(n.severity)}</Chip>
            <Chip tone="muted">{humanize(n.type)}</Chip>
          </div>
          <Field label="Message">
            <p className="admin-longtext">{n.message}</p>
          </Field>
          <Field label="State">{n.dismissedAt ? 'Dismissed' : n.readAt ? 'Read' : 'Unread'}</Field>
          <Field label="Related entity">{n.entityType ? humanize(n.entityType) : '—'}</Field>
          <Field label="Created">{formatDateTime(n.createdAt)}</Field>
          {n.actionPath && (
            <Field label="Destination">
              <Link to={n.actionPath}>{n.actionPath}</Link>
            </Field>
          )}
          <Field label="Notification ID">
            <CopyId id={n.id} />
          </Field>
        </div>
      )}
    />
  )
}
