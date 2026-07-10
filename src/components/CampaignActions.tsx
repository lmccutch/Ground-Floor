import { useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import {
  followCampaign,
  supportCampaign,
  type Campaign,
  type PositionRange,
  type PublicCompany,
  type ShareholderStatus,
} from '../lib/api'
import { track } from '../lib/analytics'
import { useMvp } from '../context/useMvp'
import { Modal } from './Modal'
import { copyToClipboard } from '../lib/helpers'

const statuses: ShareholderStatus[] = ['Current shareholder', 'Former shareholder', 'Considering investing', 'Following the company', 'Prefer not to say']
const positionRanges: PositionRange[] = ['Under $1,000', '$1,000-$5,000', '$5,000-$25,000', '$25,000-$100,000', 'More than $100,000', 'Prefer not to say']

export function ShareMenu({ company }: { company: PublicCompany }) {
  const [copied, setCopied] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const url = `${window.location.origin}/company/${company.ticker}`
  const text = `I want to hear directly from $${company.ticker} management. Join the campaign, ask a question, and vote on what management should answer.`

  async function copy() {
    await copyToClipboard(url)
    setCopied(true)
    track('company_shared', { ticker: company.ticker, method: 'copy' })
    setTimeout(() => setCopied(false), 1800)
    if (detailsRef.current) detailsRef.current.open = false
  }

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  return (
    <details className="share-menu" ref={detailsRef}>
      <summary className="btn secondary small">
        {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Link copied' : 'Share'}
      </summary>
      <div className="share-pop">
        <button type="button" onClick={() => void copy()}>
          <Copy size={13} /> Copy link
        </button>
        <a
          href={`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          Share on Reddit
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          Share on X
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(`Shareholder campaign for ${company.name}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`} onClick={closeMenu}>
          Share by email
        </a>
      </div>
    </details>
  )
}

export function CampaignActions({
  company,
  campaign,
  onCampaignChange,
}: {
  company: PublicCompany
  campaign: Campaign
  onCampaignChange: (campaign: Campaign | null) => void
}) {
  const { profile, requireAuth } = useMvp()
  const [showSupport, setShowSupport] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function follow() {
    if (campaign.followedByUser || busy) return
    if (!requireAuth('follow this company')) return
    setBusy(true)
    try {
      onCampaignChange(await followCampaign(campaign, profile?.id))
      setNotice('You are following this campaign and will receive updates.')
      track('company_followed', { ticker: company.ticker })
    } catch {
      setNotice('We could not save that. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="action-row">
        <button
          className="btn primary"
          disabled={campaign.supportedByUser}
          onClick={() => {
            if (campaign.supportedByUser) return
            if (requireAuth('support this interview')) setShowSupport(true)
          }}
        >
          {campaign.supportedByUser ? (
            <>
              <Check size={15} /> You support this interview
            </>
          ) : (
            'Support this interview'
          )}
        </button>
        <button className="btn secondary" disabled={campaign.followedByUser || busy} onClick={() => void follow()}>
          {campaign.followedByUser ? (
            <>
              <Check size={15} /> Following
            </>
          ) : (
            'Follow updates'
          )}
        </button>
      </div>
      {notice && (
        <p className="inline-notice">
          <Check size={14} /> {notice}
        </p>
      )}
      {showSupport && (
        <SupportModal
          company={company}
          campaign={campaign}
          onClose={() => setShowSupport(false)}
          onSaved={next => {
            onCampaignChange(next)
            setNotice('')
          }}
        />
      )}
    </>
  )
}

function SupportModal({
  company,
  campaign,
  onClose,
  onSaved,
}: {
  company: PublicCompany
  campaign: Campaign
  onClose: () => void
  onSaved: (campaign: Campaign | null) => void
}) {
  const { profile } = useMvp()
  const [status, setStatus] = useState<ShareholderStatus>('Current shareholder')
  const [position, setPosition] = useState<PositionRange>('Prefer not to say')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      onSaved(await supportCampaign(campaign, status, status === 'Current shareholder' ? position : undefined, profile?.id))
      track('company_supported', { ticker: company.ticker, shareholder_status: status })
      setSaved(true)
    } catch {
      setError('We could not record your support. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {saved ? (
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <h2>You joined the campaign.</h2>
          <p>Your support is self-reported and private. The more shareholders who join, the stronger the case for management to participate.</p>
          <button className="btn primary" type="button" onClick={onClose}>
            Continue
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <span className="eyebrow">Support {company.ticker}</span>
          <h2>Tell us where you stand.</h2>
          <p className="modal-copy">This information is never displayed with your name or position size.</p>
          <label className="field">
            Self-reported shareholder status
            <select className="text-input" value={status} onChange={event => setStatus(event.target.value as ShareholderStatus)}>
              {statuses.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {status === 'Current shareholder' && (
            <label className="field">
              Optional position-size range
              <select className="text-input" value={position} onChange={event => setPosition(event.target.value as PositionRange)}>
                {positionRanges.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          <div className="shares-note">
            Ownership is self-reported — email authentication is not ownership verification.
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Joining…' : 'Join campaign'} <Check size={15} />
          </button>
        </form>
      )}
    </Modal>
  )
}
