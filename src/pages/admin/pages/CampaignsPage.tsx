import { Link } from 'react-router-dom'
import { getCampaigns, updateCampaignOps, type AdminCampaign } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { Chip, CopyId, Field } from '../components/adminUi'

const BANDS = [
  { value: 'near', label: 'Near threshold (80–99%)' },
  { value: 'at', label: 'Threshold reached' },
  { value: 'outreach', label: 'Outreach required' },
]

// Operational (internal) statuses only — this never touches the public campaign
// status. paused/closed are handled by dedicated actions that require a reason.
const OP_STATUS_OPTIONS = ['active', 'near_threshold', 'threshold_reached', 'outreach_required', 'outreach_started', 'management_engaged', 'scheduled', 'completed', 'stalled'].map(s => ({ value: s, label: humanize(s) }))

const campaignActions: AdminAction<AdminCampaign>[] = [
  { key: 'op_status', label: 'Set operational status', consequence: 'Changes the internal operational status only — the public campaign status is unaffected. Setting “outreach started” stamps the outreach date automatically.', reversible: true, reason: { label: 'Operational status', required: true, options: OP_STATUS_OPTIONS }, run: (c, v) => updateCampaignOps({ id: c.campaignId, operationalStatus: v, reason: `Operational status set to ${v}` }) },
  { key: 'contact', label: 'Set management contact', reason: { label: 'Management contact status', required: true }, run: (c, reason) => updateCampaignOps({ id: c.campaignId, managementContactStatus: reason, reason: 'Updated management contact status' }) },
  { key: 'risk', label: 'Set risk status', reason: { label: 'Risk status', required: true }, run: (c, reason) => updateCampaignOps({ id: c.campaignId, riskStatus: reason, reason: 'Updated risk status' }) },
  { key: 'threshold', label: 'Set supporter threshold', consequence: 'Changes the supporter threshold this campaign is measured against. Progress recalculates immediately.', reversible: true, reason: { label: 'New supporter threshold (whole number)', required: true }, run: (c, v) => { const n = Number((v ?? '').trim()); if (!Number.isInteger(n) || n <= 0) throw new Error('Enter a positive whole number.'); return updateCampaignOps({ id: c.campaignId, supporterThreshold: n, reason: `Supporter threshold set to ${n}` }) } },
  { key: 'note', label: 'Add / update note', reason: { label: 'Internal note', required: true }, run: (c, reason) => updateCampaignOps({ id: c.campaignId, internalNotes: reason, reason: 'Updated internal note' }) },
  { key: 'pause', label: 'Pause', available: c => c.operationalStatus !== 'paused', consequence: 'Pauses the campaign operationally.', reversible: true, reason: { label: 'Reason for pausing', required: true }, run: (c, reason) => updateCampaignOps({ id: c.campaignId, operationalStatus: 'paused', reason }) },
  { key: 'close', label: 'Close', tone: 'critical', available: c => c.operationalStatus !== 'closed', consequence: 'Closes the campaign operationally. The public campaign status is unaffected.', reversible: true, reason: { label: 'Closed reason', required: true }, run: (c, reason) => updateCampaignOps({ id: c.campaignId, operationalStatus: 'closed', closedReason: reason, reason: 'Closed' }) },
]

function Progress({ c }: { c: AdminCampaign }) {
  return (
    <span className="admin-progress" title={`${c.supporters} of ${c.supporterThreshold} supporters`}>
      <span className="admin-progress-bar" aria-hidden="true">
        <span className={`admin-progress-fill band-${c.band}`} style={{ width: `${Math.min(100, c.progressPct)}%` }} />
      </span>
      <span className="admin-progress-label">
        {c.supporters}/{c.supporterThreshold} · {c.progressPct}%
      </span>
    </span>
  )
}

const columns: Column<AdminCampaign>[] = [
  {
    header: 'Company',
    render: c => (
      <span>
        <b>{c.companyName}</b>
        {c.ticker && <span className="admin-sub"> · {c.ticker}</span>}
      </span>
    ),
  },
  { header: 'Progress', render: c => <Progress c={c} /> },
  { header: 'Operational', render: c => <Chip tone={statusTone(c.operationalStatus)}>{humanize(c.operationalStatus)}</Chip> },
  { header: 'Questions', render: c => c.questions },
  { header: 'Last activity', render: c => timeAgo(c.updatedAt) },
]

export function CampaignsPage() {
  return (
    <AdminListPage<AdminCampaign>
      title="Campaigns"
      description="Operational view of every campaign. Internal fields (notes, risk, outreach) are visible only here, never on the public site."
      searchPlaceholder="Company name or ticker"
      filters={[{ key: 'band', label: 'Attention', options: BANDS }]}
      columns={columns}
      gridTemplate="1.5fr 1.4fr 1fr 0.7fr 0.9fr"
      getRowKey={c => c.campaignId}
      fetchPage={({ search, filters, offset, limit }) =>
        getCampaigns({ search, band: filters.band || undefined, offset, limit }).then(rows => ({ rows, total: rows[0]?.totalCount ?? rows.length }))
      }
      emptyTitle="No campaigns yet"
      emptyMessage="Campaigns appear here once shareholders start them."
      detailTitle={c => c.companyName}
      renderDetail={(c, helpers) => (
        <div className="admin-detail">
          <ActionBar row={c} actions={campaignActions} onDone={() => { helpers.refresh(); helpers.close() }} />
          <div className="admin-detail-chips">
            <Chip tone={statusTone(c.operationalStatus)}>{humanize(c.operationalStatus)}</Chip>
            <Chip tone="muted">Public: {c.publicStatus}</Chip>
          </div>
          <Field label="Supporter progress">
            <Progress c={c} />
          </Field>
          <Field label="Threshold reached">{formatDateTime(c.thresholdReachedAt)}</Field>
          <Field label="Questions">{c.questions}</Field>
          <Field label="Reported questions">{c.reportedQuestions}</Field>
          <Field label="Assigned administrator">{c.assignedAdminName ?? 'Unassigned'}</Field>
          <Field label="Management contact status">{c.managementContactStatus ?? '—'}</Field>
          <Field label="Last outreach">{formatDateTime(c.lastOutreachAt)}</Field>
          <Field label="Next follow-up">{formatDateTime(c.nextFollowUpAt)}</Field>
          <Field label="Risk status">{c.riskStatus ?? '—'}</Field>
          <Field label="Internal notes">{c.internalNotes ?? '—'}</Field>
          <Field label="Closed reason">{c.closedReason ?? '—'}</Field>
          {c.ticker && (
            <Field label="Public page">
              <Link to={companyPath(c.ticker)}>Open public campaign</Link>
            </Field>
          )}
          <Field label="Campaign ID">
            <CopyId id={c.campaignId} />
          </Field>
        </div>
      )}
    />
  )
}
