import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { GENERIC_AUTH_ERROR } from '../../lib/authValidation'
import { AuthLayout, PasswordField } from './AuthLayout'

export function LoginPage() {
  const { login, profile } = useMvp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/companies'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Already signed in? Don't show the login screen.
  useEffect(() => {
    if (profile) navigate(redirect, { replace: true })
  }, [profile, navigate, redirect])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!identifier.trim() || !password) {
      setError('Enter your username or email and password.')
      return
    }
    setBusy(true)
    try {
      await login(identifier.trim(), password)
      navigate(redirect, { replace: true })
    } catch {
      // One generic message — never disclose which field was wrong.
      setError(GENERIC_AUTH_ERROR)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to Open Floor"
      subtitle="Use your username or email and password."
      footer={
        <p>
          New to Open Floor? <Link to="/signup">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate>
        <label className="field">
          Username or email
          <input
            className="text-input"
            name="identifier"
            type="text"
            value={identifier}
            onChange={event => setIdentifier(event.target.value)}
            placeholder="you@example.com or username"
            autoComplete="username"
            autoFocus
          />
        </label>
        <PasswordField label="Password" name="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'} <LogIn size={15} />
        </button>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/verify-email">Resend verification email</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
