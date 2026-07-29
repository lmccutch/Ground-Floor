import { useState } from 'react'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { getEmailHistory, retryEmail, type EmailAttempt } from '../../../lib/adminApi'
import { formatDateTime, timeAgo, type Tone } from '../../../lib/adminFormat'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { AdminError, Chip, CopyValue, Empty, Field, Loading } from './adminUi'

/* ===========================================================================
   Email delivery history for one bug report or support ticket.

   Everything shown here is provider evidence the backend actually recorded. A
   message with no delivery confirmation is never described as delivered, and the
   retry control is offered only when the SERVER has said the attempt is eligible
   (admin_email_history returns the same eligibility decision the retry RPC
   enforces), so the UI can never advertise an action the server will refuse.

   Recipients arrive already masked from the database — a full address is never
   fetched into this component.
   =========================================================================== */

/** Human labels for the template registry. Anything unrecognised falls back to a
 *  readable form of its own name rather than a made-up description. */
const TEMPLATE_LABEL: Record<string, string> = {
  admin_reply: 'Administrator reply',
  bug_report_received: 'Confirmation sent to submitter',
  support_ticket_received: 'Confirmation sent to submitter',
  admin_new_bug_alert: 'Admin alert',
  admin_new_support_alert: 'Admin alert',
  admin_email_delivery_failure: 'Admin alert — delivery failure',
  bug_more_information_requested: 'More information requested',
  bug_fixed: 'Bug marked fixed',
  bug_deployed: 'Fix deployed',
  support_response_recorded: 'Response recorded',
  company_request_approved: 'Company request approved',
  company_request_rejected: 'Company request declined',
  company_request_needs_information: 'Company request — more information needed',
  question_removed: 'Question removed',
  question_restored: 'Question restored',
}

function templateLabel(t: string): string {
  return TEMPLATE_LABEL[t] ?? t.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
}

/** Plain-language delivery state. Deliberately never says "delivered" for a
 *  status the provider has not confirmed. */
const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued — not yet handed to the provider',
  sent: 'Sent — accepted by the provider, delivery not yet confirmed',
  delivered: 'Delivered to the recipient',
  delayed: 'Delivery delayed',
  bounced: 'Delivery failed — bounced',
  complained: 'Complaint received — recipient marked it as spam',
  failed: 'Delivery failed',
  suppressed: 'Suppressed by the provider',
}

function statusTone(status: string): Tone {
  if (status === 'delivered') return 'success'
  if (status === 'sent') return 'info'
  if (status === 'queued' || status === 'delayed') return 'high'
  if (status === 'complained') return 'critical'
  if (status === 'bounced' || status === 'failed' || status === 'suppressed') return 'critical'
  return 'normal'
}

function newToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/* ------------------------------- retry control ----------------------------- */

