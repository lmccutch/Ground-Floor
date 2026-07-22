import { Link } from 'react-router-dom'
import { getNotifications, type AdminNotification } from '../../../lib/adminApi'
import { formatDateTime, humanize, timeAgo, type Tone } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

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
      renderDetail={n => (
        <div className="admin-detail">
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
