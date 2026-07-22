import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { resendVerificationEmail } from '../../lib/api'
import { looksLikeEmail } from '../../lib/authValidation'
import { parseRateLimit } from '../../lib/authClient'
import { track } from '../../lib/analytics'
import { AuthLayout } from './AuthLayout'

// Redirect target for the verification link. supabase-js consumes the token from
// the URL and establishes a session (email now confirmed); the context reflects
// that via profile.emailVerified. This screen also lets a user resend the email.
export function VerifyEmailPage() {
  const { profile } = useMvp()
  const [params] = useSearchParams()
  const linkError = params.get('error_description') || params.get('error')
  const verified = Boolean(profile?.emailVerified)

  const [email, setEmail] = useState(params.get('email') ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [resent, setResent] = useState(false)
  const trackedVerified = useRef(false)

  useEffect(() => {
    if (verified && !trackedVerified.current) {
      trackedVerified.current = true
      track('email_verified', {})
    }
  }, [verified])

  useEffect(() => {
    track('email_verification_prompted', {})
  }, [])

  async function resend(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setMessage('')
    if (!looksLikeEmail(email)) {
      setMessage('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await resendVerificationEmail(email)
      setResent(true)
    } catch (caught) {
      const info = parseRateLimit(caught)
      setMessage(
        info.isRateLimited
          ? 'A verification email was recently sent. Please wait a moment before requesting another.'
          : 'If that address needs verification, a new email is on its way.',
      )
      setResent(true)
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return (
      <AuthLayout
        eyebrow="Email verified"
        title="Your email is confirmed."
        subtitle="You can now sign in with your username or email and password."
        footer={
          <p>
            <Link to="/companies">Go to your dashboard</Link>
          </p>
        }
      >
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <Link className="btn primary" to="/login">
            Continue to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Verify your email"
      title={linkError ? 'That verification link didn’t work.' : 'Verify your email address.'}
      subtitle={
        linkError
          ? 'The link may have expired or already been used. Request a new one below.'
          : 'Open the verification link we emailed you. Didn’t get it? Resend it below.'
      }
      footer={
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {resent ? (
        <div className="success-state">
          <div className="success-icon">
            <Mail size={22} />
          </div>
          <p>{message || 'If that address needs verification, a new email is on its way. Check your inbox and spam folder.'}</p>
        </div>
      ) : (
        <form onSubmit={resend} noValidate>
          <label className="field">
            Email
            <input
              className="text-input"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Resend verification email'} <Mail size={15} />
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
