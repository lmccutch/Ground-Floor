import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCampaigns, getOverviewCounts, getRecentActivity, getWorkQueue, type AdminCampaign, type WorkItem } from '../../../lib/adminApi'
import { humanize, priorityRank, priorityTone, timeAgo } from '../../../lib/adminFormat'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { AdminError, AdminPageHeader, Chip, Empty, Loading, StatCard } from '../components/adminUi'

const SECTION: Record<string, string> = {
  company_request: '/admin/company-requests',
  campaign: '/admin/campaigns',
  question_report: '/admin/reports',
  bug_report: '/admin/bugs',
  support_ticket: '/admin/support',
  question: '/admin/questions',
}

/* ------------------------------ attention cards ---------------------------- */

function AttentionCards() {
  const counts = useAdminQuery(() => getOverviewCounts(), [])
  if (counts.error) return <AdminError onRetry={counts.reload} message="Attention summary is unavailable right now." />
  if (counts.loading && !counts.data) return <Loading label="Loading summary…" />
  const c = counts.data
  if (!c) return null
  const cards: { label: string; value: number; to: string; tone?: 'critical' | 'high' | 'normal' }[] = [
    { label: 'Open work items', value: c.openWorkItems, to: '/admin/queue' },
    { label: 'Critical / high priority', value: c.criticalHigh, to: '/admin/queue?priority=critical', tone: c.criticalHigh > 0 ? 'critical' : 'normal' },
    { label: 'Pending company requests', value: c.pendingCompanyRequests, to: '/admin/company-requests?status=pending' },
    { label: 'Campaigns near threshold', value: c.campaignsNearThreshold, to: '/admin/campaigns?band=near' },
    { label: 'Campaigns at threshold', value: c.campaignsAtThreshold, to: '/admin/campaigns?band=at' },
    { label: 'Campaigns needing outreach', value: c.campaignsOutreachRequired, to: '/admin/campaigns?band=outreach' },
    { label: 'Questions pending review', value: c.questionsPendingReview, to: '/admin/questions?moderationStatus=pending_review' },
    { label: 'Open question reports', value: c.openQuestionReports, to: '/admin/reports', tone: c.openQuestionReports > 0 ? 'high' : 'normal' },
    { label: 'Open bug reports', value: c.openBugReports, to: '/admin/bugs' },
    { label: 'New support tickets', value: c.newSupportTickets, to: '/admin/support' },
    { label: 'Unread notifications', value: c.unreadNotifications, to: '/admin/notifications?state=unread' },
  ]
  return (
    <div className="admin-stat-grid">
      {cards.map(card => (
        <StatCard key={card.label} label={card.label} value={card.value} to={card.to} tone={card.tone} />
      ))}
    </div>
  )
}

/* ---------------------------- priority work queue -------------------------- */

