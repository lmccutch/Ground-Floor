import { getBugs, updateBug, type AdminBug } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo, type Tone } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['new', 'triaged', 'confirmed', 'in_progress', 'fixed', 'deployed', 'cannot_reproduce', 'duplicate', 'closed']
const SEVERITIES = ['critical', 'high', 'medium', 'low']
const SEVERITY_OPTIONS = SEVERITIES.map(s => ({ value: s, label: humanize(s) }))
const OPEN_BUG = ['new', 'triaged', 'confirmed', 'in_progress']

const bugActions: AdminAction<AdminBug>[] = [
  { key: 'severity', label: 'Set severity', reason: { label: 'Severity', required: true, options: SEVERITY_OPTIONS }, run: (b, v) => updateBug({ id: b.id, severity: v, reason: `Severity set to ${v}` }) },
  { key: 'triaged', label: 'Mark triaged', available: b => b.status === 'new', run: b => updateBug({ id: b.id, status: 'triaged', reason: 'Triaged' }) },
  { key: 'confirmed', label: 'Mark confirmed', available: b => b.status === 'new' || b.status === 'triaged', reason: { label: 'Confirmation note (optional)', required: false }, run: (b, reason) => updateBug({ id: b.id, status: 'confirmed', adminNotes: reason, reason: 'Confirmed' }) },
  { key: 'in_progress', label: 'Mark in progress', available: b => b.status === 'triaged' || b.status === 'confirmed', run: b => updateBug({ id: b.id, status: 'in_progress', reason: 'In progress' }) },
  { key: 'fixed', label: 'Mark fixed', available: b => b.status === 'confirmed' || b.status === 'in_progress', consequence: 'Records the bug as fixed and stamps a resolved time.', reversible: true, reason: { label: 'Fix note or commit', required: true }, run: (b, reason) => updateBug({ id: b.id, status: 'fixed', adminNotes: reason, reason: 'Fixed' }) },
  { key: 'deployed', label: 'Mark deployed', available: b => b.status === 'fixed', reason: { label: 'Deployment reference', required: true }, run: (b, reason) => updateBug({ id: b.id, status: 'deployed', adminNotes: reason, reason: 'Deployed' }) },
  { key: 'cannot_reproduce', label: 'Cannot reproduce', available: b => OPEN_BUG.includes(b.status), reason: { label: 'What was attempted', required: true }, run: (b, reason) => updateBug({ id: b.id, status: 'cannot_reproduce', adminNotes: reason, reason: 'Cannot reproduce' }) },
  { key: 'duplicate', label: 'Mark duplicate', available: b => OPEN_BUG.includes(b.status), reason: { label: 'Linked duplicate bug', required: true }, run: (b, reason) => updateBug({ id: b.id, status: 'duplicate', adminNotes: reason, reason: 'Duplicate' }) },
  { key: 'close', label: 'Close', tone: 'critical', available: b => b.status !== 'closed', consequence: 'Closes the bug report.', reversible: true, reason: { label: 'Resolution reason', required: true }, run: (b, reason) => updateBug({ id: b.id, status: 'closed', adminNotes: reason, reason: 'Closed' }) },
  { key: 'reopen', label: 'Reopen', available: b => ['fixed', 'deployed', 'cannot_reproduce', 'duplicate', 'closed'].includes(b.status), run: b => updateBug({ id: b.id, status: 'triaged', reason: 'Reopened' }) },
  { key: 'note', label: 'Add / update note', reason: { label: 'Internal note', required: true }, run: (b, reason) => updateBug({ id: b.id, adminNotes: reason, reason: 'Updated internal note' }) },
]

function severityTone(s?: string): Tone {
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'low') return 'low'
  return 'normal'
}

const str = (v: unknown) => (v == null || v === '' ? '—' : String(v))

const columns: Column<AdminBug>[] = [
  { header: 'Description', render: b => <span className="admin-clamp">{b.description}</span> },
  { header: 'Severity', render: b => (b.severity ? <Chip tone={severityTone(b.severity)}>{humanize(b.severity)}</Chip> : '—') },
  { header: 'Status', render: b => <Chip tone={statusTone(b.status)}>{humanize(b.status)}</Chip> },
  { header: 'Reporter', render: b => b.submitterName ?? '—' },
  { header: 'Age', render: b => timeAgo(b.createdAt) },
]

export function BugsPage() {
  return (
    <AdminListPage<AdminBug>
      title="Bug reports"
      description="Reported bugs. There is no public bug-report form connected yet, so this list stays empty until one is added."
      searchPlaceholder="Description"
      filters={[
        { key: 'status', label: 'Status', options: STATUSES.map(s => ({ value: s, label: humanize(s) })) },
        { key: 'severity', label: 'Severity', options: SEVERITIES.map(s => ({ value: s, label: humanize(s) })) },
      ]}
      columns={columns}
      gridTemplate="2fr 0.9fr 1fr 1fr 0.6fr"
      getRowKey={b => b.id}
      fetchPage={({ search, filters, offset, limit }) => getBugs({ search, status: filters.status || undefined, severity: filters.severity || undefined, offset, limit })}
      emptyTitle="No bug reports"
      emptyMessage="No public bug-report form is connected yet, so nothing is recorded here."
      detailTitle={() => 'Bug report'}
      renderDetail={(b, helpers) => (
        <div className="admin-detail">
          <ActionBar row={b} actions={bugActions} onDone={() => { helpers.refresh(); helpers.close() }} />
          <div className="admin-detail-chips">
            <Chip tone={statusTone(b.status)}>{humanize(b.status)}</Chip>
            {b.severity && <Chip tone={severityTone(b.severity)}>{humanize(b.severity)}</Chip>}
          </div>
          <Field label="Description">
            <p className="admin-longtext">{b.description}</p>
          </Field>
          <Field label="Steps to reproduce">
            <p className="admin-longtext">{str(b.steps_to_reproduce)}</p>
          </Field>
          <Field label="Expected result">{str(b.expected_result)}</Field>
          <Field label="Actual result">{str(b.actual_result)}</Field>
          <Field label="Page URL">{str(b.page_url)}</Field>
          <Field label="Environment">
            {[b.browser, b.operating_system, b.device_type, b.screen_size].filter(Boolean).map(String).join(' · ') || '—'}
          </Field>
          <Field label="App version">{str(b.app_version)}</Field>
          <Field label="Reporter">{b.submitterName ?? '—'}</Field>
          <Field label="Assigned admin">{b.assignedAdminName ?? 'Unassigned'}</Field>
          <Field label="Internal notes">{str(b.admin_notes)}</Field>
          <Field label="Linked issue">{str(b.linked_issue_url)}</Field>
          <Field label="Fixed commit">{str(b.fixed_commit)}</Field>
          <Field label="Reported">{formatDateTime(b.createdAt)}</Field>
          <Field label="Resolved">{formatDateTime(b.resolved_at as string | undefined)}</Field>
          <Field label="Bug ID">
            <CopyId id={b.id} />
          </Field>
        </div>
      )}
    />
  )
}
