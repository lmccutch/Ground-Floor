import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { signOut, updatePassword } from '../../lib/api'
import { validatePassword } from '../../lib/authValidation'
import { track } from '../../lib/analytics'
import { AuthLayout, PasswordField } from './AuthLayout'

// The recovery link lands here. supabase-js (detectSessionInUrl) establishes a
// short-lived recovery session from the URL, which lets updateUser() set a new
// password. This is a password reset — NOT a passwordless login path.
type LinkState = 'checking' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [linkState, setLinkState] = useState<LinkState>(supabase ? 'checking' : 'ready')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const markReady = () => active && setLinkState('ready')

    // A recovery event means the token was accepted.
    const { data: sub } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') markReady()
    })
    // Fallback: if a session already exists (URL processed before this mounted),
    // allow the reset; otherwise treat the link as invalid/expired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady()
    })
    const timer = setTimeout(() => {
      supabase!.auth.getSession().then(({ data }) => {
        if (active) setLinkState(data.session ? 'ready' : 'invalid')
      })
    }, 1500)

    return () => {
      active = false
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError('')
    const policyError = validatePassword(password)
    if (policyError) {
      setError(policyError)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
      track('password_reset_completed', {})
      // Clear the recovery session and send the user to the normal login screen.
      await signOut()
      setDone(true)
    } catch {
      setError('We could not update your password. The link may have expired — request a new one.')
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthLayout
        eyebrow="Password updated"
        title="You’re all set."
        subtitle="Your password has been updated. Sign in with your new password."
        footer={
          <p>
            <Link to="/login">Go to sign in</Link>
          </p>
        }
      >
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <button className="btn primary" type="button" onClick={() => navigate('/login?reset=1')}>
            Sign in
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (linkState === 'invalid') {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title="This link is invalid or has expired."
        subtitle="Reset links can only be used once and expire after a short time."
        footer={
          <p>
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        }
      >
        <div className="success-state">
          <ShieldCheck size={22} />
          <p>For your security, request a fresh link and use it right away.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout eyebrow="Password reset" title="Set a new password" subtitle="Choose a strong password you don’t use elsewhere.">
      <form onSubmit={submit} noValidate>
        <PasswordField label="New password" name="new-password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 10 characters." />
        <PasswordField label="Confirm new password" name="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" type="submit" disabled={busy || linkState === 'checking'}>
          {busy ? 'Updating…' : linkState === 'checking' ? 'Verifying link…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
