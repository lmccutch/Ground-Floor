import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import { FEEDBACK_CATEGORIES, submitFeedback, type FeedbackCategory } from '../lib/api'
import { track } from '../lib/analytics'
import { useMvp } from '../context/useMvp'
import { Modal } from './Modal'

/**
 * Persistent, unobtrusive "Give feedback" entry, available on every page.
 * Submitting requires a signed-in account (the feedback table deliberately has
 * no anonymous insert path — see docs/core-user-experience.md). Analytics only
 * ever receive the category and route, never the feedback text.
 */
export function FeedbackWidget() {
  const location = useLocation()
  const { profile, requireAuth } = useMvp()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('General feedback')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function openWidget() {
    track('feedback_started', { path: location.pathname })
    setSent(false)
    setMessage('')
    setError('')
    setOpen(true)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const trimmed = message.trim()
    if (trimmed.length < 3) {
      setError('Tell us a little more — at least a few words.')
      return
    }
    if (!profile) {
      // Opens the sign-in dialog; the feedback modal stays open underneath so
      // the typed message is not lost.
      requireAuth('send feedback')
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitFeedback({ category, message: trimmed, pagePath: location.pathname }, profile.id)
      track('feedback_submitted', { category, path: location.pathname })
      setSent(true)
    } catch {
      setError('We could not send your feedback. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="feedback-fab" onClick={openWidget} aria-haspopup="dialog">
        <MessageCircle size={14} /> Give feedback
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          {sent ? (
            <div className="success-state">
              <div className="success-icon">
                <Check size={22} />
              </div>
              <h2>Thanks — got it.</h2>
              <p>Your feedback goes straight to the team building Open Floor.</p>
              <button className="btn primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <span className="eyebrow">Give feedback</span>
              <h2>What should we know?</h2>
              <p className="modal-copy">Broken, confusing, or missing — every report helps. {profile ? '' : 'You’ll be asked to sign in to send it.'}</p>
              <label className="field">
                Category
                <select className="text-input" value={category} onChange={event => setCategory(event.target.value as FeedbackCategory)}>
                  {FEEDBACK_CATEGORIES.map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Feedback
                <textarea
                  maxLength={2000}
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="What happened, or what would make this better?"
                  autoFocus
                />
              </label>
              <small className="char-count">{message.length}/2000</small>
              {error && <p className="form-error">{error}</p>}
              <button className="btn primary full" type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send feedback'} <Check size={15} />
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
