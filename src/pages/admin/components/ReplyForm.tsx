import { useId, useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, Send } from 'lucide-react'
import { sendAdminReply, type EntityType } from '../../../lib/adminApi'

/* ===========================================================================
   Administrator reply composer.

   Security properties this component depends on, and deliberately does NOT try
   to implement itself:
     * The RECIPIENT is never sent from here. There is no recipient field and no
       recipient parameter — the server reads the address off the bug report or
       support ticket. The masked address below is display only.
     * Subject and body are sanitized server-side, and the sanitized values are
       what get sent, so what the archive shows is what the person received.
     * The compose token is generated ONCE per open composer. Pressing Send twice,
       refreshing mid-send, or a network retry all resolve to the same recorded
       reply and a single delivery.

   It never reports success before the server confirms, and it never touches the
   record's status — sending a reply is not a resolution.
   =========================================================================== */

const MAX_SUBJECT = 200
const MAX_BODY = 5000

function newToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Which Workspace alias the recipient's reply will land in. Mirrors the mapping
 *  enforced in admin_create_reply — shown so the operator knows where to look. */
function aliasFor(entityType: EntityType, category?: string): string {
  if (entityType === 'bug_report') return 'bugs@open-floor.ca'
  if (category === 'privacy') return 'privacy@open-floor.ca'
  if (category === 'technical_support' || category === 'bug' || category === 'company_management') return 'support@open-floor.ca'
  return 'contact@open-floor.ca'
}

export function ReplyForm({ entityType, entityId, reference, recipientMasked, category, hasRecipient, onSent }: {
  entityType: EntityType
  entityId: string
  /** BUG-XXXXXXXX or the ticket number, used to prefill the subject. */
  reference?: string
  recipientMasked?: string
  category?: string
  hasRecipient: boolean
  onSent: () => void
}) {
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(reference ? `Re: [${reference}]` : 'Re: your message to Open Floor')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<'sent' | 'duplicate' | null>(null)
  // One token per composer instance: the identity of THIS reply.
  const [token, setToken] = useState(newToken)

  const alias = useMemo(() => aliasFor(entityType, category), [entityType, category])
  const subjectOk = subject.trim().length >= 3 && subject.length <= MAX_SUBJECT
  const bodyOk = body.trim().length >= 10 && body.length <= MAX_BODY
  const canSend = subjectOk && bodyOk && !sending

  if (!hasRecipient) {
    return (
      <div className="admin-reply-blocked">
        <p>
          <strong>No reply address on file.</strong> This submission has no email address, so there is nobody to reply to.
          Record an internal note instead.
        </p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="admin-reply-sent" role="status">
        <Check size={16} aria-hidden="true" />
        <div>
          <p>
            {sent === 'duplicate'
              ? 'This reply was already recorded and sent — nothing was sent a second time.'
              : `Reply recorded and handed to the email provider for ${recipientMasked ?? 'the recipient'}.`}
          </p>
          <p className="admin-inline-note">
            Delivery is confirmed by the provider webhook, not by this form. Watch the email history below for the
            delivery result.
          </p>
          <button
            className="btn ghost small"
            onClick={() => {
              // A NEW reply gets a NEW token — the previous one is spent.
              setToken(newToken())
              setSent(null)
              setBody('')
              setOpen(true)
            }}
          >
            Write another reply
          </button>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <button className="btn small primary admin-reply-open" onClick={() => setOpen(true)}>
        <Send size={14} aria-hidden="true" /> Reply to {entityType === 'bug_report' ? 'reporter' : 'requester'}
      </button>
    )
  }

  async function send() {
    if (!canSend) return
    setSending(true)
    setError(null)
    try {
      const result = await sendAdminReply({ entityType, entityId, subject: subject.trim(), body: body.trim(), clientToken: token })
      setSent(result.status)
      setConfirming(false)
      onSent()
    } catch (e) {
      // Keep the drafted text so the operator can retry without retyping. The
      // token is deliberately NOT regenerated: a retry of the same reply must
      // resolve to the same record, not a second message.
      setError((e as Error)?.message ?? 'The reply could not be sent.')
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-reply-form">
      <div className="admin-reply-head">
        <h3>Reply — this email goes to the person who wrote in</h3>
        <button className="btn ghost small" onClick={() => setOpen(false)} disabled={sending}>
          Cancel
        </button>
      </div>

      <p className="admin-reply-context">
        To <strong>{recipientMasked ?? 'the address on this record'}</strong> · From{' '}
        <code>no-reply@open-floor.ca</code> · Replies go to <code>{alias}</code>
      </p>
      <p className="admin-inline-note">
        This is <strong>not</strong> an internal note — the recipient will read it. Internal notes stay in Open Floor and
        are never included in email. If they reply, it arrives in the {alias} mailbox; Open Floor has no inbound email,
        so it will not appear here.
      </p>

      {/* Labels are siblings of their controls, not wrappers: a wrapping label
          absorbs any hint text into its accessible name, which is what a screen
          reader would then announce as the field's name. */}
      <div className="admin-reply-field">
        <label htmlFor={`${fieldId}-subject`}>Subject</label>
        <input
          id={`${fieldId}-subject`}
          className="text-input"
          value={subject}
          maxLength={MAX_SUBJECT}
          onChange={e => setSubject(e.target.value)}
          disabled={sending}
          aria-invalid={!subjectOk}
        />
      </div>

      <div className="admin-reply-field">
        <label htmlFor={`${fieldId}-body`}>Message</label>
        <textarea
          id={`${fieldId}-body`}
          className="text-input admin-reply-body"
          rows={8}
          value={body}
          maxLength={MAX_BODY}
          onChange={e => setBody(e.target.value)}
          disabled={sending}
          placeholder="Write in plain language. Formatting and links are sent as plain text — HTML is not accepted."
          aria-invalid={body.length > 0 && !bodyOk}
          aria-describedby={`${fieldId}-count`}
        />
        <small id={`${fieldId}-count`} className="admin-reply-count">
          {body.length} / {MAX_BODY} characters. Plain text only — any markup you type is shown literally, never rendered.
        </small>
      </div>

      {/* A faithful preview: the recipient sees exactly these paragraphs. */}
      {bodyOk && (
        <div className="admin-reply-preview">
          <span className="admin-field-label">Preview</span>
          <div className="admin-reply-preview-body">
            <strong>{subject.trim()}</strong>
            {body
              .trim()
              .split(/\n{2,}/)
              .map((p, i) => (
                <p key={i}>{p.replace(/\n/g, ' ')}</p>
              ))}
            <p className="admin-reply-signoff">— Open Floor</p>
          </div>
        </div>
      )}

      {error && (
        <p className="admin-action-error" role="alert">
          <AlertTriangle size={15} aria-hidden="true" /> {error}
        </p>
      )}

      {confirming ? (
        <div className="admin-reply-confirm" role="group" aria-label="Confirm send">
          <p>
            Send this to <strong>{recipientMasked ?? 'the recipient'}</strong>? It cannot be unsent.
          </p>
          <div className="admin-action-buttons">
            <button className="btn ghost small" onClick={() => setConfirming(false)} disabled={sending}>
              Keep editing
            </button>
            <button className="btn small primary" onClick={() => void send()} disabled={sending} aria-busy={sending}>
              {sending ? (
                <>
                  <Loader2 className="spin" size={14} aria-hidden="true" /> Sending…
                </>
              ) : (
                'Send reply'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-action-buttons">
          <button className="btn small primary" onClick={() => setConfirming(true)} disabled={!canSend}>
            <Send size={14} aria-hidden="true" /> Review and send
          </button>
        </div>
      )}
    </div>
  )
}
