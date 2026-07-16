import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Mail, ShieldCheck } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import {
  clearRememberedEmail,
  DEFAULT_COOLDOWN_SECONDS,
  getCooldownRemainingSeconds,
  getRememberedEmail,
  looksLikeEmail,
  normalizeEmail,
  parseRateLimit,
  startCooldown,
} from '../lib/authClient'
import { Modal } from './Modal'

const investorTypes = ['Individual investor', 'Finance professional', 'Industry professional', 'Other']

export function AuthModal({ action, onClose }: { action: string; onClose: () => void }) {
  const { profile, signIn, completeProfile, demoMode } = useMvp()
  const remembered = useMemo(() => getRememberedEmail(), [])
  const [email, setEmail] = useState(remembered ?? '')
  const [showReturning, setShowReturning] = useState(Boolean(remembered))
  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [investorType, setInvestorType] = useState(investorTypes[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(() => getCooldownRemainingSeconds())

  // Once the profile is confirmed there is nothing left to do here.
  useEffect(() => {
    if (profile?.complete) onClose()
  }, [profile, onClose])

  // Drive the live cooldown countdown from sessionStorage, so a refresh cannot
  // bypass it. The interval only runs while a cooldown is active.
  const cooldownActive = cooldown > 0
  useEffect(() => {
    if (!cooldownActive) return
    const id = setInterval(() => {
      const remaining = getCooldownRemainingSeconds()
      setCooldown(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownActive])

  function beginCooldown(seconds: number) {
    startCooldown(seconds)
    setCooldown(getCooldownRemainingSeconds())
  }

  async function requestLink() {
    setError('')
    // Prevent duplicate submissions while a request is in flight or cooling down.
    if (busy || cooldown > 0) return
    const normalized = normalizeEmail(email)
    if (!looksLikeEmail(normalized)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await signIn(normalized)
      // Real magic-link mode: link sent — start the resend cooldown and confirm.
      if (!demoMode) {
        beginCooldown(DEFAULT_COOLDOWN_SECONDS)
        setSent(true)
      }
    } catch (caught) {
      const info = parseRateLimit(caught)
      if (info.isRateLimited) {
        if (info.retryAfterSeconds && info.retryAfterSeconds > 0) beginCooldown(info.retryAfterSeconds)
        setError(
          info.retryAfterSeconds
            ? `A sign-in link was recently sent. Please wait ${info.retryAfterSeconds} seconds before requesting another.`
            : 'A sign-in link was recently sent. Please wait a moment before requesting another.',
        )
      } else {
        // Generic message only for genuinely unexpected failures.
        setError('We could not start sign-in. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  function submitEmail(event: React.FormEvent) {
    event.preventDefault()
    void requestLink()
  }

  function useDifferentEmail() {
    clearRememberedEmail()
    setEmail('')
    setShowReturning(false)
    setSent(false)
    setError('')
  }

  async function finishProfile(event: React.FormEvent) {
    event.preventDefault()
    if (!profile) return
    setError('')
    setBusy(true)
    try {
      await completeProfile({ displayName: name.trim() || profile.displayName, investorType })
      // The profile effect above closes the dialog.
    } catch {
      setError('We could not save your profile. Please try again.')
      setBusy(false)
    }
  }

  if (profile?.complete) return null

  const sendLabel = busy
    ? 'Sending…'
    : demoMode
      ? 'Continue'
      : cooldown > 0
        ? `Send another link in ${cooldown}s`
        : 'Send magic link'

  return (
    <Modal onClose={onClose}>
      {profile ? (
        <form onSubmit={finishProfile}>
          <span className="eyebrow">Welcome to GroundFloor</span>
          <h2>One quick profile detail.</h2>
          <p className="modal-copy">This is how your questions and support appear to other shareholders.</p>
          <label className="field">
            Display name
            <input
              className="text-input"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder={profile.displayName}
              maxLength={60}
              autoFocus
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
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Continue'} <ChevronRight size={15} />
          </button>
        </form>
      ) : sent && !demoMode ? (
        <div className="success-state">
          <div className="success-icon">
            <Mail size={22} />
          </div>
          <h2>Check your inbox.</h2>
          <p>
            We sent a secure magic link to <b>{email}</b>. Follow it to continue and {action}.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn primary" type="button" onClick={() => void requestLink()} disabled={busy || cooldown > 0}>
            {busy ? 'Sending…' : cooldown > 0 ? `Send another link in ${cooldown}s` : 'Send another link'}
          </button>
          <button className="btn ghost" type="button" onClick={useDifferentEmail}>
            Use a different email
          </button>
          <p className="privacy-note" aria-live="polite">
            {cooldown > 0
              ? "Didn’t get it? You can resend once the timer ends — also check spam."
              : 'Didn’t get it? Resend the link or check your spam folder.'}
          </p>
        </div>
      ) : (
        <form onSubmit={submitEmail}>
          <span className="eyebrow">Sign in to continue</span>
          <h2>Keep your voice in the room.</h2>
          <p className="modal-copy">Browse freely — we only ask for an email when you want to {action}.</p>
          {showReturning && (
            <div className="returning-note" role="status">
              <span className="returning-title">Welcome back.</span> We remember this email on this device to make
              sign-in faster.
            </div>
          )}
          <label className="field">
            Email address
            <input
              className="text-input"
              type="email"
              value={email}
              onChange={event => {
                setEmail(event.target.value)
                if (showReturning) setShowReturning(false)
              }}
              placeholder="you@example.com"
              autoFocus
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full" type="submit" disabled={busy || (!demoMode && cooldown > 0)}>
            {sendLabel} <Mail size={15} />
          </button>
          {showReturning && (
            <button className="btn ghost small full" type="button" onClick={useDifferentEmail}>
              Use a different email
            </button>
          )}
          <p className="privacy-note">
            <ShieldCheck size={15} /> No password. No brokerage credentials. Unsubscribe anytime.
          </p>
        </form>
      )}
    </Modal>
  )
}
