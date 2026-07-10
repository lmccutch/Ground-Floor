import { useEffect, useState } from 'react'
import { ChevronRight, Mail, ShieldCheck } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { Modal } from './Modal'

const investorTypes = ['Individual investor', 'Finance professional', 'Industry professional', 'Other']

export function AuthModal({ action, onClose }: { action: string; onClose: () => void }) {
  const { profile, signIn, completeProfile, demoMode } = useMvp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [investorType, setInvestorType] = useState(investorTypes[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Once the profile is confirmed there is nothing left to do here.
  useEffect(() => {
    if (profile?.complete) onClose()
  }, [profile, onClose])

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!/.+@.+\..+/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await signIn(email)
      setSent(true)
    } catch {
      setError('We could not start sign-in. Please try again.')
    } finally {
      setBusy(false)
    }
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

  return (
    <Modal onClose={onClose}>
      {profile ? (
        <form onSubmit={finishProfile}>
          <span className="eyebrow">Welcome to Grround Floor</span>
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
          {error && <p className="form-error">{error}</p>}
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
          <button className="btn secondary" onClick={() => setSent(false)}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submitEmail}>
          <span className="eyebrow">Sign in to continue</span>
          <h2>Keep your voice in the room.</h2>
          <p className="modal-copy">Browse freely — we only ask for an email when you want to {action}.</p>
          <label className="field">
            Email address
            <input
              className="text-input"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Sending…' : demoMode ? 'Continue' : 'Send magic link'} <Mail size={15} />
          </button>
          <p className="privacy-note">
            <ShieldCheck size={15} /> No password. No brokerage credentials. Unsubscribe anytime.
          </p>
        </form>
      )}
    </Modal>
  )
}
