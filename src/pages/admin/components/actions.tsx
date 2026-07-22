import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { Tone } from '../../../lib/adminFormat'

/* ===========================================================================
   Shared admin action framework. Every mutation the operator performs runs
   through here: an accessible confirmation dialog that collects a required
   reason where the workflow demands one, disables duplicate submission, shows a
   retryable error while preserving the entered reason, and never optimistically
   reports success before the server confirms. The actual write is a narrow,
   is_admin()-guarded RPC (see adminApi) — never a direct table write.
   =========================================================================== */

export type ReasonField = {
  label?: string
  placeholder?: string
  required?: boolean
  /** Structured reason values render a <select>; omit for a free-text <textarea>. */
  options?: { value: string; label: string }[]
  /** When the selected option equals this value, an extra free-text explanation is required. */
  requireTextFor?: string
}

export type AdminAction<T> = {
  key: string
  label: string
  tone?: Tone
  /** Hidden when this returns false for the current row (state-aware controls). */
  available?: (row: T) => boolean
  /**
   * What will happen. A high-impact action provides this to force a confirmation
   * dialog. Return undefined from the function form to make the action run
   * immediately for this row (e.g. dismiss confirms only for high/critical).
   */
  consequence?: string | ((row: T) => string | undefined)
  /** Whether the action can be undone later (shown to the operator). */
  reversible?: boolean
  /** Honest note about email side effects (this phase sends none). */
  emailNote?: string
  /** Collect a reason / note before running. */
  reason?: ReasonField
  /** Perform the mutation. `reason` is the combined reason text. Throws on failure. */
  run: (row: T, reason: string | undefined) => Promise<void>
}

function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? ''
  if (/not authorized/i.test(msg)) return 'You are not authorized to perform this action.'
  if (/not found/i.test(msg)) return 'That record no longer exists — refresh and try again.'
  // Server validation messages (reason required, invalid transition, not approvable)
  // are safe and useful to surface to the sole operator.
  if (msg && msg.length < 200 && !/duplicate key|constraint|syntax/i.test(msg)) return msg
  return 'The action could not be completed. Please try again.'
}

function resolveConsequence<T>(action: AdminAction<T>, row: T): string | undefined {
  return typeof action.consequence === 'function' ? action.consequence(row) : action.consequence
}

export function ActionBar<T>({ row, actions, onDone }: { row: T; actions: AdminAction<T>[]; onDone: () => void }) {
  const [active, setActive] = useState<AdminAction<T> | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const visible = actions.filter(a => (a.available ? a.available(row) : true))
  if (visible.length === 0) return null

  // A low-risk action (no reason to collect, no consequence to confirm for this
  // row) runs immediately. Anything else opens the confirmation dialog.
  async function activate(a: AdminAction<T>) {
    if (a.reason || resolveConsequence(a, row)) {
      setActive(a)
      return
    }
    setBusyKey(a.key)
    setError(null)
    try {
      await a.run(row, undefined)
      onDone()
    } catch (e) {
      setError(friendlyError(e))
      setBusyKey(null)
    }
  }

  return (
    <div className="admin-actionbar">
      <span className="admin-actionbar-label">Actions</span>
      <div className="admin-actionbar-buttons">
        {visible.map(a => (
          <button key={a.key} className={a.tone === 'critical' ? 'btn small danger' : 'btn small secondary'} onClick={() => void activate(a)} disabled={busyKey != null} aria-busy={busyKey === a.key}>
            {busyKey === a.key ? <Loader2 className="spin" size={14} aria-hidden="true" /> : a.label}
          </button>
        ))}
      </div>
      {error && (
        <div className="admin-action-error" role="alert">
          <AlertTriangle size={15} aria-hidden="true" /> <span>{error}</span>
        </div>
      )}
      {active && <ActionDialog row={row} action={active} onClose={() => setActive(null)} onDone={onDone} />}
    </div>
  )
}

function ActionDialog<T>({ row, action, onClose, onDone }: { row: T; action: AdminAction<T>; onClose: () => void; onDone: () => void }) {
  const [optionValue, setOptionValue] = useState(action.reason?.options?.[0]?.value ?? '')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement | null>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    firstFieldRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [submitting, onClose])

  const consequence = resolveConsequence(action, row)
  const usesOptions = Boolean(action.reason?.options)
  const needsText = action.reason?.requireTextFor != null && optionValue === action.reason.requireTextFor
  const reasonRequired = Boolean(action.reason?.required)

  function combinedReason(): string | undefined {
    if (!action.reason) return undefined
    if (usesOptions) {
      const t = text.trim()
      return t ? `${optionValue}: ${t}` : optionValue || undefined
    }
    return text.trim() || undefined
  }

  const canSubmit = (() => {
    if (submitting) return false
    if (needsText && !text.trim()) return false
    if (reasonRequired) {
      if (usesOptions) return Boolean(optionValue)
      return Boolean(text.trim())
    }
    return true
  })()

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await action.run(row, combinedReason())
      onDone()
    } catch (e) {
      // Preserve the entered reason so the operator can retry without retyping.
      setError(friendlyError(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-action-backdrop" onMouseDown={e => e.target === e.currentTarget && !submitting && onClose()}>
      <div className="admin-action-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} ref={dialogRef}>
        <h2 id={titleId}>{action.label}</h2>
        <div id={descId} className="admin-action-meta">
          {consequence && <p>{consequence}</p>}
          <ul className="admin-action-facts">
            <li>{action.reversible === false ? 'This action is not easily reversible.' : 'This action can be changed later.'}</li>
            <li>{action.emailNote ?? 'No email is sent.'}</li>
          </ul>
        </div>

        {action.reason && (
          <div className="admin-action-field">
            <label htmlFor={`${titleId}-reason`}>
              {action.reason.label ?? 'Reason'}
              {reasonRequired && <span className="admin-req" aria-hidden="true"> *</span>}
            </label>
            {usesOptions ? (
              <>
                <select
                  id={`${titleId}-reason`}
                  className="text-input"
                  value={optionValue}
                  onChange={e => setOptionValue(e.target.value)}
                  ref={el => {
                    firstFieldRef.current = el
                  }}
                >
                  {action.reason.options!.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {needsText && (
                  <textarea
                    className="text-input admin-action-textarea"
                    placeholder="Add the required explanation"
                    value={text}
                    maxLength={2000}
                    onChange={e => setText(e.target.value)}
                    aria-label="Explanation"
                  />
                )}
              </>
            ) : (
              <textarea
                id={`${titleId}-reason`}
                className="text-input admin-action-textarea"
                placeholder={action.reason.placeholder ?? 'Add a note'}
                value={text}
                maxLength={2000}
                onChange={e => setText(e.target.value)}
                ref={el => {
                  firstFieldRef.current = el
                }}
              />
            )}
          </div>
        )}

        {error && (
          <div className="admin-action-error" role="alert">
            <AlertTriangle size={15} aria-hidden="true" /> <span>{error}</span>
          </div>
        )}

        <div className="admin-action-buttons">
          <button
            className="btn ghost small"
            onClick={onClose}
            disabled={submitting}
            ref={el => {
              if (!action.reason) firstFieldRef.current = el
            }}
          >
            Cancel
          </button>
          <button className={action.tone === 'critical' ? 'btn small danger' : 'btn small primary'} onClick={submit} disabled={!canSubmit} aria-busy={submitting}>
            {submitting ? (
              <>
                <Loader2 className="spin" size={14} aria-hidden="true" /> Working…
              </>
            ) : (
              action.label
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
