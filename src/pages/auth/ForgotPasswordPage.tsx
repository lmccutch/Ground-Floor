import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import { requestPasswordReset } from '../../lib/api'
import { looksLikeEmail } from '../../lib/authValidation'
import { track } from '../../lib/analytics'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!looksLikeEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      // Always resolves; the generic response below never reveals whether the
      // account exists (no account enumeration).
      await requestPasswordReset(email)
      track('password_reset_requested', {})
    } finally {
      setBusy(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title="Check your email."
        subtitle="If an account exists for that address, we’ve sent a link to reset your password."
        footer={
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        }
      >
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <p>The link opens a page where you can set a new password. It expires after a short time for your security.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a link to set a new one."
      footer={
        <p>
          Remembered it? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate>
        <label className="field">
          Email
          <input
            className="text-input"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'} <Mail size={15} />
        </button>
      </form>
    </AuthLayout>
  )
}
