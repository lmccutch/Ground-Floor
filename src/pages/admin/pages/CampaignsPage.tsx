import { Link } from 'react-router-dom'
import { getCampaigns, type AdminCampaign } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const BANDS = [
  { value: 'near', label: 'Near threshold (80–99%)' },
  { value: 'at', label: 'Threshold reached' },
  { value: 'outreach', label: 'Outreach required' },
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
      renderDetail={c => (
        <div className="admin-detail">
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
