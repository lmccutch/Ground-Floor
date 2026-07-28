import { useEffect, useRef } from 'react'

// Cloudflare Turnstile widget. Renders only when VITE_TURNSTILE_SITE_KEY is set;
// otherwise it renders nothing and submission relies on the server honeypot +
// per-IP rate limiting until the key is configured. The secret is server-side only
// (submit-intake Edge Function) — this component only ever handles the public site
// key and the resulting token.

const SITE_KEY = ((import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '').trim()
export const TURNSTILE_ENABLED = SITE_KEY !== ''

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'))
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('turnstile_load_failed'))
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  // Keep the latest callback without re-running render (avoids re-mounting the widget).
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!TURNSTILE_ENABLED || !containerRef.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
        })
      })
      .catch(() => {
        /* verification is a best-effort front door; the server backstops it */
      })
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current) } catch { /* ignore */ }
      }
    }
  }, [])

  if (!TURNSTILE_ENABLED) return null
  return <div ref={containerRef} className="turnstile-widget" data-testid="turnstile" />
}
