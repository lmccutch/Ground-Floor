import { Link } from 'react-router-dom'
import { getQuestions, type AdminQuestion } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const MOD = ['pending_review', 'published', 'reported', 'hidden', 'removed', 'restored', 'archived']

const columns: Column<AdminQuestion>[] = [
  { header: 'Question', render: q => <span className="admin-clamp">{q.text}</span> },
  {
    header: 'Company',
    render: q => (q.companyName ? `${q.companyName}${q.ticker ? ` · ${q.ticker}` : ''}` : '—'),
  },
  { header: 'Moderation', render: q => <Chip tone={statusTone(q.moderationStatus)}>{humanize(q.moderationStatus)}</Chip> },
  { header: 'Votes', render: q => q.votes },
  { header: 'Reports', render: q => (q.reportCount > 0 ? <Chip tone="high">{q.reportCount}</Chip> : q.reportCount) },
  { header: 'Age', render: q => timeAgo(q.createdAt) },
]

export function QuestionsPage() {
  return (
    <AdminListPage<AdminQuestion>
      title="Questions"
      description="Every shareholder question with its moderation state. Read-only — moderation actions arrive in the next phase."
      searchPlaceholder="Question text"
      filters={[{ key: 'moderationStatus', label: 'Moderation', options: MOD.map(s => ({ value: s, label: humanize(s) })) }]}
      columns={columns}
      gridTemplate="2.2fr 1.1fr 1fr 0.6fr 0.7fr 0.6fr"
      getRowKey={q => q.id}
      fetchPage={({ search, filters, offset, limit }) =>
        getQuestions({ search, moderationStatus: filters.moderationStatus || undefined, offset, limit })
      }
      emptyTitle="No questions yet"
      emptyMessage="Shareholder questions will appear here."
      detailTitle={() => 'Question detail'}
      renderDetail={q => (
        <div className="admin-detail">
          <div className="admin-detail-chips">
            <Chip tone={statusTone(q.moderationStatus)}>{humanize(q.moderationStatus)}</Chip>
            {q.reportCount > 0 && <Chip tone="high">{q.reportCount} report(s)</Chip>}
          </div>
          <Field label="Question">
            <p className="admin-longtext">{q.text}</p>
          </Field>
          <Field label="Topic">{q.topic ?? '—'}</Field>
          <Field label="Company">{q.companyName ?? '—'}</Field>
          <Field label="Author">{q.authorName ?? '—'}</Field>
          <Field label="Votes">{q.votes}</Field>
          <Field label="Public status">{q.status}</Field>
          <Field label="Submitted">{formatDateTime(q.createdAt)}</Field>
          <Field label="Moderated at">{formatDateTime(q.moderatedAt)}</Field>
          <Field label="Moderation reason">{q.moderationReason ?? '—'}</Field>
          {q.ticker && (
            <Field label="Public page">
              <Link to={companyPath(q.ticker)}>Open company page</Link>
            </Field>
          )}
          <Field label="Question ID">
            <CopyId id={q.id} />
          </Field>
        </div>
      )}
    />
  )
}
