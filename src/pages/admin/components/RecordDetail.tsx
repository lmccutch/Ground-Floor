import { useState, type ReactNode } from 'react'
import { getRecordDetail, type EntityType } from '../../../lib/adminApi'
import { formatDateTime, humanize, timeAgo } from '../../../lib/adminFormat'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { AdminError, Chip, DrawerSection, Empty, Field, Loading } from './adminUi'
import { EmailTimeline } from './EmailTimeline'
import { ReplyForm } from './ReplyForm'
import { Attachments } from './Attachments'

/* ===========================================================================
   The shared lower half of a bug or support detail drawer: reply composer,
   email history, attachments, related notifications, work-queue state and audit
   history.

   Each block loads through its own guarded RPC and renders its own empty/error
   state, so a failure in one (say, the email history) never blanks the record
   the operator actually opened.
   =========================================================================== */

export function RecordDetail({ entityType, entityId, reference, category, replyEnabled, children }: {
  entityType: EntityType
  entityId: string
  /** BUG-XXXXXXXX or the ticket number. */
  reference?: string
  /** Support category — decides which Workspace alias replies land in. */
  category?: string
  /** False when the submission carries no email address. */
  replyEnabled: boolean
  /** The record-specific fields rendered above the shared sections. */
  children?: ReactNode
}) {
  // Bumped after a reply is sent so the detail bundle and the email timeline both
  // refetch — the operator sees the recorded reply immediately, from the server.
  const [version, setVersion] = useState(0)
  const query = useAdminQuery(() => getRecordDetail(entityType, entityId), [entityType, entityId, version])
  const detail = query.data

  return (
    <div className="admin-detail">
      {children}

      {/* ------------------------------- reply ------------------------------ */}
      <div className="admin-detail-block">
        {query.error ? (
          <AdminError
            message="The reply address could not be read, so replying is disabled until this loads."
            onRetry={query.reload}
          />
        ) : query.loading && !detail ? (
          <Loading label="Loading record details…" />
        ) : (
          <ReplyForm
            entityType={entityType}
            entityId={entityId}
            reference={reference}
            category={category}
            recipientMasked={detail?.recipientMasked}
            hasRecipient={replyEnabled && Boolean(detail?.recipientMasked)}
            onSent={() => setVersion(v => v + 1)}
          />
        )}
      </div>

      {/* --------------------------- recorded replies ----------------------- */}
      <DrawerSection title="Replies sent from Open Floor" count={detail?.replies.length}>
        {detail && detail.replies.length > 0 ? (
          <ol className="admin-reply-list">
            {detail.replies.map(r => (
              <li key={r.id}>
                <div className="admin-reply-item-head">
                  <strong>{r.subject}</strong>
                  {r.status && <Chip tone="muted">{humanize(r.status)}</Chip>}
                </div>
                <p className="admin-reply-item-meta">
                  {r.authorName ?? 'Administrator'} → {r.recipientMasked ?? 'recipient'} · {timeAgo(r.createdAt)} · replies
                  go to {r.replyToAlias}@open-floor.ca
                </p>
                <p className="admin-longtext">{r.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <Empty title="No replies sent" message="Nothing has been emailed to this person from the console." />
        )}
      </DrawerSection>

      {/* ----------------------------- attachments -------------------------- */}
      {entityType === 'bug_report' && (
        <DrawerSection title="Attachments" count={detail?.attachments.length}>
          {detail ? <Attachments attachments={detail.attachments} /> : <Loading />}
        </DrawerSection>
      )}

      {/* ---------------------------- email history ------------------------- */}
      <DrawerSection title="Email delivery history" defaultOpen>
        <EmailTimeline entityType={entityType} entityId={entityId} version={version} />
      </DrawerSection>

      {/* ------------------------- queue + notifications -------------------- */}
      <DrawerSection title="Work queue and alerts" count={(detail?.queue.length ?? 0) + (detail?.notifications.length ?? 0)}>
        {detail ? (
          <>
            <Field label="Work-queue state">
              {detail.queue.length > 0 ? (
                <>
                  <Chip tone="high">{humanize(detail.queue[0].priority)}</Chip> {detail.queue[0].reason}
                </>
              ) : (
                'Not currently in the work queue.'
              )}
            </Field>
            {detail.notifications.length > 0 ? (
              <ul className="admin-plain-list">
                {detail.notifications.map(n => (
                  <li key={n.id}>
                    <Chip tone={n.severity === 'critical' || n.severity === 'high' ? 'critical' : 'muted'}>{humanize(n.severity)}</Chip>{' '}
                    {n.title} · {timeAgo(n.createdAt)}
                    {n.dismissedAt ? ' · dismissed' : n.readAt ? ' · read' : ' · unread'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-inline-note">No alerts have been raised for this record.</p>
            )}
          </>
        ) : (
          <Loading />
        )}
      </DrawerSection>

      {/* ------------------------------- audit ------------------------------ */}
      <DrawerSection title="Audit history" count={detail?.audit.length}>
        {detail && detail.audit.length > 0 ? (
          <ul className="admin-plain-list">
            {detail.audit.map(a => (
              <li key={a.id}>
                <strong>{humanize(a.action)}</strong> · {a.actorName ?? 'Administrator'} ·{' '}
                <span title={formatDateTime(a.createdAt)}>{timeAgo(a.createdAt)}</span>
                {a.reason && <span className="admin-audit-reason"> — {a.reason}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No recorded actions" message="Nothing has been done to this record yet." />
        )}
      </DrawerSection>

      {detail?.generatedAt && (
        <p className="admin-generated-at">Details read {timeAgo(detail.generatedAt)}.</p>
      )}
    </div>
  )
}
