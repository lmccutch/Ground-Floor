import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { GENERIC_AUTH_ERROR, mapUsernameError, validateUsername } from '../lib/authValidation'
import { Modal } from './Modal'

const investorTypes = ['Individual investor', 'Finance professional', 'Industry professional', 'Other']

/**
 * The inline sign-in gate opened by requireAuth(). It is a compact password login
 * (username OR email + password) with links to the full /signup and
 * /forgot-password pages, plus the account-completion step shown once a signed-in
 * user still needs a username or display name. Passwords are handled only by
 * Supabase Auth — nothing here stores, logs, or forwards a password.
 */
export function AuthModal({ action, onClose }: { action: string; onClose: () => void }) {
  const { profile, login, completeProfile, demoMode } = useMvp()
  const needsUsername = !demoMode && Boolean(profile) && !profile?.username
  const needsCompletion = Boolean(profile) && (!profile?.complete || needsUsername)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [investorType, setInvestorType] = useState(investorTypes[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Once the account is fully set up there is nothing left to do here.
  useEffect(() => {
    if (profile && !needsCompletion) onClose()
  }, [profile, needsCompletion, onClose])

  async function submitLogin(event: React.FormEvent) {
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
      // The profile effect advances to completion or closes the dialog.
    } catch {
      setError(GENERIC_AUTH_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function submitCompletion(event: React.FormEvent) {
    event.preventDefault()
    if (!profile || busy) return
    setError('')
    if (needsUsername) {
      const usernameError = validateUsername(username)
      if (usernameError) {
        setError(usernameError)
        return
      }
    }
    setBusy(true)
    try {
      await completeProfile({
        displayName: displayName.trim() || profile.displayName,
        username: needsUsername ? username.trim() : undefined,
        investorType,
      })
      // The profile effect closes the dialog once setup is complete.
    } catch (caught) {
      setError(mapUsernameError(caught instanceof Error ? caught.message : undefined))
      setBusy(false)
    }
  }

  if (profile && needsCompletion) {
    return (
      <Modal onClose={onClose}>
        <form onSubmit={submitCompletion}>
          <span className="eyebrow">Welcome to Open Floor</span>
          <h2>One quick profile detail.</h2>
          <p className="modal-copy">This is how your questions and support appear to other shareholders.</p>
          {needsUsername && (
            <label className="field">
              Username
              <input
                className="text-input"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="e.g. quiet_investor"
                autoComplete="username"
                maxLength={30}
              />
            </label>
          )}
          <label className="field">
            Display name
            <input
              className="text-input"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              placeholder={profile.displayName}
              maxLength={60}
              autoFocus={!needsUsername}
            />
          </label>
          <label className="field">
            Investor type
            <select className="text-input" value={investorType} onChange={event => setInvestorType(event.target.value)}>
              {investorTypes.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Continue'} <ChevronRight size={15} />
          </button>
        </form>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submitLogin}>
        <span className="eyebrow">Sign in to continue</span>
        <h2>Keep your voice in the room.</h2>
        <p className="modal-copy">Browse freely — sign in when you want to {action}.</p>
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
        <label className="field">
          Password
          <span className="password-field">
            <input
              className="text-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(show => !show)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'} <LogIn size={15} />
        </button>
        <div className="auth-modal-links">
          <Link to="/signup" onClick={onClose}>
            Create account
          </Link>
          <Link to="/forgot-password" onClick={onClose}>
            Forgot password?
          </Link>
        </div>
        <p className="privacy-note">
          <ShieldCheck size={15} /> No brokerage credentials. We never see your holdings.
        </p>
      </form>
    </Modal>
  )
}
