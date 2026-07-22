import { getBugs, type AdminBug } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo, type Tone } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const STATUSES = ['new', 'triaged', 'confirmed', 'in_progress', 'fixed', 'deployed', 'cannot_reproduce', 'duplicate', 'closed']
const SEVERITIES = ['critical', 'high', 'medium', 'low']

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
      renderDetail={b => (
        <div className="admin-detail">
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