function RetryButton({ attempt, onDone }: { attempt: EmailAttempt; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Generated once per confirmation dialog, so the confirm button can be pressed
  // twice without producing two attempts.
  const [token, setToken] = useState(newToken)

  const ineligible = attempt.retryIneligibleReason
  if (ineligible) {
    return (
      <p className="admin-retry-blocked">
        <strong>Retry unavailable.</strong> {ineligible}
      </p>
    )
  }

  async function run() {
    setBusy(true)
    setError(null)
    try {
      await retryEmail({ messageId: attempt.id, clientToken: token })
      setConfirming(false)
      setToken(newToken())
      onDone()
    } catch (e) {
      setError((e as Error)?.message ?? 'The retry could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  if (!confirming) {
    return (
      <div className="admin-retry">
        <button className="btn small secondary" onClick={() => setConfirming(true)}>
          <RotateCcw size={13} aria-hidden="true" /> Retry this message
        </button>
        {error && (
          <p className="admin-action-error" role="alert">
            <AlertTriangle size={14} aria-hidden="true" /> {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="admin-retry is-confirming" role="group" aria-label="Confirm retry">
      <p>
        Send this message again to <strong>{attempt.recipientMasked ?? 'the recipient'}</strong>? This creates a new,
        linked attempt — the original record and its provider evidence are kept unchanged. Requesting a retry is not
        proof that it will be delivered.
      </p>
      {error && (
        <p className="admin-action-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}
      <div className="admin-action-buttons">
        <button className="btn ghost small" onClick={() => setConfirming(false)} disabled={busy}>
          Cancel
        </button>
        <button className="btn small primary" onClick={() => void run()} disabled={busy} aria-busy={busy}>
          {busy ? (
            <>
              <Loader2 className="spin" size={13} aria-hidden="true" /> Retrying…
            </>
          ) : (
            'Confirm retry'
          )}
        </button>
      </div>
    </div>
  )
}

/* -------------------------------- one attempt ------------------------------ */

function Attempt({ attempt, onChanged }: { attempt: EmailAttempt; onChanged: () => void }) {
  const isRetry = Boolean(attempt.retryOfMessageId)
  return (
    <li className={`admin-email-attempt status-${attempt.status}`}>
      <div className="admin-email-attempt-head">
        <span className="admin-email-purpose">{templateLabel(attempt.template)}</span>
        <Chip tone={statusTone(attempt.status)}>{STATUS_LABEL[attempt.status] ?? attempt.status}</Chip>
      </div>

      <div className="admin-email-meta">
        <span>To {attempt.recipientMasked ?? 'an unrecorded address'}</span>
        <span>·</span>
        <span>{attempt.isSystemSend ? 'Sent automatically by Open Floor' : `Sent by ${attempt.sendingActorName ?? 'the administrator'}`}</span>
        {isRetry && (
          <>
            <span>·</span>
            <span className="admin-email-retry-tag">Retry — attempt {attempt.attemptNumber}</span>
          </>
        )}
      </div>

      <dl className="admin-email-times">
        <div>
          <dt>Created</dt>
          <dd title={formatDateTime(attempt.createdAt)}>{timeAgo(attempt.createdAt)}</dd>
        </div>
        <div>
          <dt>Sent</dt>
          <dd>{attempt.sentAt ? timeAgo(attempt.sentAt) : 'Not sent'}</dd>
        </div>
        <div>
          <dt>Delivered</dt>
          <dd>{attempt.deliveredAt ? timeAgo(attempt.deliveredAt) : 'Not confirmed'}</dd>
        </div>
      </dl>

      {(attempt.errorCode || attempt.errorMessage) && (
        <div className="admin-email-failure">
          <span className="admin-email-failure-label">
            {attempt.failureCategory ? attempt.failureCategory.replace(/_/g, ' ') : attempt.errorCode}
          </span>
          {attempt.errorMessage && <p>{attempt.errorMessage}</p>}
        </div>
      )}

      {attempt.providerMessageId && (
        <div className="admin-email-provider">
          <span className="admin-field-label">Provider message ID</span>
          <CopyValue value={attempt.providerMessageId} label="provider message ID" />
        </div>
      )}

      <p className="admin-email-events">
        {attempt.eventCount > 0
          ? `${attempt.eventCount} signed delivery event${attempt.eventCount === 1 ? '' : 's'} received, most recently ${timeAgo(attempt.lastEventAt)}.`
          : 'No signed delivery event has been received for this message yet.'}
      </p>

      <RetryButton attempt={attempt} onDone={onChanged} />
    </li>
  )
}

/* -------------------------------- timeline --------------------------------- */

export function EmailTimeline({ entityType, entityId, version = 0, onChanged }: {
  entityType: 'bug_report' | 'support_ticket'
  entityId: string
  /** Bump to reload after a reply is sent. */
  version?: number
  onChanged?: () => void
}) {
  const query = useAdminQuery(() => getEmailHistory(entityType, entityId), [entityType, entityId, version])

  if (query.error) return <AdminError onRetry={query.reload} message="The email history could not be loaded." />
  if (query.loading && !query.data) return <Loading label="Loading email history…" />
  const rows = query.data ?? []
  if (rows.length === 0) {
    return (
      <Empty
        title="No email recorded"
        message="Open Floor has not attempted any email for this record. If the submitter left no address, none was possible."
      />
    )
  }

  return (
    <>
      <Field label="Inbound replies">
        <p className="admin-inline-note">
          Open Floor has no inbound email ingestion. If the recipient replies, it arrives in the Workspace alias mailbox —
          it will not appear here.
        </p>
      </Field>
      <ol className="admin-email-timeline">
        {rows.map(a => (
          <Attempt
            key={a.id}
            attempt={a}
            onChanged={() => {
              query.reload()
              onChanged?.()
            }}
          />
        ))}
      </ol>
    </>
  )
}
