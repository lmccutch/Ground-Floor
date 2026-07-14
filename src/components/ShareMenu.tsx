import { useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { canNativeShare, nativeShare, shareHref, withUtm, type ShareContent } from '../lib/share'
import { copyToClipboard } from '../lib/helpers'
import { track } from '../lib/analytics'

/**
 * One share menu for companies, campaigns, and questions: copy link, native
 * browser share (where supported), Reddit, X, LinkedIn, and email. Analytics
 * receive only the event name, entity identifiers, and the channel — never the
 * shared text.
 */
export function ShareMenu({
  content,
  analyticsEvent,
  analyticsProps = {},
  small = false,
}: {
  content: ShareContent
  /** e.g. 'company_shared' | 'question_shared' */
  analyticsEvent: string
  analyticsProps?: Record<string, unknown>
  small?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  async function copy() {
    await copyToClipboard(withUtm(content.url, 'copy_link'))
    setCopied(true)
    track(analyticsEvent, { ...analyticsProps, method: 'copy' })
    setTimeout(() => setCopied(false), 1800)
    closeMenu()
  }

  async function shareNative() {
    const shared = await nativeShare(content)
    if (shared) track(analyticsEvent, { ...analyticsProps, method: 'native' })
    closeMenu()
  }

  const external = (channel: 'reddit' | 'x' | 'linkedin' | 'email') => ({
    href: shareHref(channel, content),
    onClick: () => {
      track(analyticsEvent, { ...analyticsProps, method: channel })
      closeMenu()
    },
  })

  return (
    <details className="share-menu" ref={detailsRef}>
      <summary className={small ? 'link-btn' : 'btn secondary small'}>
        {copied ? <Check size={small ? 12 : 14} /> : <Share2 size={small ? 12 : 14} />} {copied ? 'Link copied' : 'Share'}
      </summary>
      <div className="share-pop">
        <button type="button" onClick={() => void copy()}>
          <Copy size={13} /> Copy link
        </button>
        {canNativeShare() && (
          <button type="button" onClick={() => void shareNative()}>
            <Share2 size={13} /> Share…
          </button>
        )}
        <a {...external('reddit')} target="_blank" rel="noreferrer">
          Share on Reddit
        </a>
        <a {...external('x')} target="_blank" rel="noreferrer">
          Share on X
        </a>
        <a {...external('linkedin')} target="_blank" rel="noreferrer">
          Share on LinkedIn
        </a>
        <a {...external('email')}>Share by email</a>
      </div>
    </details>
  )
}
