import { getAuditLog, type AuditEntry } from '../../../lib/adminApi'
import { formatDateTime, humanize, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { CopyId, Field } from '../components/adminUi'

const ACTIONS = ['admin_bootstrap', 'company_request_update', 'company_request_approve', 'campaign_ops_update', 'question_moderate', 'report_resolve', 'bug_update', 'support_ticket_update']
const ENTITIES = ['admin_membership', 'company_request', 'campaign', 'question', 'question_report', 'bug_report', 'support_ticket']

const columns: Column<AuditEntry>[] = [
  { header: 'When', render: e => <span title={formatDateTime(e.createdAt)}>{timeAgo(e.createdAt)}</span> },
  { header: 'Action', render: e => humanize(e.action) },
  { header: 'Entity', render: e => humanize(e.entityType) },
  { header: 'Reason', render: e => <span className="admin-clamp">{e.reason ?? '—'}</span> },
]

// Structured, redacted rendering of before/after — never a raw JSON dump by
// default. Any secret-like keys are masked in case a legacy record contains them.
const SECRET_KEYS = /(password|token|secret|key|authorization|cookie)/i
function StateView({ label, value }: { label: string; value: unknown }) {
  if (value == null) return <Field label={label}>—</Field>
  const obj = typeof value === 'object' ? (value as Record<string, unknown>) : { value }
  return (
    <div className="admin-field">
      <span className="admin-field-label">{label}</span>
      <dl className="admin-state">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="admin-state-row">
            <dt>{k}</dt>
            <dd>{SECRET_KEYS.test(k) ? '••• redacted •••' : typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function AuditLogPage() {
  return (
    <AdminListPage<AuditEntry>
      title="Audit log"
      description="Immutable record of administrative actions. Read-only and append-only — entries cannot be edited or deleted."
      filters={[
        { key: 'action', label: 'Action', options: ACTIONS.map(s => ({ value: s, label: humanize(s) })) },
        { key: 'entityType', label: 'Entity', options: ENTITIES.map(s => ({ value: s, label: humanize(s) })) },
      ]}
      columns={columns}
      gridTemplate="0.7fr 1.3fr 1.1fr 2fr"
      getRowKey={e => e.id}
      fetchPage={({ filters, offset, limit }) => getAuditLog({ action: filters.action || undefined, entityType: filters.entityType || undefined, offset, limit })}
      emptyTitle="No audit entries"
      emptyMessage="Administrative actions will be recorded here."
      detailTitle={e => humanize(e.action)}
      renderDetail={e => (
        <div className="admin-detail">
          <Field label="Action">{humanize(e.action)}</Field>
          <Field label="Entity">{humanize(e.entityType)}</Field>
          <Field label="When">{formatDateTime(e.createdAt)}</Field>
          <Field label="Administrator">Administrator</Field>
          <Field label="Reason">{e.reason ?? '—'}</Field>
          <Field label="Request reference">{e.requestRef ?? '—'}</Field>
          <StateView label="Before" value={e.beforeState} />
          <StateView label="After" value={e.afterState} />
          {e.entityId && (
            <Field label="Entity ID">
              <CopyId id={e.entityId} />
            </Field>
          )}
          <Field label="Entry ID">
            <CopyId id={e.id} />
          </Field>
        </div>
      )}
    />
  )
}
