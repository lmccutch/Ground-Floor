import { Link } from 'react-router-dom'
import { getQuestions, moderateQuestion, type AdminQuestion } from '../../../lib/adminApi'
import { formatDateTime, humanize, statusTone, timeAgo } from '../../../lib/adminFormat'
import { companyPath } from '../../../lib/routes'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { ActionBar, type AdminAction } from '../components/actions'
import { MODERATION_REASONS } from './moderationReasons'
import { Chip, CopyId, Field } from '../components/adminUi'

const MOD = ['pending_review', 'published', 'reported', 'hidden', 'removed', 'restored', 'archived']

const HIDDEN_STATES = ['hidden', 'removed', 'archived']

const questionActions: AdminAction<AdminQuestion>[] = [
  {
    key: 'publish',
    label: 'Publish',
    available: q => q.moderationStatus !== 'published',
    consequence: 'Makes the question publicly visible. Report and moderation history are preserved.',
    reversible: true,
    run: q => moderateQuestion({ id: q.id, action: 'publish' }),
  },
  {
    key: 'hide',
    label: 'Hide',
    available: q => q.moderationStatus !== 'hidden' && q.moderationStatus !== 'removed',
    consequence: 'Removes the question from public view. The original text is retained and can be restored.',
    reversible: true,
    reason: { label: 'Reason', required: true, options: MODERATION_REASONS, requireTextFor: 'other' },
    run: (q, reason) => moderateQuestion({ id: q.id, action: 'hide', reason }),
  },
  {
    key: 'remove',
    label: 'Remove',
    tone: 'critical',
    available: q => q.moderationStatus !== 'removed',
    consequence: 'Removes the question from public view as a moderation action. The original content is never deleted and can be restored.',
    reversible: true,
    reason: { label: 'Reason', required: true, options: MODERATION_REASONS, requireTextFor: 'other' },
    run: (q, reason) => moderateQuestion({ id: q.id, action: 'remove', reason }),
  },
  {
    key: 'restore',
    label: 'Restore',
    available: q => HIDDEN_STATES.includes(q.moderationStatus),
    consequence: 'Returns the question to public view. Moderation history is preserved.',
    reversible: true,
    reason: { label: 'Note (optional)', required: false },
    run: (q, reason) => moderateQuestion({ id: q.id, action: 'restore', reason }),
  },
  {
    key: 'archive',
    label: 'Archive',
    available: q => q.moderationStatus !== 'archived',
    consequence: 'Archives the question. It stays available to administrators.',
    reversible: true,
    reason: { label: 'Note (optional)', required: false },
    run: (q, reason) => moderateQuestion({ id: q.id, action: 'archive', reason }),
  },
]

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
      renderDetail={(q, helpers) => (
        <div className="admin-detail">
          <ActionBar row={q} actions={questionActions} onDone={() => { helpers.refresh(); helpers.close() }} />
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
          <Field label="Moderated by">{q.moderatedByName ?? '—'}</Field>
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