function QueuePreview() {
  const query = useAdminQuery(() => getWorkQueue(), [])
  const top = useMemo(() => {
    const rows = query.data ?? []
    return [...rows]
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || +new Date(a.createdAt) - +new Date(b.createdAt))
      .slice(0, 8)
  }, [query.data])

  return (
    <section className="admin-panel" aria-labelledby="queue-preview-heading">
      <div className="admin-panel-head">
        <h2 id="queue-preview-heading">Priority work queue</h2>
        <Link className="admin-link" to="/admin/queue">
          View all
        </Link>
      </div>
      {query.error ? (
        <AdminError onRetry={query.reload} />
      ) : query.loading && !query.data ? (
        <Loading />
      ) : top.length === 0 ? (
        <Empty title="The queue is clear" message="Nothing needs attention right now." />
      ) : (
        <ul className="admin-queue-list">
          {top.map((i: WorkItem) => {
            const to = SECTION[i.itemType]
            const row = (
              <>
                <Chip tone={priorityTone(i.priority)}>{humanize(i.priority)}</Chip>
                <span className="admin-queue-body">
                  <span className="admin-queue-title">{i.title}</span>
                  <span className="admin-queue-reason">{i.reason}</span>
                </span>
                <span className="admin-queue-age">{timeAgo(i.createdAt)}</span>
              </>
            )
            return (
              <li key={`${i.itemType}:${i.itemId}`}>
                {to ? (
                  <Link className="admin-queue-item is-link" to={to}>
                    {row}
                  </Link>
                ) : (
                  <span className="admin-queue-item">{row}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* --------------------------- campaign threshold panel ---------------------- */

const BUCKETS: { key: string; label: string; match: (c: AdminCampaign) => boolean }[] = [
  { key: 'b80', label: '80–89% of threshold', match: c => c.band === 'near' && c.progressPct >= 80 && c.progressPct < 90 },
  { key: 'b90', label: '90–99% of threshold', match: c => c.band === 'near' && c.progressPct >= 90 && c.progressPct < 100 },
  { key: 'at', label: 'Threshold reached', match: c => c.band === 'at' },
  { key: 'outreach', label: 'Outreach required', match: c => c.band === 'outreach' },
]

function CampaignRow({ c }: { c: AdminCampaign }) {
  return (
    <li className="admin-threshold-row">
      <Link className="admin-threshold-name" to="/admin/campaigns">
        <b>{c.companyName}</b>
        {c.ticker && <span className="admin-sub"> · {c.ticker}</span>}
      </Link>
      <span className="admin-progress" title={`${c.supporters} of ${c.supporterThreshold} supporters`}>
        <span className="admin-progress-bar" aria-hidden="true">
          <span className={`admin-progress-fill band-${c.band}`} style={{ width: `${Math.min(100, c.progressPct)}%` }} />
        </span>
        <span className="admin-progress-label">
          {c.supporters}/{c.supporterThreshold} · {c.progressPct}%
        </span>
      </span>
      <span className="admin-queue-age">{timeAgo(c.updatedAt)}</span>
    </li>
  )
}

function ThresholdPanel() {
  const query = useAdminQuery(() => getCampaigns({ limit: 100 }), [])
  const buckets = useMemo(() => {
    const rows = query.data ?? []
    return BUCKETS.map(b => ({ ...b, rows: rows.filter(b.match).slice(0, 6) }))
  }, [query.data])
  const anyRows = buckets.some(b => b.rows.length > 0)

  return (
    <section className="admin-panel" aria-labelledby="threshold-heading">
      <div className="admin-panel-head">
        <h2 id="threshold-heading">Campaign thresholds</h2>
        <Link className="admin-link" to="/admin/campaigns">
          View all
        </Link>
      </div>
      {query.error ? (
        <AdminError onRetry={query.reload} />
      ) : query.loading && !query.data ? (
        <Loading />
      ) : !anyRows ? (
        <Empty title="No campaigns near threshold" message="Campaigns appear here as they approach their configured supporter threshold." />
      ) : (
        <div className="admin-threshold-groups">
          {buckets
            .filter(b => b.rows.length > 0)
            .map(b => (
              <div key={b.key} className="admin-threshold-group">
                <h3>
                  {b.label} <span className="admin-count-pill">{b.rows.length}</span>
                </h3>
                <ul className="admin-threshold-list">
                  {b.rows.map(c => (
                    <CampaignRow key={c.campaignId} c={c} />
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </section>
  )
}

/* ------------------------------ recent activity ---------------------------- */

const SOURCE_LABEL: Record<string, { label: string; tone: 'info' | 'normal' | 'muted' }> = {
  admin_action: { label: 'Admin', tone: 'info' },
  system: { label: 'System', tone: 'muted' },
  user_event: { label: 'User', tone: 'normal' },
}

function RecentActivity() {
  const query = useAdminQuery(() => getRecentActivity(20), [])
  return (
    <section className="admin-panel" aria-labelledby="activity-heading">
      <div className="admin-panel-head">
        <h2 id="activity-heading">Recent activity</h2>
      </div>
      {query.error ? (
        <AdminError onRetry={query.reload} />
      ) : query.loading && !query.data ? (
        <Loading />
      ) : (query.data ?? []).length === 0 ? (
        <Empty title="No recent activity" message="Administrative actions, notifications and new submissions appear here." />
      ) : (
        <ul className="admin-activity-list">
          {(query.data ?? []).map((a, idx) => {
            const src = SOURCE_LABEL[a.source] ?? { label: humanize(a.source), tone: 'normal' as const }
            return (
              <li key={`${a.at}:${idx}`} className="admin-activity-row">
                <Chip tone={src.tone}>{src.label}</Chip>
                <span className="admin-activity-body">
                  <span className="admin-activity-title">{a.title}</span>
                  {a.detail && <span className="admin-activity-detail">{a.detail}</span>}
                </span>
                <span className="admin-queue-age" title={a.at}>
                  {timeAgo(a.at)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* --------------------------------- overview -------------------------------- */

export function OverviewPage() {
  return (
    <div className="admin-overview">
      <AdminPageHeader title="Overview" description="What needs attention across Open Floor right now — with why, how urgent, and how long it has waited." />
      <AttentionCards />
      <QueuePreview />
      <div className="admin-two-col">
        <ThresholdPanel />
        <RecentActivity />
      </div>
    </div>
  )
}
